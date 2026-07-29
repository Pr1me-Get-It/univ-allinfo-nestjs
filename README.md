# UNIV AllInfo Backend (NestJS 🚀)

이 프로젝트는 기존 Express.js 기반의 UNIV AllInfo 서버를 **NestJS**로 마이그레이션한 새로운 백엔드 애플리케이션입니다.

## 📌 주요 기술 스택 (Tech Stack)

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: MySQL 8.0 (Docker)
- **ORM**: [TypeORM](https://typeorm.io/) (`synchronize: false`, 마이그레이션 기반 스키마 관리)
- **Cache/Queue**: Redis (랭킹 캐시, 유저 프로필 캐시, 점수 로그 버퍼링)
- **Authentication**: JWT (access/refresh), Passport, OAuth (Apple, Google)
- **Task Scheduling**: `@nestjs/schedule` (공지사항 정기 크롤링, cron)
- **Push Notifications**: Expo Server SDK
- **배포**: Docker + docker-compose, GitHub Actions CD → DigitalOcean

## 🏗️ 도메인 및 모듈 구조 (Structure)

해당 애플리케이션은 기능별로 응집도가 높은 모듈(Module) 단위로 나뉘어 설계되었습니다.

- `AuthModule`: JWT 토큰 발급/검증 및 인증 인가 가드(Guards), Apple/Google 소셜 로그인
- `UsersModule`: 사용자 기본 정보(OAuth 연동) 및 프로필(단과대, 학과 정보) 분리 관리
- `NoticesModule`: 학교 공지사항 조회 및 커서 기반 페이지네이션 제공
- `ScraperModule`: 주기적인 외부 공지사항 크롤링 및 수집, 마감일 추출
- `GamesModule`: 게임 점수 제출 및 랭킹(전체/단과대/학과) 조회
- `FeedbacksModule`: 사용자 피드백 수집 (Slack webhook 연동)
- `NotificationsModule`: 키워드/소스 구독 기반 Expo 푸시 알림 발송

## ⚙️ 로컬 개발 환경 (Local Setup)

### 사전 준비물

- Docker, Docker Compose
- Node.js ≥24 (Docker 없이 직접 실행할 경우에만 필요)

### 1. 환경 변수 설정

```bash
$ cp .env.example .env
```

`.env` 파일을 열어 값을 채워 넣습니다. 발급처는 [🔑 필수 자격증명 및 계정](#-필수-자격증명-및-계정) 참고.

### 2. 컨테이너 실행 (원클릭)

```bash
$ docker-compose up -d
```

`api` 컨테이너 기동 시 **마이그레이션이 자동으로 실행**된 뒤 dev 서버가 뜹니다 (`npm run migration:run && npm run start:dev`). DB/Redis 컨테이너까지 함께 올라오므로 별도 설치 없이 바로 개발 가능합니다.

### 3. 확인

```bash
$ curl http://localhost:3000
```

### Docker 없이 직접 실행하는 경우

```bash
$ npm install
$ npm run migration:run   # DB가 로컬에 별도로 떠 있어야 함
$ npm run start:dev
```

## 🐳 프로덕션 배포 (Docker Support)

```bash
$ docker-compose -f docker-compose.prod.yml up -d
```

`main` 브랜치에 push되면 GitHub Actions(`.github/workflows/deploy.yml`)가 DigitalOcean 서버에 SSH로 접속해 `git pull` → 빌드 → 마이그레이션 → 재기동을 자동 수행합니다.

## 🔑 필수 자격증명 및 계정

로컬 개발 및 배포를 위해 아래 계정/자격증명에 대한 접근 권한이 필요합니다. 팀 공용 계정 설정 절차는 [TEAM_SETUP.md](./TEAM_SETUP.md)를 참고하세요.

| 항목 | 용도 | 비고 |
| --- | --- | --- |
| Apple Developer 계정 | Apple 로그인 (Sign in with Apple), App Store 배포 | `.p8` 서명 키 필요 |
| Google Cloud Console 프로젝트 | Google 로그인 (OAuth Client) | Web Client ID/Secret |
| DigitalOcean 계정 | 프로덕션 서버 호스팅 | SSH 키 필요 |
| GitHub 리포지토리 시크릿 | CD 파이프라인 (`HOST`, `USERNAME`, `SSH_KEY`, `ENV_FILE`) | Settings > Secrets and variables > Actions |
| Slack Webhook | 피드백 알림 수신 | `FEEDBACK_WEB_HOOK_URL` |
| 가비아 도메인 | HTTPS용 도메인 | 갱신/명의 관리 필요 |
