import ExcelJS from "exceljs";
import { fmtMonth, WEEKDAYS, isoWeekday, nowLjubljana, fmtDate } from "./date";
import { buildReport, detailRow, hoursDecimal } from "./report";
import type { LessonView } from "./types";

export async function buildXlsx(opts: { workspaceName: string; month: string; lessons: LessonView[] }) {
  const { workspaceName, month, lessons } = opts;
  const { rows } = buildReport(lessons);
  const title = `${workspaceName} – opravljene ure, ${fmtMonth(`${month}-01`).toLowerCase()}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KG Music";
  wb.created = new Date();

  const head = (row: ExcelJS.Row) => {
    row.font = { bold: true };
    row.alignment = { vertical: "middle", wrapText: true };
    row.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEBEA" } };
      c.border = { bottom: { style: "thin", color: { argb: "FF1D5B63" } } };
    });
  };

  // ── Povzetek
  const s1 = wb.addWorksheet("Povzetek", { views: [{ state: "frozen", ySplit: 4 }] });
  s1.mergeCells("A1:I1");
  s1.getCell("A1").value = title;
  s1.getCell("A1").font = { bold: true, size: 14 };
  s1.getCell("A2").value = `Izvoženo ${fmtDate(nowLjubljana().date)}`;
  s1.getCell("A2").font = { color: { argb: "FF5A6672" } };
  s1.columns = [
    { key: "student", width: 26 }, { key: "subject", width: 12 }, { key: "attended", width: 14 },
    { key: "minutes", width: 14 }, { key: "hours", width: 14 }, { key: "excused", width: 16 },
    { key: "unexcused", width: 16 }, { key: "cancelled", width: 12 }, { key: "planned", width: 16 },
  ];
  head(s1.getRow(4));
  s1.getRow(4).values = ["Učenec", "Predmet", "Opravljene ure (št.)", "Opravljeno (min)", "Opravljeno (ure)", "Opravičeni izostanki", "Neopravičeni izostanki", "Odpadlo", "Še nezabeleženo"];
  head(s1.getRow(4));
  s1.getRow(4).height = 32;
  rows.forEach((r, i) => {
    const rowNum = 5 + i;
    s1.getRow(rowNum).values = [r.studentName, r.subject, r.attended, r.minutes, { formula: `D${rowNum}/60`, result: hoursDecimal(r.minutes) }, r.excused, r.unexcused, r.cancelled, r.planned];
    s1.getCell(`E${rowNum}`).numFmt = "0.00";
  });
  const last = 4 + rows.length;
  const tot = s1.getRow(last + 1);
  tot.values = ["Skupaj", "", ...(["C", "D", "E", "F", "G", "H", "I"] as const).map((c) => ({ formula: rows.length ? `SUM(${c}5:${c}${last})` : "0" }))];
  tot.font = { bold: true };
  tot.eachCell((c) => { c.border = { top: { style: "thin" } }; });
  s1.getCell(`E${last + 1}`).numFmt = "0.00";

  // ── Termini
  const s2 = wb.addWorksheet("Termini", { views: [{ state: "frozen", ySplit: 1 }] });
  s2.columns = [
    { header: "Datum", key: "date", width: 13 }, { header: "Dan", key: "day", width: 8 },
    { header: "Od", key: "from", width: 8 }, { header: "Do", key: "to", width: 8 },
    { header: "Trajanje (min)", key: "minutes", width: 14 }, { header: "Učenec", key: "student", width: 26 },
    { header: "Predmet", key: "subject", width: 12 }, { header: "Status", key: "status", width: 24 },
    { header: "Opomba", key: "note", width: 40 },
  ];
  head(s2.getRow(1));
  for (const l of lessons) {
    const d = detailRow(l);
    const [y, m, day] = l.date.split("-").map(Number);
    s2.addRow({
      date: new Date(Date.UTC(y, m - 1, day)),
      day: WEEKDAYS.find((w) => w.value === isoWeekday(l.date))!.short,
      from: d.from, to: d.to, minutes: d.minutes, student: d.student, subject: d.subject, status: d.status, note: d.note,
    });
  }
  s2.getColumn("date").numFmt = "dd. mm. yyyy";
  s2.autoFilter = { from: "A1", to: "I1" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
