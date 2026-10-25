interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'text' | 'profile';
}

export function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          {type === 'card' && <div className="w-full h-48 bg-slate-200 rounded-xl"></div>}
          {type === 'profile' && (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          )}
          <div className="h-5 bg-slate-200 rounded w-2/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-4/5"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
