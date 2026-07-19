import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ReviewJobData {
  reviewId: string;
  pullRequestId: string;
  repositoryId: string;
  owner: string;
  repoName: string;
  pullNumber: number;
  headSha: string;
  userAccessToken: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('code-review') private readonly reviewQueue: Queue,
  ) {}

  async addReviewJob(data: ReviewJobData) {
    const job = await this.reviewQueue.add('review-pr', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });

    this.logger.log(`Added review job ${job.id} for PR #${data.pullNumber}`);
    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.reviewQueue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return { id: job.id, state, data: job.data, progress: job.progress };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.reviewQueue.getWaitingCount(),
      this.reviewQueue.getActiveCount(),
      this.reviewQueue.getCompletedCount(),
      this.reviewQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
