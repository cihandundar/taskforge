import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentWsUser {
  id: string;
  email: string;
  name: string;
}

export const CurrentWsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentWsUser => {
    const client = ctx.switchToWs().getClient();
    return client.data.user;
  },
);
