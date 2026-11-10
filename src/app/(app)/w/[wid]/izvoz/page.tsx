import Link from "next/link";
import { notFound } from "next/navigation";
import { addMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, TriangleAlert, CalendarX2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getWorkspace, lessonsBetween } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { fmtDuration, fmtMonth, monthEndIso, todayIso, toDate, toIso } from "@/lib/date";
import { buildReport } from "@/lib/report";

export const dynamic = "force-dynamic";
export const metadata = { title: "Izvoz ur" };

export default async function ExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ wid: string }>;
  searchParams: Promise<{ mesec?: string }>;
}) {
  const { wid } = await params;
  const { mesec } = await searchParams;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();

  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesec ?? "") ? mesec! : todayIso().slice(0, 7);
  const from = `${month}-01`;
  const lessons = await lessonsBetween(ws.id, from, monthEndIso(from));
  const { rows, totals } = buildReport(lessons);
  const prev = format(addMonths(toDate(from), -1), "yyyy-MM");
  const next = format(addMonths(toDate(from), 1), "yyyy-MM");
  const dl = (f: "xlsx" | "pdf") => `/api/export?workspace=${ws.id}&month=${month}&format=${f}`;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl md:text-4xl">Izvoz ur</h1>
        <p className="text-ink-soft">Opravljene ure za {ws.name}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`?mesec=${prev}`} aria-label="Prejšnji mesec" className={buttonClass("secondary", "icon")}><ChevronLeft className="size-5" aria-hidden /></Link>
        <h2 className="min-w-44 text-center font-display text-xl" aria-live="polite">{fmtMonth(from)}</h2>
        <Link href={`?mesec=${next}`} aria-label="Naslednji mesec" className={buttonClass("secondary", "icon")}><ChevronRight className="size-5" aria-hidden /></Link>
        <Link href="?" className={buttonClass("ghost")}>Ta mesec</Link>
      </div>

      {totals.planned > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-excused/30 bg-excused-soft px-4 py-3 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-excused" aria-hidden />
          <span className="min-w-0 flex-1">
            <strong>{totals.planned}</strong> {totals.planned === 1 ? "ura še ni zabeležena" : "ur še ni zabeleženih"}. V izvozu so označene kot »Načrtovano«.
          </span>
          <Link href={`/w/${ws.id}/koledar?view=month&date=${from}`} className="min-h-11 py-2.5 font-semibold text-excused underline underline-offset-4">
            Odpri koledar
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarX2 className="size-6" aria-hidden />} title="V tem mesecu ni ur">
          Izberite drug mesec ali dodajte učence in tedenske termine.
        </EmptyState>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-surface shadow-soft">
            <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
              <caption className="sr-only">Povzetek ur po učencih za {fmtMonth(from)}</caption>
              <thead>
                <tr className="border-b border-line text-sm text-ink-soft">
                  <th scope="col" className="px-4 py-3 font-medium">Učenec</th>
                  <th scope="col" className="px-2 py-3 font-medium">Predmet</th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">Ure</th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">Čas</th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">Opravičeni</th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">Neopravičeni</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Odpadlo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tnum">
                {rows.map((r) => (
                  <tr key={`${r.studentId}${r.subject}`}>
                    <th scope="row" className="px-4 py-3 font-semibold">{r.studentName}</th>
                    <td className="px-2 py-3 text-ink-soft">{r.subject}</td>
                    <td className="px-2 py-3 text-right font-semibold">{r.attended}</td>
                    <td className="px-2 py-3 text-right">{fmtDuration(r.minutes)}</td>
                    <td className="px-2 py-3 text-right">{r.excused}</td>
                    <td className="px-2 py-3 text-right">{r.unexcused}</td>
                    <td className="px-4 py-3 text-right">{r.cancelled}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line-strong font-semibold tnum">
                  <th scope="row" className="px-4 py-3">Skupaj</th>
                  <td />
                  <td className="px-2 py-3 text-right">{totals.attended}</td>
                  <td className="px-2 py-3 text-right">{fmtDuration(totals.minutes)}</td>
                  <td className="px-2 py-3 text-right">{totals.excused}</td>
                  <td className="px-2 py-3 text-right">{totals.unexcused}</td>
                  <td className="px-4 py-3 text-right">{totals.cancelled}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={dl("xlsx")} className={buttonClass("primary")}><FileSpreadsheet className="size-5" aria-hidden /> Prenesi Excel</a>
            <a href={dl("pdf")} className={buttonClass("secondary")}><FileText className="size-5" aria-hidden /> Prenesi PDF</a>
          </div>
          <p className="text-sm text-ink-faint">
            Izvoz vsebuje povzetek in seznam vseh ur v mesecu. Obračun (cene ur) bomo dodali pozneje.
          </p>
        </>
      )}
    </div>
  );
}
