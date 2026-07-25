import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  ThumbsUp,
  FileCode,
  ShieldAlert,
  Zap,
  Eye,
  Layers,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useReview } from '@/api/hooks';
import { cn } from '@/lib/utils';
import type { ReviewComment } from '@/types';

const severityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  critical: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Warning',
  },
  suggestion: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    label: 'Suggestion',
  },
  praise: {
    icon: ThumbsUp,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    label: 'Praise',
  },
};

const categoryIcons: Record<string, React.ElementType> = {
  security: ShieldAlert,
  performance: Zap,
  readability: Eye,
  architecture: Layers,
  reliability: Activity,
};

function CommentCard({ comment }: { comment: ReviewComment }) {
  const severity = severityConfig[comment.severity] || severityConfig.suggestion;
  const SeverityIcon = severity.icon;
  const CategoryIcon = categoryIcons[comment.category] || FileCode;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-sm',
        severity.bg,
      )}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon className={cn('h-5 w-5 mt-0.5 shrink-0', severity.color)} />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('text-xs capitalize', severity.color)}
            >
              {severity.label}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 capitalize">
              <CategoryIcon className="h-3 w-3" />
              {comment.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              <FileCode className="inline h-3 w-3 mr-1" />
              {comment.file}
              {comment.line && `:${comment.line}`}
              {comment.endLine && `-${comment.endLine}`}
            </span>
          </div>

          {/* Body */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>

          {/* Suggestion */}
          {comment.suggestion && (
            <div className="rounded-md bg-muted/50 p-3 mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Suggested fix:
              </p>
              <pre className="text-xs overflow-x-auto font-mono">
                <code>{comment.suggestion}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color =
    score >= 80
      ? 'text-green-500'
      : score >= 60
        ? 'text-yellow-500'
        : 'text-red-500';

  const bgColor =
    score >= 80
      ? 'stroke-green-500/15'
      : score >= 60
        ? 'stroke-yellow-500/15'
        : 'stroke-red-500/15';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={bgColor}
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold', color)}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: review, isLoading } = useReview(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium">Review not found</h2>
        <Link to="/reviews" className="text-primary hover:underline mt-2">
          Back to reviews
        </Link>
      </div>
    );
  }

  const comments = review.comments || [];
  const criticals = comments.filter((c) => c.severity === 'critical');
  const warnings = comments.filter((c) => c.severity === 'warning');
  const suggestions = comments.filter((c) => c.severity === 'suggestion');
  const praises = comments.filter((c) => c.severity === 'praise');

  // Group comments by file
  const fileGroups = comments.reduce(
    (acc, comment) => {
      if (!acc[comment.file]) acc[comment.file] = [];
      acc[comment.file].push(comment);
      return acc;
    },
    {} as Record<string, ReviewComment[]>,
  );

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Link to="/reviews">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {review.pullRequest?.title || 'Pull Request Review'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">
              {review.pullRequest?.repository?.fullName} #
              {review.pullRequest?.number}
            </span>
            {review.pullRequest?.githubUrl && (
              <a
                href={review.pullRequest.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'text-sm capitalize',
            review.status === 'completed'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : review.status === 'failed'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
          )}
        >
          {review.status}
        </Badge>
      </div>

      {/* Score and Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Score */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {review.score !== null ? (
              <ScoreRing score={review.score} />
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No score available</p>
              </div>
            )}
            {review.duration && (
              <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {(review.duration / 1000).toFixed(1)}s review time
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Review Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {review.summary ? (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {review.summary}
              </p>
            ) : review.errorMsg ? (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {review.errorMsg}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary available.
              </p>
            )}

            <Separator />

            {/* Comment breakdown */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: 'Critical',
                  count: criticals.length,
                  color: 'text-red-500',
                  bg: 'bg-red-500/10',
                },
                {
                  label: 'Warning',
                  count: warnings.length,
                  color: 'text-yellow-500',
                  bg: 'bg-yellow-500/10',
                },
                {
                  label: 'Suggestion',
                  count: suggestions.length,
                  color: 'text-blue-500',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Praise',
                  count: praises.length,
                  color: 'text-green-500',
                  bg: 'bg-green-500/10',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex flex-col items-center rounded-lg p-3',
                    item.bg,
                  )}
                >
                  <span className={cn('text-xl font-bold', item.color)}>
                    {item.count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments by file */}
      {comments.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            Review Comments ({comments.length})
          </h2>

          {Object.entries(fileGroups).map(([file, fileComments]) => (
            <Card key={file}>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-mono">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  {file}
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {fileComments.length} comment
                    {fileComments.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {fileComments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
