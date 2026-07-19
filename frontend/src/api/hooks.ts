import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { User, Repository, GithubRepo, Review, ReviewStats } from '@/types';

// Auth
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false,
  });
}

// Repositories
export function useRepositories() {
  return useQuery<Repository[]>({
    queryKey: ['repositories'],
    queryFn: async () => {
      const { data } = await api.get('/repositories');
      return data;
    },
  });
}

export function useGithubRepos() {
  return useQuery<GithubRepo[]>({
    queryKey: ['githubRepos'],
    queryFn: async () => {
      const { data } = await api.get('/repositories/github');
      return data;
    },
  });
}

export function useConnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (repo: GithubRepo) => {
      const { data } = await api.post('/repositories', {
        githubRepoId: String(repo.id),
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        isPrivate: repo.isPrivate,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useDisconnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/repositories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useToggleReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/repositories/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

// Reviews
export function useReviews(status?: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const { data } = await api.get('/reviews', { params });
      return data;
    },
  });
}

export function useReview(id: string) {
  return useQuery<Review>({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useReviewStats() {
  return useQuery<ReviewStats>({
    queryKey: ['reviewStats'],
    queryFn: async () => {
      const { data } = await api.get('/reviews/stats');
      return data;
    },
  });
}
