export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  githubId: number;
}

export interface Repository {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  reviewEnabled: boolean;
  createdAt: string;
  _count?: { pullRequests: number };
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  htmlUrl: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  status: string;
  branch: string;
  baseBranch: string;
  authorLogin: string;
  githubUrl: string;
  createdAt: string;
  repository?: {
    id: string;
    fullName: string;
    owner: string;
    name: string;
  };
}

export interface Review {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score: number | null;
  summary: string | null;
  errorMsg: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
  pullRequest?: PullRequest;
  comments?: ReviewComment[];
  _count?: { comments: number };
}

export interface ReviewComment {
  id: string;
  file: string;
  line: number | null;
  endLine: number | null;
  severity: 'critical' | 'warning' | 'suggestion' | 'praise';
  category: string;
  body: string;
  suggestion: string | null;
}

export interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  failedReviews: number;
  averageScore: number;
  connectedRepos: number;
  successRate: number;
}
