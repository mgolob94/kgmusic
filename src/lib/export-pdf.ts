import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDate, fmtDuration, fmtMonth, nowLjubljana } from "./date";
import { buildReport, detailRow } from "./report";
import type { LessonView } from "./types";

const A4: [number, number] = [595.28, 841.89];
const M = 40;
const INK = rgb(0.09, 0.13, 0.17);
const SOFT = rgb(0.35, 0.4, 0.45);
const LINE = rgb(0.8, 0.83, 0.8);
const BAND = rgb(0.86, 0.92, 0.91);

type Col = { header: string; width: number; align?: "left" | "right" };

export async function buildPdf(opts: { workspaceName: string; month: string; lessons: LessonView[] }) {
  const { workspaceName, month, lessons } = opts;
  const dir = process.env.FONTS_DIR ?? path.join(process.cwd(), "assets", "fonts");
  const [regular, bold] = await Promise.all([readFile(path.join(dir, "DejaVuSans.ttf")), readFile(path.join(dir, "DejaVuSans-Bold.ttf"))]);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Opravljene ure – ${workspaceName} – ${month}`);
  doc.setCreator("KG Music");
  const f = await doc.embedFont(regular, { subset: true });
  const fb = await doc.embedFont(bold, { subset: true });

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - M;

  const fit = (text: string, font: PDFFont, size: number, max: number) => {
    if (font.widthOfTextAtSize(text, size) <= max) return text;
    let t = text;
    while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > max) t = t.slice(0, -1);
    return t + "…";
  };
  const newPage = () => { page = doc.addPage(A4); y = A4[1] - M; };

  function table(cols: Col[], rows: string[][], opts2?: { boldLast?: boolean }) {
    const size = 8.5;
    const rowH = 18;
    const drawHeader = () => {
      page.drawRectangle({ x: M, y: y - rowH + 4, width: A4[0] - 2 * M, height: rowH, color: BAND });
      let x = M;
      for (const c of cols) {
        const t = fit(c.header, fb, size, c.width - 8);
        const w = fb.widthOfTextAtSize(t, size);
        page.drawText(t, { x: c.align === "right" ? x + c.width - 4 - w : x + 4, y: y - rowH + 10, size, font: fb, color: INK });
        x += c.width;
      }
      y -= rowH;
    };
    if (y - rowH * 2 < M) newPage();
    drawHeader();
    rows.forEach((r, ri) => {
      if (y - rowH < M + 20) { newPage(); drawHeader(); }
      const strong = opts2?.boldLast && ri === rows.length - 1;
      let x = M;
      r.forEach((cell, i) => {
        const c = cols[i];
        const font = strong ? fb : f;
        const t = fit(cell, font, size, c.width - 8);
        const w = font.widthOfTextAtSize(t, size);
        page.drawText(t, { x: c.align === "right" ? x + c.width - 4 - w : x + 4, y: y - rowH + 10, size, font, color: INK });
        x += c.width;
      });
      page.drawLine({ start: { x: M, y: y - rowH + 4 }, end: { x: A4[0] - M, y: y - rowH + 4 }, thickness: 0.5, color: LINE });
      y -= rowH;
    });
    y -= 6;
  }

  // Naslov
  page.drawText(fit(workspaceName, fb, 18, A4[0] - 2 * M), { x: M, y: y - 16, size: 18, font: fb, color: INK });
  y -= 38;
  page.drawText(`Opravljene ure · ${fmtMonth(`${month}-01`)}`, { x: M, y, size: 12, font: f, color: INK });
  y -= 16;
  page.drawText(`Izdelano ${fmtDate(nowLjubljana().date)}`, { x: M, y, size: 9, font: f, color: SOFT });
  y -= 28;

  const { rows, totals } = buildReport(lessons);
  page.drawText("Povzetek", { x: M, y, size: 12, font: fb, color: INK });
  y -= 8;
  const sumCols: Col[] = [
    { header: "Učenec", width: 150 }, { header: "Predmet", width: 55 },
    { header: "Ure (št.)", width: 55, align: "right" }, { header: "Čas", width: 62, align: "right" },
    { header: "Opravič.", width: 55, align: "right" }, { header: "Neopr.", width: 50, align: "right" },
    { header: "Odpadlo", width: 55, align: "right" }, { header: "Odprto", width: 33.28, align: "right" },
  ];
  const sumRows = rows.map((r) => [r.studentName, r.subject, String(r.attended), fmtDuration(r.minutes), String(r.excused), String(r.unexcused), String(r.cancelled), String(r.planned)]);
  sumRows.push(["Skupaj", "", String(totals.attended), fmtDuration(totals.minutes), String(totals.excused), String(totals.unexcused), String(totals.cancelled), String(totals.planned)]);
  if (rows.length === 0) {
    page.drawText("V tem mesecu ni ur.", { x: M, y: y - 14, size: 10, font: f, color: SOFT });
    y -= 30;
  } else {
    table(sumCols, sumRows, { boldLast: true });
  }

  if (lessons.length) {
    y -= 12;
    if (y < M + 80) newPage();
    page.drawText("Vse ure po datumu", { x: M, y, size: 12, font: fb, color: INK });
    y -= 8;
    const cols: Col[] = [
      { header: "Datum", width: 62 }, { header: "Od–do", width: 66 }, { header: "Učenec", width: 130 },
      { header: "Predmet", width: 52 }, { header: "Status", width: 110 }, { header: "Opomba", width: 95.28 },
    ];
    table(cols, lessons.map((l) => { const d = detailRow(l); return [d.date, `${d.from}–${d.to}`, d.student, d.subject, d.status, d.note]; }));
  }

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const t = `Stran ${i + 1} od ${pages.length}`;
    p.drawText(t, { x: A4[0] - M - f.widthOfTextAtSize(t, 8), y: 22, size: 8, font: f, color: SOFT });
    p.drawText("KG Music", { x: M, y: 22, size: 8, font: f, color: SOFT });
  });
  return Buffer.from(await doc.save());
}
