export interface ScrapeConfig {
  code: string; // 예: 'CSE'
  baseUrl: string; // 기본 주소
  boards: { name: string; path: string }[]; // 게시판들
  pageParam: string | null; // 페이징 파라미터 (예: '?page=')
  maxPage: number; // 긁어올 최대 페이지 수

  // HTML 구조 종속성 탈피를 위한 CSS Selector 지정
  selectors: {
    row: string; // 반복되는 각 공지글 묶음 (예: 'tbody tr' 또는 'ul > li')
    isFixed: string; // 공지/상단고정글 판단 기준 (예: '.notice_icon')
    title: string; // 제목 엘리먼트 (예: 'td.subject a' 또는 '.title-text')
    date: string; // 날짜 엘리먼트 (예: 'td.date')
  };
}
