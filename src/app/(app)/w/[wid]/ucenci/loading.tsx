import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Nalagam učence">
      <Skeleton className="h-12 w-56" />
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-72" />
    </div>
  );
}
