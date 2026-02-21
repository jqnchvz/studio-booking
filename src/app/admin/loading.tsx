import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Admin Dashboard Loading State
 *
 * Displays skeleton placeholders while the dashboard data is loading.
 * Matches the structure of the actual dashboard:
 * - Header placeholder
 * - 5 metric card placeholders in grid
 * - Revenue chart placeholder
 * - Activity feed placeholder
 *
 * Uses shimmer animation for visual feedback.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-48 bg-muted rounded animate-pulse" />
        <div className="h-5 w-64 bg-muted rounded animate-pulse" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-40 bg-muted rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* Activity Feed Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
