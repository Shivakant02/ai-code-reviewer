import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquareCode,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReviews } from '@/api/hooks';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const color =
    score >= 80
      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      : score >= 60
        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
        color,
      )}
    >
      {score}/100
    </span>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const config = statusConfig[review.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const timeAgo = getTimeAgo(review.createdAt);

  return (
    <Link
      to={`/reviews/${review.id}`}
      className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          config.bg,
        )}
      >
        <StatusIcon
          className={cn(
            'h-5 w-5',
            config.color,
            review.status === 'processing' && 'animate-spin',
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {review.pullRequest?.title || 'Pull Request Review'}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {review.pullRequest?.repository?.fullName}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            #{review.pullRequest?.number}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {review._count?.comments !== undefined && review._count.comments > 0 && (
          <span className="text-xs text-muted-foreground">
            {review._count.comments} comments
          </span>
        )}
        <ScoreBadge score={review.score} />
        <Badge
          variant="secondary"
          className={cn('text-xs capitalize', config.bg, config.color)}
        >
          {review.status}
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: reviews, isLoading } = useReviews(
    statusFilter === 'all' ? undefined : statusFilter,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-1">
            View all AI-generated code reviews for your pull requests.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            All
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="processing" className="gap-1.5">
            <Loader2 className="h-3.5 w-3.5" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : reviews?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquareCode className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No reviews found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {statusFilter === 'all'
                ? 'Reviews will appear here once pull requests are reviewed.'
                : `No ${statusFilter} reviews found.`}
            </p>
            {statusFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
              >
                Show all reviews
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews?.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
