import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Nalagam izvoz">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-11 w-72" />
      <Skeleton className="h-64" />
    </div>
  );
}
