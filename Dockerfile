# [Stage 1: Builder]
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# 패키지 매니저 파일만 먼저 복사하여 캐시 효율 극대화
COPY package*.json ./
RUN npm install

# NestJS 빌드
COPY . .
RUN npm run build

# [Stage 2: Production]
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# production 모드로 패키지 설치 (devDependencies 제외)
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# 환경변수 기본값 설정 (ECS/EC2에서 변경 예정)
ENV NODE_ENV=production
ENV PORT=3000

# 컨테이너 포트 개방
EXPOSE ${PORT}

# 무거운 nest CLI 대신 순수 node 명령어로 실행하여 성능 최적화
CMD ["node", "dist/main"]