import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const lessonStatus = pgEnum("lesson_status", [
  "planned", // načrtovano (še ni zabeleženo)
  "attended", // opravljeno
  "absent_excused", // izostanek – opravičen
  "absent_unexcused", // izostanek – neopravičen
  "cancelled", // odpadlo (praznik, odpoved učiteljice ...)
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Workspace = ena glasbena šola (ločeni učenci in urnik). */
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#4f46e5"),
    /** Privzeti obseg sezone (mesec/dan) – uporabljeno kot predloga pri vnosu terminov. */
    seasonStartMonth: integer("season_start_month").notNull().default(9),
    seasonEndMonth: integer("season_end_month").notNull().default(6),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workspaces_user_idx").on(t.userId)],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    birthYear: integer("birth_year"),
    phone: text("phone"),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    parentEmail: text("parent_email"),
    instrument: text("instrument"), // klavir / petje ...
    gdprConsent: boolean("gdpr_consent").notNull().default(false),
    gdprConsentDate: date("gdpr_consent_date", { mode: "string" }),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("students_ws_idx").on(t.workspaceId)],
);

/** Tedensko ponavljajoč termin (npr. vsako sredo ob 16:00 od 1.9. do 30.6.). */
export const slots = pgTable(
  "slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 1 = ponedeljek ... 7 = nedelja
    startTime: text("start_time").notNull(), // HH:MM
    durationMin: integer("duration_min").notNull().default(45),
    subject: text("subject"), // klavir / petje
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    /** Ali se državni prazniki preskočijo pri ustvarjanju terminov (velja tudi pri podaljšanju). */
    skipHolidays: boolean("skip_holidays").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("slots_ws_idx").on(t.workspaceId), index("slots_student_idx").on(t.studentId)],
);

/** Posamezna ura (konkreten datum). Generirana iz termina ali ročno dodana (nadomestna ura). */
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id").references(() => slots.id, { onDelete: "set null" }),
    date: date("date", { mode: "string" }).notNull(),
    startTime: text("start_time").notNull(),
    durationMin: integer("duration_min").notNull(),
    subject: text("subject"),
    status: lessonStatus("status").notNull().default("planned"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lessons_ws_date_idx").on(t.workspaceId, t.date),
    index("lessons_student_idx").on(t.studentId),
    uniqueIndex("lessons_slot_date_uq").on(t.slotId, t.date),
  ],
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  students: many(students),
  slots: many(slots),
  lessons: many(lessons),
}));
export const studentsRelations = relations(students, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [students.workspaceId], references: [workspaces.id] }),
  slots: many(slots),
  lessons: many(lessons),
}));
export const slotsRelations = relations(slots, ({ one, many }) => ({
  student: one(students, { fields: [slots.studentId], references: [students.id] }),
  lessons: many(lessons),
}));
export const lessonsRelations = relations(lessons, ({ one }) => ({
  student: one(students, { fields: [lessons.studentId], references: [students.id] }),
  slot: one(slots, { fields: [lessons.slotId], references: [slots.id] }),
}));

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonStatus = (typeof lessonStatus.enumValues)[number];
