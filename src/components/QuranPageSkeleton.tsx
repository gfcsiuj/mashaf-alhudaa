export function QuranPageSkeleton() {
    return (
      <div className="max-w-4xl mx-auto p-4 animate-pulse">
        {/* Skeleton for Surah Title */}
        <div className="w-full my-8 flex justify-center">
          <div className="w-1/2 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>

        {/* Skeleton for Basmala */}
        <div className="text-center py-6 mt-4">
          <div className="w-2/3 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"></div>
        </div>

        {/* Skeleton for Verses */}
        <div className="space-y-6 mt-8">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }
