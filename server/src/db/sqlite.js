import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { appConfig } from '../config.js';

const dataDir = path.dirname(appConfig.dbPath);

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(appConfig.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const now = () => new Date().toISOString();

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'nurse', 'doctor')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      age INTEGER,
      weight REAL,
      medical_history TEXT,
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      bed_number TEXT NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      assessment_json TEXT NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      updated_by_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id),
      FOREIGN KEY(updated_by_user_id) REFERENCES users(id)
    );
  `);

  const usersTableSql = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'`)
    .get()?.sql;

  if (usersTableSql && !usersTableSql.includes(`'doctor'`)) {
    db.exec(`PRAGMA foreign_keys = OFF`);
    db.exec(`
      ALTER TABLE users RENAME TO users_old;

      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'nurse', 'doctor')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO users (id, full_name, username, password_hash, role, status, created_at, updated_at)
      SELECT id, full_name, username, password_hash, role, status, created_at, updated_at
      FROM users_old;

      DROP TABLE users_old;
    `);
    db.exec(`PRAGMA foreign_keys = ON`);
  }

  const patientColumns = db.prepare(`PRAGMA table_info(patients)`).all();
  if (!patientColumns.some((column) => column.name === 'discharge_date')) {
    db.exec(`ALTER TABLE patients ADD COLUMN discharge_date TEXT`);
  }

  seedDefaults();
}

