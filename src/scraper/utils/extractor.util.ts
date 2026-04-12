import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { ScrapeConfig } from '../scraper.interface';
import { Notice } from '../../notices/entities/notice.entity';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractNotices = async (
  config: ScrapeConfig,
  board: { name: string; path: string },
): Promise<Partial<Notice>[]> => {
  const notices: Partial<Notice>[] = [];

  for (let page = 1; page <= config.maxPage; page++) {
    const targetUrl = config.pageParam
      ? `${config.baseUrl}${board.path}${config.pageParam}${page}`
      : `${config.baseUrl}${board.path}`;

    try {
      // 서버 보호 및 IP 차단 방지를 위한 딜레이
      await sleep(1500);

      // ⚠️ 403 Forbidden 에러(봇 차단) 방지를 위해 브라우저 헤더(User-Agent)를 강제 주입
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const $ = cheerio.load(response.data);

      $(config.selectors.row).each((_, element) => {
        const titleEl = $(element).find(config.selectors.title);
        // 제목의 보기 흉한 줄바꿈과 다중 스페이스를 하나의 공백으로 압축합니다 (깔끔한 UI 제공)
        const title = titleEl
          .text()
          .replace(/[\n\t\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        let rawLink = titleEl.attr('href') || '';
        const onClickStr = titleEl.attr('onclick') || '';
        const scriptSource = onClickStr.includes('doRead')
          ? onClickStr
          : rawLink;

        if (scriptSource.includes('doRead')) {
          // 1. KNU_NEWS 공지사항 등 (4개의 인자: doc_no, appl_no, page, note_div)
          const match4 = scriptSource.match(
            /doRead\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/,
          );
          // 2. KNU_NEWS 학사공지 등 (3개의 인자: bbs_cde, note_div, bltn_no)
          const match3 = scriptSource.match(
            /doRead\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/,
          );

          if (match4) {
            // viewBtin.action 조합 (게시판 코드 cde=1 고정, doc_no 등 삽입)
            rawLink = `/wbbs/wbbs/bbs/btin/viewBtin.action?menu_idx=67&btin.bbs_cde=1&btin.doc_no=${match4[1]}&btin.appl_no=${match4[2]}&btin.page=${match4[3]}&btin.note_div=${match4[4]}`;
          } else if (match3) {
            // stdViewBtin.action 조합
            rawLink = `/wbbs/wbbs/bbs/btin/stdViewBtin.action?menu_idx=42&bbs_cde=${match3[1]}&note_div=${match3[2]}&bltn_no=${match3[3]}`;
          }
        } else if (
          onClickStr.includes('fn_view') ||
          rawLink.includes('fn_view')
        ) {
          // ALUM 포항인재원 Javascript 우회 (3. fn_view)
          const targetStr = onClickStr.includes('fn_view')
            ? onClickStr
            : rawLink;
          const matchAlum = targetStr.match(/fn_view\((\d+)\)/);
          if (matchAlum) {
            rawLink = `/bbsArticle/view.do?bbsId=NOTICE&seq=${matchAlum[1]}`;
          }
        } else if (rawLink) {
          // 그 외 일반 링크 처리 및 html 태그 깨짐 에러 교정
          rawLink = rawLink.replace(/\/>/g, '');
        }

        const postedAtString = $(element)
          .find(config.selectors.date)
          .text()
          .trim();

        if (!title || !rawLink) return;

        // 고정 공지 여부 파악 로직 추가 가능
        // const isFixed = $(element).find(config.selectors.isFixed).length > 0;

        // 상대 경로 보정 (현재 탐색 중인 게시판 주소 기준)
        let fullUrl = '';
        try {
          fullUrl = new URL(rawLink, targetUrl).toString();
        } catch (e) {
          fullUrl = rawLink; // 파싱 실패 시 원본 그대로 유지
        }

        const hashedUrl = crypto
          .createHash('sha256')
          .update(fullUrl)
          .digest('hex');

        // 날짜 문자열 파싱
        // 주의: 'YYYY-MM-DD' 형식은 JS에서 UTC로 파싱되고,
        // 'YYYY/MM/DD' 또는 'YYYY.MM.DD' 등은 로컬 타임으로 파싱되는 브라우저/Node의 동작 차이가 있습니다.
        // 따라서 형식에 관계없이 같은 동작을 하도록 직접 연도/월/일을 추출해 로컬 자정으로 생성합니다.
        let postedAt: Date;
        const dateMatch = postedAtString.match(
          /(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/,
        );
        if (dateMatch) {
          const y = Number(dateMatch[1]);
          const m = Number(dateMatch[2]) - 1; // JS 월은 0-11
          const d = Number(dateMatch[3]);
          postedAt = new Date(y, m, d, 9); // 로컬 시간으로 생성
        } else {
          // 위 형식이 아니면 기존 방식(점 -> 하이픈)으로 시도
          const cleanDateStr = postedAtString.replace(/\./g, '-');
          postedAt = new Date(cleanDateStr);
        }

        // 데이터베이스 TIMESTAMP 제한(2038년) 또는 과거 오파싱(조회수 48 등을 2048년으로 해석하는 버그) 방어
        if (
          isNaN(postedAt.getTime()) ||
          postedAt.getFullYear() > 2037 ||
          postedAt.getFullYear() < 2000
        ) {
          // postedAt = new Date(); // 잘못된 날짜는 현재 날짜로 강제 보정
        }

        notices.push({
          source: `${config.code}_${board.name}`,
          title: `${title}`,
          url: fullUrl,
          hashedUrl: hashedUrl,
          postedAt: isNaN(postedAt.getTime()) ? new Date() : postedAt,
          views: 0,
        });
      });
    } catch (error: any) {
      console.error(
        `[Scraper Extractor Error] ${config.code} - Page ${page} failed:`,
        error.message,
      );
    }
  }

  return notices;
};
