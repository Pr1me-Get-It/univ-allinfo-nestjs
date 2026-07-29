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
    title: string; // 링크(href) 추출용 앵커 엘리먼트 (예: 'td.subject a' 또는 '.title-text')
    date: string; // 날짜 엘리먼트 (예: 'td.date')
    // title 엘리먼트 안에 뱃지/본문 미리보기가 섞여 있어 텍스트만 별도로 뽑아야 하는 경우 사용
    titleText?: string; // 제목 텍스트 전용 엘리먼트 (미지정 시 title 엘리먼트 텍스트 사용)
    titleTextExclude?: string; // titleText 안에서 제외할 하위 엘리먼트 (예: 뱃지 span)
  };
}
