import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { ConnectRepoDto } from './dto/connect-repo.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.repository.findMany({
      where: { userId },
      include: {
        _count: { select: { pullRequests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const repo = await this.prisma.repository.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }

  async connect(userId: string, dto: ConnectRepoDto, userAccessToken: string) {
    // Check if already connected
    const existing = await this.prisma.repository.findUnique({
      where: { githubRepoId: parseInt(dto.githubRepoId) },
    });
    if (existing) {
      throw new ConflictException('Repository already connected');
    }

    // Generate webhook secret
    const webhookSecret = randomBytes(32).toString('hex');

    // Create webhook on GitHub
    let webhookId: number | null = null;
    const webhookBaseUrl = this.configService.get<string>('WEBHOOK_BASE_URL');
    if (webhookBaseUrl) {
      try {
        webhookId = await this.githubService.createWebhook(
          userAccessToken,
          dto.owner,
          dto.name,
          `${webhookBaseUrl}/webhooks/github`,
          webhookSecret,
        );
      } catch (error) {
        this.logger.warn(
          `Could not create webhook for ${dto.fullName}: ${error}`,
        );
      }
    }

    const repo = await this.prisma.repository.create({
      data: {
        githubRepoId: parseInt(dto.githubRepoId),
        owner: dto.owner,
        name: dto.name,
        fullName: dto.fullName,
        description: dto.description,
        language: dto.language,
        isPrivate: dto.isPrivate ?? false,
        webhookId,
        webhookSecret,
        userId,
      },
    });

    this.logger.log(`Connected repository: ${dto.fullName}`);
    return repo;
  }

  async disconnect(id: string, userAccessToken: string) {
    const repo = await this.findById(id);

    // Delete webhook from GitHub
    if (repo.webhookId) {
      try {
        await this.githubService.deleteWebhook(
          userAccessToken,
          repo.owner,
          repo.name,
          repo.webhookId,
        );
      } catch (error) {
        this.logger.warn(`Could not delete webhook: ${error}`);
      }
    }

    await this.prisma.repository.delete({ where: { id } });
    this.logger.log(`Disconnected repository: ${repo.fullName}`);
  }

  async toggleReview(id: string) {
    const repo = await this.findById(id);
    return this.prisma.repository.update({
      where: { id },
      data: { reviewEnabled: !repo.reviewEnabled },
    });
  }

  async getGithubRepos(userAccessToken: string) {
    return this.githubService.getUserRepos(userAccessToken);
  }
}
