import { Notice } from '@src/notices/entities/notice.entity';
import axios from 'axios';
import * as cheerio from 'cheerio';

const THROTTLE_MS = 1200;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEADLINE_KEYWORDS = [
  '신청기간',
  '신청 기간',
  '모집기간',
  '모집 기간',
  '제출 기한',
  '제출기한',
  '서류접수',
  '서류 접수',
  '입력기한',
  '입력 기한',
  '일시',
  '일정',
  '까지',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fmt = (y: number, m: number, d: number): string => {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const isValidDateParts = (y: number, m: number, d: number): boolean => {
  if (!y || !m || !d) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
};

interface DateParts {
  y: number;
  mo: number;
  da: number;
}

const FULL_DATE_RE = /(\d{4})\s*[.\-년/]\s*(\d{1,2})\s*[.\-월/]\s*(\d{1,2})/g;
const TWO_DIGIT_YEAR_RE =
  /(\d{2})\s*[.\-년/]\s*(\d{1,2})\s*[.\-월/]\s*(\d{1,2})/g;
const MONTH_DAY_RE = /(\d{1,2})\s*[.\-월/]\s*(\d{1,2})/g;
const ISO_DATE_RE = /(\d{4}-\d{2}-\d{2})/;

const parseDateFragment = (
  fragment: string,
  defaultYear: number | null = null,
): DateParts | null => {
  if (!fragment) return null;
  const str = fragment.trim();

  FULL_DATE_RE.lastIndex = 0;
  const f = FULL_DATE_RE.exec(str);
  if (f) {
    const y = Number(f[1]);
    const mo = Number(f[2]);
    const da = Number(f[3]);
    return isValidDateParts(y, mo, da) ? { y, mo, da } : null;
  }

  TWO_DIGIT_YEAR_RE.lastIndex = 0;
  const t = TWO_DIGIT_YEAR_RE.exec(str);
  if (t) {
    const y = 2000 + Number(t[1]);
    const mo = Number(t[2]);
    const da = Number(t[3]);
    return isValidDateParts(y, mo, da) ? { y, mo, da } : null;
  }

  MONTH_DAY_RE.lastIndex = 0;
  const md = MONTH_DAY_RE.exec(str);
  if (md) {
    const mo = Number(md[1]);
    const da = Number(md[2]);
    const y = defaultYear ?? new Date().getFullYear();
    return isValidDateParts(y, mo, da) ? { y, mo, da } : null;
  }

  const iso = str.match(ISO_DATE_RE);
  if (iso) {
    const [y, mo, da] = iso[1].split('-').map(Number);
    if (isValidDateParts(y, mo, da)) return { y, mo, da };
  }

  return null;
};

const normalizeToRange = (
  input: unknown,
): { start: string | null; end: string | null } => {
  if (
    typeof input !== 'string' &&
    typeof input !== 'number' &&
    typeof input !== 'boolean'
  ) {
    return { start: null, end: null };
  }

  let s = String(input);
  s = s.replace(/\([^)]*\)/g, '');
  s = s.replace(/[–—]/g, '-').replace(/[~〜]/g, '~');
  s = s.replace(/,/g, ' ');
  s = s.replace(/\b\d{1,2}:\d{2}\b/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  if (s.includes('~')) {
    const [left = '', right = ''] = s.split('~');
    const leftParsed = parseDateFragment(left, null);
    const leftYear = leftParsed?.y ?? null;
    const start = leftParsed
      ? fmt(leftParsed.y, leftParsed.mo, leftParsed.da)
      : null;
    const rightParsed = parseDateFragment(
      right,
      leftYear ?? new Date().getFullYear(),
    );
    const end = rightParsed
      ? fmt(rightParsed.y, rightParsed.mo, rightParsed.da)
      : null;
    return { start, end };
  }

  const parsed = parseDateFragment(s, null);
  if (parsed) {
    const d = fmt(parsed.y, parsed.mo, parsed.da);
    return { start: d, end: d };
  }

  return { start: null, end: null };
};

const toDate = (s: string | null): Date | null => {
  if (!s) return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9);
  return isNaN(dt.getTime()) ? null : dt;
};

const fetchPageHtml = async (url: string): Promise<string> => {
  const response = await axios.get<string>(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data;
};

const findDeadlineText = (
  $: cheerio.CheerioAPI,
  keywords: string[],
): string | null => {
  for (const keyword of keywords) {
    const el = $('*')
      .filter((_i, el) => $(el).text().includes(keyword))
      .last()
      .parent();
    if (el?.length) {
      let text = el
        .children()
        .map((_i, child) => $(child).text().trim())
        .get()
        .join(' ')
        .trim();
      const idx = text.indexOf(keyword);
      if (idx !== -1) text = text.slice(idx + keyword.length).trim();
      return text;
    }
  }
  return null;
};

export const extractDeadline = async (
  notices: Partial<Notice>[],
): Promise<Partial<Notice>[]> => {
  for (const notice of notices) {
    try {
      const url = notice.url ?? '';
      if (!url) continue;

      await sleep(THROTTLE_MS);

      const html = await fetchPageHtml(url);
      const $ = cheerio.load(html);
      const text = findDeadlineText($, DEADLINE_KEYWORDS);

      if (!text) {
        notice.kickoff ??= null;
        notice.deadline ??= null;
        continue;
      }

      const { start, end } = normalizeToRange(text);
      notice.kickoff = toDate(start);
      notice.deadline = toDate(end);
    } catch (error: unknown) {
      const url = notice.url ?? '';
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[DeadlineExtractor] Failed to extract deadline for "${url}":`,
        message,
      );
      notice.kickoff ??= null;
      notice.deadline ??= null;
    }
  }

  return notices;
};
