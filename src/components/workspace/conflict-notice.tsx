import { TriangleAlert } from "lucide-react";
import { fmtDayShort } from "@/lib/date";
import type { Conflict } from "@/lib/types";

export function ConflictNotice({ conflicts, total }: { conflicts: Conflict[]; total: number }) {
  if (total === 0) return null;
  return (
    <div role="status" className="rounded-xl border border-excused/30 bg-excused-soft px-3.5 py-3 text-sm text-ink">
      <p className="flex items-center gap-2 font-semibold text-excused">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        {total === 1 ? "Termin se prekriva z drugo uro" : `Prekrivanja z drugimi urami: ${total}`}
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-ink-soft">
        {conflicts.map((c, i) => (
          <li key={i}>
            {fmtDayShort(c.date)} ob {c.startTime}: {c.studentName} ({c.workspaceName})
          </li>
        ))}
        {total > conflicts.length && <li>… in še {total - conflicts.length}</li>}
      </ul>
    </div>
  );
}
