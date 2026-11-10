import { z } from "zod";
import { STATUSES, SUBJECTS } from "./status";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vnesite uro v obliki 15:30");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izberite datum");
const optional = z.string().trim().max(200, "Največ 200 znakov");

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Vnesite ime šole (vsaj 2 znaka)").max(80, "Največ 80 znakov"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Izberite barvo"),
});
export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const studentSchema = z.object({
  firstName: z.string().trim().min(1, "Vnesite ime").max(60),
  lastName: z.string().trim().min(1, "Vnesite priimek").max(60),
  birthYear: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{4}$/.test(v) && +v >= 1930 && +v <= new Date().getFullYear()), "Vnesite štirimestno letnico"),
  phone: optional,
  parentName: optional,
  parentPhone: optional,
  parentEmail: z.string().trim().max(120).refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Neveljaven e-naslov"),
  notes: z.string().trim().max(1000, "Največ 1000 znakov"),
  gdprConsent: z.boolean(),
});
export type StudentInput = z.infer<typeof studentSchema>;

export const slotSchema = z
  .object({
    studentId: z.string().uuid("Izberite učenca"),
    subject: z.enum(SUBJECTS),
    weekday: z.number().int().min(1).max(7),
    startTime: time,
    durationMin: z.number().int().min(10, "Najmanj 10 minut").max(240, "Največ 240 minut"),
    startDate: isoDate,
    endDate: isoDate,
    skipHolidays: z.boolean(),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "Konec mora biti po začetku" });
export type SlotInput = z.infer<typeof slotSchema>;

export const lessonEditSchema = z.object({
  date: isoDate,
  startTime: time,
  durationMin: z.number().int().min(10, "Najmanj 10 minut").max(240, "Največ 240 minut"),
  subject: z.enum(SUBJECTS),
});
export type LessonEditInput = z.infer<typeof lessonEditSchema>;

export const lessonCreateSchema = lessonEditSchema.extend({ studentId: z.string().uuid("Izberite učenca") });
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;

export const statusSchema = z.enum(STATUSES);
export const idSchema = z.string().uuid();
