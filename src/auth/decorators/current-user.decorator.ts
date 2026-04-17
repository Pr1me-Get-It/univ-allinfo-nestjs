import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // JwtAuthGuard가 심어놓은 user 객체를 추출
    const user = request.user;

    // 만약 @CurrentUser('id') 처럼 특정 필드만 요구하면 그것만 반환하고, 아니면 객체 통째로 반환
    return data ? user?.[data] : user;
  },
);
