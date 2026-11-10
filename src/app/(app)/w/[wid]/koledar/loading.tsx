import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Nalagam koledar">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <Skeleton className="h-[34rem]" />
    </div>
  );
}
