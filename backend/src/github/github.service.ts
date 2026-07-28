import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  contents_url: string;
}

export interface PullRequestData {
  number: number;
  title: string;
  body: string | null;
  state: string;
  head: { ref: string };
  base: { ref: string };
  user: { login: string };
  html_url: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  private getOctokit(token: string): Octokit {
    return new Octokit({ auth: token });
  }

  async getPullRequest(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<PullRequestData> {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data as unknown as PullRequestData;
  }

  async getPullRequestFiles(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<PullRequestFile[]> {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });
    return data as unknown as PullRequestFile[];
  }

  async getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<string | null> {
    try {
      const octokit = this.getOctokit(token);
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      this.logger.warn(`Could not fetch file: ${path}`);
      return null;
    }
  }

  async getReadme(
    token: string,
    owner: string,
    repo: string,
  ): Promise<string | null> {
    try {
      const octokit = this.getOctokit(token);
      const { data } = await octokit.repos.getReadme({ owner, repo });
      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  async createReviewComments(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
    commitId: string,
    comments: Array<{
      path: string;
      line: number;
      body: string;
      side?: string;
    }>,
    summary: string,
  ) {
    const octokit = this.getOctokit(token);

    try {
      // Create a pull request review with inline comments
      await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitId,
        body: summary,
        event: 'COMMENT',
        comments: comments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body,
          side: (c.side as 'LEFT' | 'RIGHT') || 'RIGHT',
        })),
      });

      this.logger.log(
        `Posted review with ${comments.length} comments on PR #${pullNumber}`,
      );
    } catch (error) {
      this.logger.error(`Failed to post review comments`, error);
      // Fallback: post summary as a regular comment
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body: `## 🤖 Code-Pilot Review\n\n${summary}`,
      });
    }
  }

  async createWebhook(
    token: string,
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
  ): Promise<number> {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
        insecure_ssl: '0',
      },
      events: ['pull_request'],
      active: true,
    });
    this.logger.log(`Created webhook ${data.id} for ${owner}/${repo}`);
    return data.id;
  }

  async deleteWebhook(
    token: string,
    owner: string,
    repo: string,
    hookId: number,
  ) {
    const octokit = this.getOctokit(token);
    await octokit.repos.deleteWebhook({
      owner,
      repo,
      hook_id: hookId,
    });
    this.logger.log(`Deleted webhook ${hookId} for ${owner}/${repo}`);
  }

  async getUserRepos(token: string) {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'owner',
    });
    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      language: repo.language,
      isPrivate: repo.private,
      htmlUrl: repo.html_url,
    }));
  }

  async getLatestCommitSha(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 1,
    });
    // Get the last commit
    const commits = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return commits.data[commits.data.length - 1].sha;
  }
}
