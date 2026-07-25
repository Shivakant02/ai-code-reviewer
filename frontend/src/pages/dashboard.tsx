import {
  GitFork,
  MessageSquareCode,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviewStats, useReviews } from '@/api/hooks';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useReviewStats();
  const { data: reviews, isLoading: reviewsLoading } = useReviews();

  const recentReviews = reviews?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.displayName || user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your AI code reviews.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Reviews"
              value={stats?.totalReviews ?? 0}
              icon={MessageSquareCode}
              description="All time"
            />
            <StatCard
              title="Connected Repos"
              value={stats?.connectedRepos ?? 0}
              icon={GitFork}
              description="Active repositories"
            />
            <StatCard
              title="Average Score"
              value={stats?.averageScore ? `${stats.averageScore}/100` : 'N/A'}
              icon={BarChart3}
              description="Code quality score"
            />
            <StatCard
              title="Success Rate"
              value={`${stats?.successRate ?? 0}%`}
              icon={CheckCircle2}
              description={`${stats?.completedReviews ?? 0} completed, ${stats?.failedReviews ?? 0} failed`}
            />
          </>
        )}
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Reviews</CardTitle>
          <Link
            to="/reviews"
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {reviewsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareCode className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Connect a repository and create a pull request to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.id}`}
                  className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      review.status === 'completed'
                        ? 'bg-green-500/10'
                        : review.status === 'failed'
                          ? 'bg-red-500/10'
                          : 'bg-yellow-500/10',
                    )}
                  >
                    {review.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : review.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {review.pullRequest?.title || 'Pull Request'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {review.pullRequest?.repository?.fullName} #
                      {review.pullRequest?.number}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.score !== null && (
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          review.score >= 80
                            ? 'text-green-500'
                            : review.score >= 60
                              ? 'text-yellow-500'
                              : 'text-red-500',
                        )}
                      >
                        {review.score}/100
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        statusColors[review.status],
                      )}
                    >
                      {review.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
