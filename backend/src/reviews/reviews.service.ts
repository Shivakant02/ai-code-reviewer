import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, query?: { status?: string; limit?: number }) {
    const where: Record<string, unknown> = {
      pullRequest: {
        repository: {
          userId,
        },
      },
    };

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.review.findMany({
      where,
      include: {
        pullRequest: {
          include: {
            repository: {
              select: {
                id: true,
                fullName: true,
                owner: true,
                name: true,
              },
            },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query?.limit || 50,
    });
  }

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        pullRequest: {
          include: {
            repository: {
              select: {
                id: true,
                fullName: true,
                owner: true,
                name: true,
              },
            },
          },
        },
        comments: {
          orderBy: [{ severity: 'asc' }, { file: 'asc' }, { line: 'asc' }],
        },
      },
    });

    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async getStats(userId: string) {
    const [total, completed, failed, avgScore] = await Promise.all([
      this.prisma.review.count({
        where: { pullRequest: { repository: { userId } } },
      }),
      this.prisma.review.count({
        where: {
          pullRequest: { repository: { userId } },
          status: 'completed',
        },
      }),
      this.prisma.review.count({
        where: {
          pullRequest: { repository: { userId } },
          status: 'failed',
        },
      }),
      this.prisma.review.aggregate({
        where: {
          pullRequest: { repository: { userId } },
          status: 'completed',
          score: { not: null },
        },
        _avg: { score: true },
      }),
    ]);

    const repoCount = await this.prisma.repository.count({
      where: { userId },
    });

    return {
      totalReviews: total,
      completedReviews: completed,
      failedReviews: failed,
      averageScore: Math.round(avgScore._avg.score || 0),
      connectedRepos: repoCount,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
