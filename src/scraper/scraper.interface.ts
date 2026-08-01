export interface ScrapeSelectors {
  row: string; // 반복되는 각 공지글 묶음 (예: 'tbody tr' 또는 'ul > li')
  isFixed: string; // 공지/상단고정글 판단 기준 (예: '.notice_icon')
  title: string; // 링크(href) 추출용 앵커 엘리먼트 (예: 'td.subject a' 또는 '.title-text')
  date: string; // 날짜 엘리먼트 (예: 'td.date')
  // title 엘리먼트 안에 뱃지/본문 미리보기가 섞여 있어 텍스트만 별도로 뽑아야 하는 경우 사용
  titleText?: string; // 제목 텍스트 전용 엘리먼트 (미지정 시 title 엘리먼트 텍스트 사용)
  titleTextExclude?: string; // titleText 안에서 제외할 하위 엘리먼트 (예: 뱃지 span)
}

export interface ScrapeConfig {
  code: string; // 예: 'CSE'
  baseUrl: string; // 기본 주소
  boards: {
    name: string;
    path: string;
    maxItems?: number; // 페이지네이션 없이 전체 글이 한 번에 나오는 게시판에서 상위 N건만 수집
    // 같은 사이트라도 게시판마다 컬럼 구조(특히 날짜 위치)가 다른 경우,
    // config.selectors 중 일부만 이 게시판에서 덮어쓸 때 사용
    selectors?: Partial<ScrapeSelectors>;
  }[];
  pageParam: string | null; // 페이징 파라미터 (예: '?page=')
  maxPage: number; // 긁어올 최대 페이지 수

  // HTML 구조 종속성 탈피를 위한 CSS Selector 지정 (게시판 기본값)
  selectors: ScrapeSelectors;
}
