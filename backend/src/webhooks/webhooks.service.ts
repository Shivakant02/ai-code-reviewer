import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

export interface WebhookPayload {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    state: string;
    body: string | null;
    head: { ref: string; sha: string };
    base: { ref: string };
    user: { login: string };
    html_url: string;
  };
  repository: {
    id: number;
    full_name: string;
    owner: { login: string };
    name: string;
  };
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async handlePullRequestEvent(payload: WebhookPayload) {
    const { action, pull_request: pr, repository } = payload;

    // Only process opened, synchronize (updated), and reopened events
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      this.logger.log(`Ignoring PR action: ${action}`);
      return { status: 'ignored', action };
    }

    // Find the connected repository
    const repo = await this.prisma.repository.findUnique({
      where: { fullName: repository.full_name },
      include: { user: true },
    });

    if (!repo) {
      this.logger.warn(
        `Repository not found: ${repository.full_name}`,
      );
      return { status: 'repo_not_found' };
    }

    if (!repo.reviewEnabled) {
      this.logger.log(`Reviews disabled for: ${repository.full_name}`);
      return { status: 'reviews_disabled' };
    }

    // Upsert the pull request
    const pullRequest = await this.prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repo.id,
          number: pr.number,
        },
      },
      update: {
        title: pr.title,
        status: pr.state,
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        authorLogin: pr.user.login,
      },
      create: {
        number: pr.number,
        title: pr.title,
        status: pr.state,
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        authorLogin: pr.user.login,
        githubUrl: pr.html_url,
        repositoryId: repo.id,
      },
    });

    // Create a review record
    const review = await this.prisma.review.create({
      data: {
        status: 'pending',
        pullRequestId: pullRequest.id,
      },
    });

    // Enqueue the review job
    await this.queueService.addReviewJob({
      reviewId: review.id,
      pullRequestId: pullRequest.id,
      repositoryId: repo.id,
      owner: repository.owner.login,
      repoName: repository.name,
      pullNumber: pr.number,
      headSha: pr.head.sha,
      userAccessToken: repo.user.accessToken,
    });

    this.logger.log(
      `Queued review for PR #${pr.number} on ${repository.full_name}`,
    );

    return { status: 'queued', reviewId: review.id };
  }
}
