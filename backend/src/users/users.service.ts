import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByGithubId(githubId: number) {
    return this.prisma.user.findUnique({ where: { githubId } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async upsertFromGithub(profile: {
    githubId: number;
    username: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    accessToken: string;
  }) {
    this.logger.log(`Upserting user: ${profile.username}`);
    return this.prisma.user.upsert({
      where: { githubId: profile.githubId },
      update: {
        username: profile.username,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        accessToken: profile.accessToken,
      },
      create: {
        githubId: profile.githubId,
        username: profile.username,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        accessToken: profile.accessToken,
      },
    });
  }
}
