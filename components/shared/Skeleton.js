'use client';

export function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-light-4 dark:bg-dark-4 rounded-lg ${className}`} />
    );
}

export function ProfileSkeleton() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-10 min-h-screen">
            <div className="mb-10">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-1 w-12" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <div className="bg-light-2 dark:bg-dark-3 rounded-2xl p-6">
                        <Skeleton className="h-7 w-40 mb-2" />
                        <Skeleton className="h-4 w-56 mb-6" />
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                        <div className="mt-5 space-y-2">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                    <div className="bg-light-2 dark:bg-dark-3 rounded-2xl p-6">
                        <Skeleton className="h-6 w-20 mb-4" />
                        <div className="flex flex-wrap gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-7 w-24 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="bg-light-2 dark:bg-dark-3 rounded-2xl p-6">
                        <Skeleton className="h-6 w-40 mb-5" />
                        <div className="flex gap-8 items-center">
                            <Skeleton className="w-[110px] h-[110px] rounded-full" />
                            <div className="flex-grow space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-light-2 dark:bg-dark-3 rounded-2xl p-6">
                        <Skeleton className="h-6 w-24 mb-4" />
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="bg-light-2 dark:bg-dark-3 rounded-2xl p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="flex items-center justify-center mt-8 px-2">
            <div className="max-w-lg w-full">
                <Skeleton className="h-4 w-16 mb-4" />
                <Skeleton className="h-7 w-48 mb-6" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <div className="flex gap-3">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
