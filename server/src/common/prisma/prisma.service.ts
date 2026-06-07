import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Transactions for faster cleanup
    await this.$transaction([
      this.comment.deleteMany(),
      this.block.deleteMany(),
      this.page.deleteMany(),
      this.workspaceMember.deleteMany(),
      this.workspace.deleteMany(),
      this.session.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
