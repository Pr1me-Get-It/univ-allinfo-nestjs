/**
 * TODO:
 * - 코드 정리 좀 하기 (private 함수로 분리 등)
 * - deadline 추출 잘 안 되는 애들 원인 좀 파악하고 개선해보자
 */

import { Notice } from '@src/notices/entities/notice.entity';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 포팅된 날짜 정규화 유틸 (원본: UNIV-allInfo/src/utils/parseDate.js)
const normalizeToRange = (
  input: any,
): { start: string | null; end: string | null } => {
  if (!input) {
    return { start: null, end: null };
  }
  let s = String(input);

  s = s.replace(/\([^)]*\)/g, '');
  s = s.replace(/[–—]/g, '-').replace(/[~〜]/g, '~');
  s = s.replace(/,/g, ' ');
  s = s.replace(/\b\d{1,2}:\d{2}\b/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  const fullDateRe = /(\d{4})\s*[.\-년\/]\s*(\d{1,2})\s*[.\-월\/]\s*(\d{1,2})/g;
  const monthDayRe = /(\d{1,2})\s*[.\-월\/]\s*(\d{1,2})/g;

  const fmt = (y: number, m: number, d: number) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const isValidDateParts = (y: number, m: number, d: number) => {
    if (!y || !m || !d) return false;
    const yi = Number(y);
    const mi = Number(m);
    const di = Number(d);
    if (mi < 1 || mi > 12) return false;
    if (di < 1 || di > 31) return false;
    const dt = new Date(yi, mi - 1, di);
    return (
      dt.getFullYear() === yi && dt.getMonth() === mi - 1 && dt.getDate() === di
    );
  };

  const parseSingle = (fragment: string, defaultYear: number | null = null) => {
    if (!fragment) return null;
    const str = fragment.trim();
    fullDateRe.lastIndex = 0;
    const f = fullDateRe.exec(str);
    if (f) {
      const y = Number(f[1]);
      const mo = Number(f[2]);
      const da = Number(f[3]);
      if (isValidDateParts(y, mo, da)) return { y, mo, da };
      return null;
    }
    const twoDigitYearRe =
      /(\d{2})\s*[.\-년\/]\s*(\d{1,2})\s*[.\-월\/]\s*(\d{1,2})/g;
    twoDigitYearRe.lastIndex = 0;
    const t = twoDigitYearRe.exec(str);
    if (t) {
      const y = 2000 + Number(t[1]);
      const mo = Number(t[2]);
      const da = Number(t[3]);
      if (isValidDateParts(y, mo, da)) return { y, mo, da };
      return null;
    }
    monthDayRe.lastIndex = 0;
    const md = monthDayRe.exec(str);
    if (md) {
      const mo = Number(md[1]);
      const da = Number(md[2]);
      const y = defaultYear || new Date().getFullYear();
      if (isValidDateParts(y, mo, da)) return { y, mo, da };
      return null;
    }
    const iso = str.match(/(\d{4}-\d{2}-\d{2})/);
    if (iso) {
      const [y, mo, da] = iso[1].split('-').map(Number);
      if (isValidDateParts(y, mo, da)) return { y, mo, da };
    }
    return null;
  };

  if (s.includes('~')) {
    const parts = s.split('~');
    const left = parts[0] || '';
    const right = parts[1] || '';
    const leftParsed = parseSingle(left, null);
    let leftYear = leftParsed ? leftParsed.y : null;
    const start = leftParsed
      ? fmt(leftParsed.y, leftParsed.mo, leftParsed.da)
      : null;
    const rightParsed = parseSingle(
      right,
      leftYear || new Date().getFullYear(),
    );
    const end = rightParsed
      ? fmt(rightParsed.y, rightParsed.mo, rightParsed.da)
      : null;
    return { start, end };
  }

  const singleParsed = parseSingle(s, null);
  if (singleParsed) {
    const d = fmt(singleParsed.y, singleParsed.mo, singleParsed.da);
    return { start: d, end: d };
  }

  return { start: null, end: null };
};

export const extractDeadline = async (
  notices: Partial<Notice>[],
): Promise<Partial<Notice>[]> => {
  const keywords = [
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

  for (const notice of notices) {
    // throttle to be polite
    await sleep(1200);
    try {
      const url = (notice as any).url || (notice as any).link || '';
      if (!url) continue;

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      let chosenKeyword: string | null = null;
      let foundElement: cheerio.Cheerio<Element> | null = null;
      for (const keyword of keywords) {
        const el = $('*')
          .filter((i, el) => $(el).text().includes(keyword))
          .last()
          .parent();
        if (el && el.length) {
          foundElement = el;
          chosenKeyword = keyword;
          break;
        }
      }

      if (!foundElement) {
        // no element found; ensure fields exist
        (notice as any).kickoff = (notice as any).kickoff ?? null;
        (notice as any).deadline = (notice as any).deadline ?? null;
        continue;
      }

      let text = foundElement
        .children()
        .map((i, el) => $(el).text().trim())
        .get()
        .join(' ')
        .trim();

      if (chosenKeyword) {
        const idx = text.indexOf(chosenKeyword);
        if (idx !== -1) text = text.slice(idx + chosenKeyword.length).trim();
      }

      const { start, end } = normalizeToRange(text);

      const toDate = (s: string | null) => {
        if (!s) return null;
        const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return null;
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const dt = new Date(y, mo, d, 9);
        if (isNaN(dt.getTime())) return null;
        return dt;
      };

      (notice as any).kickoff = toDate(start);
      (notice as any).deadline = toDate(end);
    } catch (error) {
      // on error, set nulls but don't throw
      (notice as any).kickoff = (notice as any).kickoff ?? null;
      (notice as any).deadline = (notice as any).deadline ?? null;
      // keep going
    }
  }

  return notices;
};
