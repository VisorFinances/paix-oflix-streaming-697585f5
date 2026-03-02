import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonRowProps {
  title?: string;
  count?: number;
}

const SkeletonRow = ({ title, count = 5 }: SkeletonRowProps) => (
  <section className="mb-6 sm:mb-8">
    <div className="px-3 sm:px-4 md:px-12 mb-2 sm:mb-3">
      {title ? (
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display tracking-wider text-foreground">{title}</h2>
      ) : (
        <Skeleton className="h-7 w-48 rounded" />
      )}
    </div>
    <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 md:px-12 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]">
          <Skeleton className="aspect-[2/3] rounded-md" />
          <Skeleton className="h-3 w-3/4 mt-2 rounded" />
          <Skeleton className="h-2.5 w-1/2 mt-1 rounded" />
        </div>
      ))}
    </div>
  </section>
);

export default SkeletonRow;
