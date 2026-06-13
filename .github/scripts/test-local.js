/**
 * test-local.js
 * 로컬에서 generate-api-docs.js 를 실제 컨트롤러 파일로 테스트합니다.
 * 프로젝트 루트에서 실행하세요.
 *
 * 사용법:
 *   npm run api-docs:test
 *   npm run api-docs:test -- src/auth/auth.controller.ts
 *   npm run api-docs:test -- src/auth/auth.controller.ts,src/notices/notices.controller.ts
 */

const path = require('path');

// 프로젝트 루트 기준으로 .env 로드
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// 기본 테스트 파일 (인자 없을 때)
const DEFAULT_FILES = 'src/notifications/notifications.controller.ts';
const files = process.argv[2] || DEFAULT_FILES;

process.env.CHANGED_FILES = files;
process.env.REPO_ROOT = path.resolve(__dirname, '../../');
process.env.PR_TITLE = process.env.PR_TITLE || '[테스트] 알림 API 추가';
process.env.PR_NUMBER = process.env.PR_NUMBER || '99';
process.env.PR_AUTHOR = process.env.PR_AUTHOR || 'local-test';
process.env.PR_MERGED_AT = process.env.PR_MERGED_AT || new Date().toISOString();

// 환경변수 체크
const required = ['OPENAI_API_KEY', 'NOTION_API_TOKEN', 'NOTION_DATABASE_ID'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('❌ 필수 환경변수가 없습니다:');
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error(
    '\n👉 프로젝트 루트의 .env 파일을 .env.example 을 참고해서 만들어주세요.',
  );
  process.exit(1);
}

console.log('🧪 로컬 테스트 시작');
console.log(`   대상 파일: ${files}`);
console.log(`   프로젝트 루트: ${process.env.REPO_ROOT}\n`);

require('./generate-api-docs.js');
