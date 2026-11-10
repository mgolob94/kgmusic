import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Nalagam">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24" />
      <div className="grid gap-5 lg:grid-cols-[1fr_21rem]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
