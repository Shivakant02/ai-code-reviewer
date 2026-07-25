import { useState } from 'react';
import {
  GitFork,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useRepositories,
  useGithubRepos,
  useConnectRepo,
  useDisconnectRepo,
  useToggleReview,
} from '@/api/hooks';
import type { GithubRepo } from '@/types';
import { cn } from '@/lib/utils';

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-500',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  Ruby: 'bg-red-400',
  PHP: 'bg-purple-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
};

export function RepositoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: repos, isLoading } = useRepositories();
  const { data: githubRepos, isLoading: ghLoading } = useGithubRepos();
  const connectRepo = useConnectRepo();
  const disconnectRepo = useDisconnectRepo();
  const toggleReview = useToggleReview();

  const connectedIds = new Set(repos?.map((r) => r.githubRepoId) || []);
  const availableRepos =
    githubRepos?.filter(
      (r) =>
        !connectedIds.has(r.id) &&
        r.fullName.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const handleConnect = async (repo: GithubRepo) => {
    await connectRepo.mutateAsync(repo);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connected GitHub repositories.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Connect Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>Connect a Repository</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 overflow-hidden min-h-0 flex-1 mt-2">
              {/* Search */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Repo list */}
              <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1 min-h-0 w-full">
                {ghLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Skeleton className="h-8 w-8 rounded shrink-0" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))
                ) : availableRepos.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {search
                      ? 'No matching repositories found.'
                      : 'All repositories are already connected.'}
                  </p>
                ) : (
                  availableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-all hover:bg-muted/60 hover:border-foreground/20"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted border">
                          {repo.isPrivate ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">
                            {repo.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {repo.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(repo)}
                        disabled={connectRepo.isPending}
                        className="shrink-0 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {connectRepo.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected repos */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : repos?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitFork className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">
              No repositories connected
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect a GitHub repository to start getting AI code reviews.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Connect Repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos?.map((repo) => (
            <Card
              key={repo.id}
              className="group transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">
                    {repo.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {repo.owner}/{repo.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {repo.isPrivate ? (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="mr-1 h-3 w-3" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="mr-1 h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {repo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          languageColors[repo.language] || 'bg-gray-400',
                        )}
                      />
                      {repo.language}
                    </div>
                  )}
                  <span>{repo._count?.pullRequests ?? 0} PRs</span>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={repo.reviewEnabled}
                      onCheckedChange={() => toggleReview.mutate(repo.id)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {repo.reviewEnabled
                        ? 'Reviews enabled'
                        : 'Reviews disabled'}
                    </span>
                  </div>

                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(
                          `https://github.com/${repo.fullName}`,
                          '_blank',
                        )
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => disconnectRepo.mutate(repo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
