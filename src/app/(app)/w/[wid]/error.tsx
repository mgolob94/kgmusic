"use client";

import { ErrorState } from "@/components/ui/states";

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
