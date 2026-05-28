// Использует встроенный node:sqlite (Node.js >= 22.5, стабилен в 24+).
// Не требует нативной компиляции, в отличие от better-sqlite3.
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Application, ApplicationStatus, Appeal, AppealStatus } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'bot.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    userId          TEXT PRIMARY KEY,
    username        TEXT NOT NULL,
    guildId         TEXT NOT NULL,
    answers         TEXT NOT NULL,
    submittedAt     INTEGER NOT NULL,
    status          TEXT NOT NULL,
    reviewMessageUrl TEXT,
    reviewerId      TEXT,
    reason          TEXT
  );

  CREATE TABLE IF NOT EXISTS appeals (
    userId      TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    text        TEXT NOT NULL,
    submittedAt INTEGER NOT NULL,
    status      TEXT NOT NULL,
    reviewerId  TEXT,
    reason      TEXT
  );
`);

// --- Applications ---

interface AppRow {
  userId: string;
  username: string;
  guildId: string;
  answers: string;
  submittedAt: number;
  status: ApplicationStatus;
  reviewMessageUrl: string | null;
  reviewerId: string | null;
  reason: string | null;
}

function rowToApp(row: AppRow): Application {
  return {
    userId: row.userId,
    username: row.username,
    guildId: row.guildId,
    answers: JSON.parse(row.answers),
    submittedAt: row.submittedAt,
    status: row.status,
    reviewMessageUrl: row.reviewMessageUrl ?? undefined,
    reviewerId: row.reviewerId ?? undefined,
    reason: row.reason ?? undefined,
  };
}

const insertApp = db.prepare(`
  INSERT INTO applications (userId, username, guildId, answers, submittedAt, status, reviewMessageUrl, reviewerId, reason)
  VALUES (@userId, @username, @guildId, @answers, @submittedAt, @status, @reviewMessageUrl, @reviewerId, @reason)
  ON CONFLICT(userId) DO UPDATE SET
    username = excluded.username,
    answers = excluded.answers,
    submittedAt = excluded.submittedAt,
    status = excluded.status,
    reviewMessageUrl = excluded.reviewMessageUrl,
    reviewerId = excluded.reviewerId,
    reason = excluded.reason
`);

export function saveApplication(app: Application): void {
  insertApp.run({
    userId: app.userId,
    username: app.username,
    guildId: app.guildId,
    answers: JSON.stringify(app.answers),
    submittedAt: app.submittedAt,
    status: app.status,
    reviewMessageUrl: app.reviewMessageUrl ?? null,
    reviewerId: app.reviewerId ?? null,
    reason: app.reason ?? null,
  });
}

const selectApp = db.prepare('SELECT * FROM applications WHERE userId = ?');

export function getApplication(userId: string): Application | undefined {
  const row = selectApp.get(userId) as AppRow | undefined;
  return row ? rowToApp(row) : undefined;
}

export function updateApplication(
  userId: string,
  patch: Partial<Application>,
): Application | undefined {
  const current = getApplication(userId);
  if (!current) return undefined;
  const updated = { ...current, ...patch };
  saveApplication(updated);
  return updated;
}

// --- Appeals ---

interface AppealRow {
  userId: string;
  username: string;
  text: string;
  submittedAt: number;
  status: AppealStatus;
  reviewerId: string | null;
  reason: string | null;
}

function rowToAppeal(row: AppealRow): Appeal {
  return {
    userId: row.userId,
    username: row.username,
    text: row.text,
    submittedAt: row.submittedAt,
    status: row.status,
    reviewerId: row.reviewerId ?? undefined,
    reason: row.reason ?? undefined,
  };
}

const insertAppeal = db.prepare(`
  INSERT INTO appeals (userId, username, text, submittedAt, status, reviewerId, reason)
  VALUES (@userId, @username, @text, @submittedAt, @status, @reviewerId, @reason)
  ON CONFLICT(userId) DO UPDATE SET
    username = excluded.username,
    text = excluded.text,
    submittedAt = excluded.submittedAt,
    status = excluded.status,
    reviewerId = excluded.reviewerId,
    reason = excluded.reason
`);

export function saveAppeal(appeal: Appeal): void {
  insertAppeal.run({
    userId: appeal.userId,
    username: appeal.username,
    text: appeal.text,
    submittedAt: appeal.submittedAt,
    status: appeal.status,
    reviewerId: appeal.reviewerId ?? null,
    reason: appeal.reason ?? null,
  });
}

const selectAppeal = db.prepare('SELECT * FROM appeals WHERE userId = ?');

export function getAppeal(userId: string): Appeal | undefined {
  const row = selectAppeal.get(userId) as AppealRow | undefined;
  return row ? rowToAppeal(row) : undefined;
}

export function updateAppeal(userId: string, patch: Partial<Appeal>): Appeal | undefined {
  const current = getAppeal(userId);
  if (!current) return undefined;
  const updated = { ...current, ...patch };
  saveAppeal(updated);
  return updated;
}
