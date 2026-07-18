# 팀 공용 계정 및 인프라 설정 가이드

> 목표: 프로젝트에 연결된 계정들을 팀 공용 체계로 정리하고, 새로 합류하는 팀원도 동일한 권한으로 개발/배포에 참여할 수 있게 한다.

---

## 0. 사전 준비

- [ ] 팀원 이메일, GitHub 계정, Apple ID 등 확보
- [ ] 팀/회사 명의 결제수단 준비
- [ ] `secrets/` 폴더 전달 방법 결정 (아래 6번 참고, git에 없으므로 별도 채널 필요)

---

## 1. GitHub

1. GitHub **Organization** 생성 (무료 플랜 가능)
2. 기존 리포지토리를 Organization으로 **Transfer** (Settings > General > Danger Zone > Transfer ownership)
3. 팀원을 Organization **Owner**로 초대
4. Settings > Secrets and variables > Actions 에서 기존 시크릿 값 확인:
   - `HOST`, `USERNAME`, `SSH_KEY`, `ENV_FILE`
   - Organization 전환 시 자동으로 넘어가지 않을 수 있으니 재등록 필요 여부 확인

---

## 2. DigitalOcean

1. DigitalOcean **Team** 생성 (또는 기존 계정을 Team으로 전환)
2. 결제수단을 팀/회사 카드로 등록
3. 팀원을 Team에 **Owner** 권한으로 초대
4. 서버(droplet) 접근을 위한 SSH 키 등록:
   - 팀원의 SSH 공개키를 서버 `~/.ssh/authorized_keys`에 추가
   - GitHub Actions 시크릿의 `SSH_KEY`도 필요 시 갱신

---

## 3. Apple Developer

1. **Apple Developer Program (Organization)** 계정 준비
   - 사업자등록번호/D-U-N-S 번호 필요 (없으면 Apple이 무료 발급, 1~2주 소요될 수 있음)
2. App Store Connect에서 **App Transfer**로 앱을 조직 계정에 연결
   - 번들 ID, 버전 기록, 리뷰 기록은 유지됨 / 인앱결제·일부 분석 데이터는 이전 안 됨
3. 조직 계정 명의로 서명키 재발급:
   - `secrets/AuthKey_<KEY_ID>.p8` → 신규 발급 키로 교체
   - `.env`의 `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` 갱신

---

## 4. Google Play Console / Google Cloud

1. 팀 공용 **Google Play Console** 계정 준비 (또는 Google Workspace 팀 계정)
2. Play Console에서 앱에 팀원을 초대해 관리 권한 부여
3. **Google Cloud Console**에서 OAuth Client(`GOOGLE_WEB_CLIENT_ID`)가 있는 프로젝트에 팀원을 IAM Owner로 추가
   - 또는 팀 계정으로 OAuth Client 재발급 후 `.env`의 `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_WEB_CLIENT_SECRET` 교체
4. `secrets/client_secret_*.json` 파일도 재발급된 값으로 교체

---

## 5. 도메인 (가비아, HTTPS용)

1. 가비아 마이페이지 > 나의 서비스 관리 > 도메인 관리 에서 대상 도메인 확인 (정확한 메뉴명은 UI 변경 가능성이 있어 로그인 후 재확인 권장)
2. 결제수단(자동연장 등록 카드)을 팀 명의로 변경
3. 필요 시 공동 관리자 계정 등록 또는 도메인 정보변경 신청 (본인확인/법인 서류 필요할 수 있어 가비아 고객센터 확인 권장)
4. 갱신일을 캘린더에 등록해 만료 전 알림 받도록 조치 (1년 단위 구매분, 만료 시 HTTPS 인증서 발급이 막힘)

---

## 6. `secrets/` 폴더 및 로컬 자격증명

이 폴더는 `.gitignore`에 등록되어 있어 git에는 없음. 안전한 채널(비밀번호 관리자 공유 등)로 전달 — 채팅/이메일 평문 전달 금지.

- `AuthKey_<KEY_ID>.p8` — Apple 서명키 (재발급 시 폐기 가능)
- `client_secret_*.json` — Google OAuth secret (재발급 시 폐기 가능)
- `univallinfo-api.pem` — DigitalOcean 서버 SSH 키 (신규 키 등록 시 폐기 가능)

가능하면 기존 키를 재사용하기보다 **새로 발급하고 기존 키는 폐기**하는 편이 보안상 안전함.

---

## 7. Slack Webhook

1. Slack Workspace 관리 권한을 팀 계정 기준으로 정리
2. `FEEDBACK_WEB_HOOK_URL`이 개인 앱 설정에 묶여있다면 팀 계정 기준으로 Incoming Webhook 재발급

---

## 8. `.env` / `.env.prod` 최종 정리

- [ ] 로컬 `.env`, 서버의 `.env.prod` 값을 갱신된 자격증명으로 전체 교체
- [ ] GitHub Actions 시크릿 `ENV_FILE`도 동일하게 업데이트
- [ ] 배포 1회 실행하여 정상 기동 확인 (`docker-compose -f docker-compose.prod.yml up -d`)

---

## 9. 최종 점검 체크리스트

- [ ] GitHub Organization 전환 및 Owner 등록 완료
- [ ] DigitalOcean Team 전환 및 SSH 키 등록 완료
- [ ] Apple App Transfer 완료, 서명키 재발급 완료
- [ ] Google Play / Cloud 팀 계정 연결 완료, OAuth secret 재발급 완료
- [ ] 가비아 도메인 결제/관리 권한 정리 완료
- [ ] `secrets/` 내 모든 키 재발급 완료
- [ ] Slack Webhook 재발급 완료
- [ ] `.env`, `.env.prod`, GitHub Actions `ENV_FILE` 전체 갱신 완료
- [ ] 프로덕션 배포 1회 성공 확인