function seedDefaults() {
  const adminCount = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`).get().count;
  const nurseExists = db
    .prepare(`SELECT COUNT(*) AS count FROM users WHERE username = ?`)
    .get(appConfig.seedNurseUsername).count;
  const doctorExists = db
    .prepare(`SELECT COUNT(*) AS count FROM users WHERE username = ?`)
    .get(appConfig.seedDoctorUsername).count;

  if (adminCount === 0) {
    const timestamp = now();
    db.prepare(
      `
        INSERT INTO users (full_name, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', 'active', ?, ?)
      `,
    ).run(
      appConfig.seedAdminName,
      appConfig.seedAdminUsername,
      bcrypt.hashSync(appConfig.seedAdminPassword, 10),
      timestamp,
      timestamp,
    );
  }

  if (!nurseExists) {
    const timestamp = now();
    db.prepare(
      `
        INSERT INTO users (full_name, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'nurse', 'active', ?, ?)
      `,
    ).run(
      appConfig.seedNurseName,
      appConfig.seedNurseUsername,
      bcrypt.hashSync(appConfig.seedNursePassword, 10),
      timestamp,
      timestamp,
    );
  }

  if (!doctorExists) {
    const timestamp = now();
    db.prepare(
      `
        INSERT INTO users (full_name, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'doctor', 'active', ?, ?)
      `,
    ).run(
      appConfig.seedDoctorName,
      appConfig.seedDoctorUsername,
      bcrypt.hashSync(appConfig.seedDoctorPassword, 10),
      timestamp,
      timestamp,
    );
  }
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function listUsers() {
  return db
    .prepare(
      `
        SELECT id, full_name, username, role, status, created_at, updated_at
        FROM users
        WHERE role IN ('nurse', 'doctor')
        ORDER BY full_name COLLATE NOCASE
      `,
    )
    .all()
    .map(sanitizeUser);
}

export function createUser({ fullName, username, passwordHash, role = 'nurse', status = 'active' }) {
  const timestamp = now();
  const result = db
    .prepare(
      `
        INSERT INTO users (full_name, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(fullName, username, passwordHash, role, status, timestamp, timestamp);

  return getUserById(result.lastInsertRowid);
}

export function updateUser(id, { fullName, username, role, status, passwordHash }) {
  const current = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  if (!current) {
    return null;
  }

  const timestamp = now();
  db.prepare(
    `
      UPDATE users
      SET full_name = ?, username = ?, role = ?, status = ?, password_hash = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(
    fullName ?? current.full_name,
    username ?? current.username,
    role ?? current.role,
    status ?? current.status,
    passwordHash ?? current.password_hash,
    timestamp,
    id,
  );

  return getUserById(id);
}

export function getUserById(id) {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  return sanitizeUser(user);
}

export function getUserByUsername(username) {
  return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
}

export function listPatients(search = '', status = 'active') {
  const query = search.trim();
  const filters = [];
  const params = [];

  if (status === 'active') {
    filters.push('p.discharge_date IS NULL OR p.discharge_date = \'\'');
  } else if (status === 'discharged') {
    filters.push('p.discharge_date IS NOT NULL AND p.discharge_date != \'\'');
  }

  if (query) {
    filters.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.bed_number LIKE ?)');
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  const rows = db
    .prepare(
      `
        SELECT
          p.*,
          (
            SELECT e.entry_date || ' ' || e.entry_time
            FROM entries e
            WHERE e.patient_id = p.id
            ORDER BY e.entry_date DESC, e.entry_time DESC
            LIMIT 1
          ) AS last_entry
        FROM patients p
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY p.updated_at DESC
      `,
    )
    .all(...params);

  return rows.map(mapPatientRow);
}

export function createPatient(input, userId) {
  const timestamp = now();
  const result = db
    .prepare(
      `
        INSERT INTO patients (
          first_name, last_name, age, weight, medical_history, admission_date, discharge_date, bed_number,
          created_by_user_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.firstName,
      input.lastName,
      input.age || null,
      input.weight || null,
      input.medicalHistory || null,
      input.admissionDate,
      input.dischargeDate || null,
      input.bedNumber,
      userId,
      timestamp,
      timestamp,
    );

  return getPatientById(result.lastInsertRowid);
}

export function updatePatient(id, input) {
  const current = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id);
  if (!current) {
    return null;
  }

  const timestamp = now();
  db.prepare(
    `
      UPDATE patients
      SET first_name = ?, last_name = ?, age = ?, weight = ?, medical_history = ?, admission_date = ?, discharge_date = ?, bed_number = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(
    input.firstName,
    input.lastName,
    input.age || null,
    input.weight || null,
    input.medicalHistory || null,
    input.admissionDate,
    input.dischargeDate || null,
    input.bedNumber,
    timestamp,
    id,
  );

  return getPatientById(id);
}

export function getPatientById(id) {
  const row = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id);
  return row ? mapPatientRow(row) : null;
}

export function listEntriesByPatient(patientId) {
  const rows = db
    .prepare(
      `
        SELECT
          e.*,
          uc.full_name AS created_by_name,
          uu.full_name AS updated_by_name
        FROM entries e
        JOIN users uc ON uc.id = e.created_by_user_id
        JOIN users uu ON uu.id = e.updated_by_user_id
        WHERE e.patient_id = ?
        ORDER BY e.entry_date DESC, e.entry_time DESC
      `,
    )
    .all(patientId);

  return rows.map(mapEntryRow);
}

export function getEntryById(id) {
  const row = db
    .prepare(
      `
        SELECT
          e.*,
          uc.full_name AS created_by_name,
          uu.full_name AS updated_by_name
        FROM entries e
        JOIN users uc ON uc.id = e.created_by_user_id
        JOIN users uu ON uu.id = e.updated_by_user_id
        WHERE e.id = ?
      `,
    )
    .get(id);

  return row ? mapEntryRow(row) : null;
}

export function createEntry(patientId, input, userId) {
  const timestamp = now();
  const result = db
    .prepare(
      `
        INSERT INTO entries (
          patient_id, entry_date, entry_time, assessment_json,
          created_by_user_id, updated_by_user_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      patientId,
      input.entryDate,
      input.entryTime,
      JSON.stringify(input.assessment),
      userId,
      userId,
      timestamp,
      timestamp,
    );

  db.prepare(`UPDATE patients SET updated_at = ? WHERE id = ?`).run(timestamp, patientId);
  return getEntryById(result.lastInsertRowid);
}

export function updateEntry(id, input, userId) {
  const current = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id);
  if (!current) {
    return null;
  }

  const timestamp = now();
  db.prepare(
    `
      UPDATE entries
      SET entry_date = ?, entry_time = ?, assessment_json = ?, updated_by_user_id = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(input.entryDate, input.entryTime, JSON.stringify(input.assessment), userId, timestamp, id);

  db.prepare(`UPDATE patients SET updated_at = ? WHERE id = ?`).run(timestamp, current.patient_id);
  return getEntryById(id);
}

export function deleteEntry(id) {
  const current = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id);
  if (!current) {
    return false;
  }

  const timestamp = now();
  db.prepare(`DELETE FROM entries WHERE id = ?`).run(id);
  db.prepare(`UPDATE patients SET updated_at = ? WHERE id = ?`).run(timestamp, current.patient_id);
  return true;
}

export function getDashboardStats() {
  return {
    nurses: db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'nurse'`).get().count,
    patients: db.prepare(`SELECT COUNT(*) AS count FROM patients`).get().count,
    entriesToday: db.prepare(`SELECT COUNT(*) AS count FROM entries WHERE entry_date = ?`).get(new Date().toISOString().slice(0, 10)).count,
    recentEntries: db
      .prepare(
        `
          SELECT e.id, e.entry_date, e.entry_time, p.first_name, p.last_name, u.full_name AS nurse_name
          FROM entries e
          JOIN patients p ON p.id = e.patient_id
          JOIN users u ON u.id = e.created_by_user_id
          ORDER BY e.entry_date DESC, e.entry_time DESC
          LIMIT 5
        `,
      )
      .all()
      .map((row) => ({
        id: row.id,
        entryDate: row.entry_date,
        entryTime: row.entry_time,
        patientName: `${row.last_name} ${row.first_name}`,
        nurseName: row.nurse_name,
      })),
    recentPatients: db
      .prepare(
        `
          SELECT id, first_name, last_name, bed_number, updated_at
          FROM patients
          ORDER BY updated_at DESC
          LIMIT 5
        `,
      )
      .all()
      .map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        bedNumber: row.bed_number,
        updatedAt: row.updated_at,
      })),
  };
}

function mapPatientRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    weight: row.weight,
    medicalHistory: row.medical_history,
    admissionDate: row.admission_date,
    dischargeDate: row.discharge_date ?? '',
    status: row.discharge_date ? 'discharged' : 'active',
    bedNumber: row.bed_number,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastEntry: row.last_entry ?? null,
  };
}

function mapEntryRow(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    entryDate: row.entry_date,
    entryTime: row.entry_time,
    assessment: JSON.parse(row.assessment_json),
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    createdByName: row.created_by_name,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default db;
