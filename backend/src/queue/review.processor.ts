import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { ReviewJobData } from './queue.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface AIReviewComment {
  file: string;
  line: number;
  endLine?: number;
  severity: string;
  category: string;
  body: string;
  suggestion?: string;
}

interface AIReviewResponse {
  score: number;
  summary: string;
  comments: AIReviewComment[];
}

@Processor('code-review')
export class ReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ReviewJobData>): Promise<void> {
    const {
      reviewId,
      owner,
      repoName,
      pullNumber,
      headSha,
      userAccessToken,
    } = job.data;

    const startTime = Date.now();

    this.logger.log(
      `Processing review ${reviewId} for ${owner}/${repoName}#${pullNumber}`,
    );

    try {
      // Update status to processing
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: 'processing' },
      });

      await job.updateProgress(10);

      // Step 1: Fetch PR files and diffs
      const files = await this.githubService.getPullRequestFiles(
        userAccessToken,
        owner,
        repoName,
        pullNumber,
      );

      await job.updateProgress(30);

      // Step 2: Fetch repository context (README)
      const readme = await this.githubService.getReadme(
        userAccessToken,
        owner,
        repoName,
      );

      await job.updateProgress(40);

      // Step 3: Get PR details
      const prData = await this.githubService.getPullRequest(
        userAccessToken,
        owner,
        repoName,
        pullNumber,
      );

      await job.updateProgress(50);

      // Step 4: Call AI service
      const aiServiceUrl = this.configService.get<string>(
        'AI_SERVICE_URL',
        'http://localhost:8000',
      );

      const aiResponse = await axios.post<AIReviewResponse>(
        `${aiServiceUrl}/api/review`,
        {
          pull_request: {
            number: pullNumber,
            title: prData.title,
            description: prData.body || '',
            author: prData.user.login,
            base_branch: prData.base.ref,
            head_branch: prData.head.ref,
          },
          files: files
            .filter((f) => f.patch) // Only include files with diffs
            .map((f) => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
              patch: f.patch,
            })),
          context: {
            readme: readme || '',
            repo_name: `${owner}/${repoName}`,
          },
        },
        { timeout: 120000 }, // 2-minute timeout for AI processing
      );

      const aiResult = aiResponse.data;

      await job.updateProgress(80);

      // Step 5: Store review results
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'completed',
          score: aiResult.score,
          summary: aiResult.summary,
          duration: Date.now() - startTime,
          comments: {
            createMany: {
              data: aiResult.comments.map((c) => ({
                file: c.file,
                line: c.line,
                endLine: c.endLine,
                severity: c.severity,
                category: c.category,
                body: c.body,
                suggestion: c.suggestion,
              })),
            },
          },
        },
      });

      await job.updateProgress(90);

      // Step 6: Post review comments on GitHub
      const validComments = aiResult.comments
        .filter((c) => c.line > 0)
        .map((c) => ({
          path: c.file,
          line: c.line,
          body: this.formatComment(c),
        }));

      if (validComments.length > 0) {
        await this.githubService.createReviewComments(
          userAccessToken,
          owner,
          repoName,
          pullNumber,
          headSha,
          validComments,
          this.formatSummary(aiResult),
        );
      }

      await job.updateProgress(100);

      this.logger.log(
        `Review ${reviewId} completed in ${Date.now() - startTime}ms with score ${aiResult.score}`,
      );
    } catch (error) {
      this.logger.error(`Review ${reviewId} failed`, error);

      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'failed',
          errorMsg:
            error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        },
      });

      throw error; // Re-throw for BullMQ retry
    }
  }

  private formatComment(comment: AIReviewComment): string {
    const severityEmoji: Record<string, string> = {
      critical: '🔴',
      warning: '🟡',
      suggestion: '🔵',
      praise: '🟢',
    };

    const emoji = severityEmoji[comment.severity] || '💬';
    let body = `${emoji} **${comment.severity.toUpperCase()}** (${comment.category})\n\n${comment.body}`;

    if (comment.suggestion) {
      body += `\n\n**Suggested fix:**\n\`\`\`suggestion\n${comment.suggestion}\n\`\`\``;
    }

    return body;
  }

  private formatSummary(result: AIReviewResponse): string {
    const scoreEmoji =
      result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';

    const criticalCount = result.comments.filter(
      (c) => c.severity === 'critical',
    ).length;
    const warningCount = result.comments.filter(
      (c) => c.severity === 'warning',
    ).length;
    const suggestionCount = result.comments.filter(
      (c) => c.severity === 'suggestion',
    ).length;

    return `## 🤖 Code-Pilot Review

${scoreEmoji} **Quality Score: ${result.score}/100**

${result.summary}

### Summary
| Type | Count |
|------|-------|
| 🔴 Critical | ${criticalCount} |
| 🟡 Warning | ${warningCount} |
| 🔵 Suggestion | ${suggestionCount} |
| **Total** | **${result.comments.length}** |

---
*Reviewed by Code-Pilot*`;
  }
}
