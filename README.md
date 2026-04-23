# UNIV AllInfo Backend (NestJS 🚀)

이 프로젝트는 기존 Express.js 기반의 UNIV AllInfo 서버를 **NestJS**로 마이그레이션한 새로운 백엔드 애플리케이션입니다.

## 📌 주요 기술 스택 (Tech Stack)

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: MySQL
- **ORM**: [TypeORM](https://typeorm.io/)
- **Authentication**: JWT, Passport, OAuth (Apple Login 예정)
- **Task Scheduling**: @nestjs/schedule (공지사항 정기 크롤링)
- **Push Notifications**: Expo Server SDK (예정)

## 🏗️ 도메인 및 모듈 구조 (Structure)

해당 애플리케이션은 기능별로 응집도가 높은 모듈(Module) 단위로 나뉘어 설계되었습니다.

- `AuthModule`: JWT 토큰 발급/검증 및 인증 인가 가드(Guards), 소셜 로그인 기능
- `UsersModule`: 사용자 기본 정보(OAuth 연동) 및 프로필(단과대, 학과 정보) 분리 관리
- `NoticesModule`: 학교 공지사항 등 유용한 데이터 제공 기능
- `ScraperModule`: 주기적인 외부 데이터 크롤링 및 수집
- `InteractionsModule`: (예정) 좋아요, 피드백 등 사용자 상호작용 관련 로직
- `NotificationsModule`: (예정) Expo를 활용한 푸시 알림 발송

## ⚙️ 로컬 환경 스크립트 (Scripts)

### 의존성 설치 (Installation)

```bash
$ npm install
```

### 서버 실행 (Running the app)

```bash
# 개발 모드 (Watch mode)
$ npm run start:dev

# 디버그 모드
$ npm run start:debug

# 프로덕션 빌드 실행
$ npm run start:prod
```

### 환경 변수 관리 (Environment variables)

루트 하위의 `.env.example` 파일을 참고하여 `.env` 혹은 `.env.local` 파일을 생성한 뒤, 로컬 Database 환경 및 시크릿 키 등을 입력해 주어야 합니다.

## 🐳 Docker 지원 (Docker Support)

본 프로젝트는 원활한 운영 및 배포를 위해 Docker 환경을 지원합니다.

```bash
# 로컬 개발용 컨테이너 실행
$ docker-compose up -d

# 상용 운영 컨테이너 실행
$ docker-compose -f docker-compose.prod.yml up -d
```
