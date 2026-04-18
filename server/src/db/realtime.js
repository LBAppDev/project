import bcrypt from 'bcryptjs';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { appConfig } from '../config.js';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  if (appConfig.firebaseProjectId && appConfig.firebaseClientEmail && appConfig.firebasePrivateKey) {
    return initializeApp({
      credential: cert({
        projectId: appConfig.firebaseProjectId,
        clientEmail: appConfig.firebaseClientEmail,
        privateKey: appConfig.firebasePrivateKey,
      }),
      databaseURL: appConfig.firebaseDatabaseUrl,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      databaseURL: appConfig.firebaseDatabaseUrl,
    });
  }

  throw new Error(
    'Realtime Database provider requires either GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
  );
}

let realtimeDb;

function getDb() {
  if (!realtimeDb) {
    realtimeDb = getDatabase(getFirebaseApp());
  }

  return realtimeDb;
}

function usersRef() {
  return getDb().ref('users');
}

function patientsRef() {
  return getDb().ref('patients');
}

function entriesRef() {
  return getDb().ref('entries');
}

function countersRef() {
  return getDb().ref('_meta/counters');
}

function userFromSnapshot(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return null;
  }

  return { ...value, id: Number(snapshot.key) };
}

function patientFromSnapshot(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return null;
  }

  return { ...value, id: Number(snapshot.key) };
}

function entryFromSnapshot(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return null;
  }

  return { ...value, id: Number(snapshot.key) };
}

async function nextId(counterName) {
  const ref = countersRef().child(counterName);
  const result = await ref.transaction((current) => Number(current ?? 0) + 1);
  return Number(result.snapshot.val());
}

function compareEntriesDesc(a, b) {
  return `${b.entry_date} ${b.entry_time}`.localeCompare(`${a.entry_date} ${a.entry_time}`);
}

function mapPatientRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age ?? null,
    weight: row.weight ?? null,
    medicalHistory: row.medical_history ?? '',
    admissionDate: row.admission_date,
    bedNumber: row.bed_number,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastEntry: row.last_entry ?? null,
  };
}

function sanitizeUser(user) {
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

async function getAllUsersRaw() {
  const snapshot = await usersRef().get();
  if (!snapshot.exists()) {
    return [];
  }

  return Object.entries(snapshot.val()).map(([id, value]) => ({
    ...value,
    id: Number(id),
  }));
}

async function getAllPatientsRaw() {
  const snapshot = await patientsRef().get();
  if (!snapshot.exists()) {
    return [];
  }

  return Object.entries(snapshot.val()).map(([id, value]) => ({
    ...value,
    id: Number(id),
  }));
}

async function getAllEntriesRaw() {
  const snapshot = await entriesRef().get();
  if (!snapshot.exists()) {
    return [];
  }

  return Object.entries(snapshot.val()).map(([id, value]) => ({
    ...value,
    id: Number(id),
  }));
}

async function hydrateEntry(row) {
  const [createdBy, updatedBy] = await Promise.all([
    getUserById(row.created_by_user_id),
    getUserById(row.updated_by_user_id),
  ]);

  return {
    id: row.id,
    patientId: row.patient_id,
    entryDate: row.entry_date,
    entryTime: row.entry_time,
    assessment: JSON.parse(row.assessment_json),
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    createdByName: createdBy?.fullName ?? '',
    updatedByName: updatedBy?.fullName ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function setPatientLastEntry(patientId) {
  const entries = (await getAllEntriesRaw())
    .filter((entry) => entry.patient_id === patientId)
    .sort(compareEntriesDesc);
  const latest = entries[0];

  await patientsRef().child(String(patientId)).update({
    last_entry: latest ? `${latest.entry_date} ${latest.entry_time}` : null,
    updated_at: now(),
  });
}

export async function initializeDatabase() {
  if (!appConfig.firebaseDatabaseUrl) {
    throw new Error('Realtime Database provider requires FIREBASE_DATABASE_URL.');
  }

  await seedDefaults();
}

async function seedDefaults() {
  const users = await getAllUsersRaw();
  const adminExists = users.some((user) => user.role === 'admin');
  const nurseExists = users.some((user) => user.username === appConfig.seedNurseUsername);

  if (!adminExists) {
    const timestamp = now();
    const id = await nextId('users');

    await usersRef().child(String(id)).set({
      id,
      full_name: appConfig.seedAdminName,
      username: appConfig.seedAdminUsername,
      password_hash: bcrypt.hashSync(appConfig.seedAdminPassword, 10),
      role: 'admin',
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  if (!nurseExists) {
    const timestamp = now();
    const id = await nextId('users');

    await usersRef().child(String(id)).set({
      id,
      full_name: appConfig.seedNurseName,
      username: appConfig.seedNurseUsername,
      password_hash: bcrypt.hashSync(appConfig.seedNursePassword, 10),
      role: 'nurse',
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
}

export { sanitizeUser };

export async function listUsers() {
  const users = await getAllUsersRaw();

  return users
    .filter((user) => user.role === 'nurse')
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }))
    .map(sanitizeUser);
}

export async function createUser({ fullName, username, passwordHash, role = 'nurse', status = 'active' }) {
  const timestamp = now();
  const id = await nextId('users');

  await usersRef().child(String(id)).set({
    id,
    full_name: fullName,
    username,
    password_hash: passwordHash,
    role,
    status,
    created_at: timestamp,
    updated_at: timestamp,
  });

  return getUserById(id);
}

export async function updateUser(id, { fullName, username, status, passwordHash }) {
  const current = await getUserByIdRaw(id);
  if (!current) {
    return null;
  }

  await usersRef().child(String(id)).update({
    full_name: fullName ?? current.full_name,
    username: username ?? current.username,
    status: status ?? current.status,
    password_hash: passwordHash ?? current.password_hash,
    updated_at: now(),
  });

  return getUserById(id);
}

async function getUserByIdRaw(id) {
  const snapshot = await usersRef().child(String(id)).get();
  return userFromSnapshot(snapshot);
}

export async function getUserById(id) {
  const user = await getUserByIdRaw(id);
  return sanitizeUser(user);
}

export async function getUserByUsername(username) {
  const users = await getAllUsersRaw();
  return users.find((user) => user.username === username) ?? null;
}

export async function listPatients(search = '') {
  const patients = await getAllPatientsRaw();
  const query = search.trim().toLowerCase();

  return patients
    .filter((patient) => {
      if (!query) {
        return true;
      }

      return [patient.first_name, patient.last_name, patient.bed_number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(mapPatientRow);
}

export async function createPatient(input, userId) {
  const timestamp = now();
  const id = await nextId('patients');

  await patientsRef().child(String(id)).set({
    id,
    first_name: input.firstName,
    last_name: input.lastName,
    age: input.age ?? null,
    weight: input.weight ?? null,
    medical_history: input.medicalHistory || null,
    admission_date: input.admissionDate,
    bed_number: input.bedNumber,
    created_by_user_id: userId,
    created_at: timestamp,
    updated_at: timestamp,
    last_entry: null,
  });

  return getPatientById(id);
}

export async function updatePatient(id, input) {
  const current = await getPatientByIdRaw(id);
  if (!current) {
    return null;
  }

  await patientsRef().child(String(id)).update({
    first_name: input.firstName,
    last_name: input.lastName,
    age: input.age ?? null,
    weight: input.weight ?? null,
    medical_history: input.medicalHistory || null,
    admission_date: input.admissionDate,
    bed_number: input.bedNumber,
    updated_at: now(),
  });

  return getPatientById(id);
}

async function getPatientByIdRaw(id) {
  const snapshot = await patientsRef().child(String(id)).get();
  return patientFromSnapshot(snapshot);
}

export async function getPatientById(id) {
  const row = await getPatientByIdRaw(id);
  return row ? mapPatientRow(row) : null;
}

export async function listEntriesByPatient(patientId) {
  const entries = (await getAllEntriesRaw())
    .filter((entry) => entry.patient_id === patientId)
    .sort(compareEntriesDesc);

  return Promise.all(entries.map(hydrateEntry));
}

export async function getEntryById(id) {
  const snapshot = await entriesRef().child(String(id)).get();
  const row = entryFromSnapshot(snapshot);
  return row ? hydrateEntry(row) : null;
}

export async function createEntry(patientId, input, userId) {
  const timestamp = now();
  const id = await nextId('entries');

  await entriesRef().child(String(id)).set({
    id,
    patient_id: patientId,
    entry_date: input.entryDate,
    entry_time: input.entryTime,
    assessment_json: JSON.stringify(input.assessment),
    created_by_user_id: userId,
    updated_by_user_id: userId,
    created_at: timestamp,
    updated_at: timestamp,
  });

  await setPatientLastEntry(patientId);
  return getEntryById(id);
}

export async function updateEntry(id, input, userId) {
  const current = await getEntryByIdRaw(id);
  if (!current) {
    return null;
  }

  await entriesRef().child(String(id)).update({
    entry_date: input.entryDate,
    entry_time: input.entryTime,
    assessment_json: JSON.stringify(input.assessment),
    updated_by_user_id: userId,
    updated_at: now(),
  });

  await setPatientLastEntry(current.patient_id);
  return getEntryById(id);
}

async function getEntryByIdRaw(id) {
  const snapshot = await entriesRef().child(String(id)).get();
  return entryFromSnapshot(snapshot);
}

export async function deleteEntry(id) {
  const current = await getEntryByIdRaw(id);
  if (!current) {
    return false;
  }

  await entriesRef().child(String(id)).remove();
  await setPatientLastEntry(current.patient_id);
  return true;
}

export async function getDashboardStats() {
  const [users, patients, entries] = await Promise.all([
    getAllUsersRaw(),
    getAllPatientsRaw(),
    getAllEntriesRaw(),
  ]);

  const recentEntries = await Promise.all(
    entries
      .sort(compareEntriesDesc)
      .slice(0, 5)
      .map(async (entry) => {
        const [patient, user] = await Promise.all([
          getPatientById(entry.patient_id),
          getUserById(entry.created_by_user_id),
        ]);

        return {
          id: entry.id,
          entryDate: entry.entry_date,
          entryTime: entry.entry_time,
          patientName: patient ? `${patient.lastName} ${patient.firstName}` : '',
          nurseName: user?.fullName ?? '',
        };
      }),
  );

  const recentPatients = patients
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      bedNumber: row.bed_number,
      updatedAt: row.updated_at,
    }));

  return {
    nurses: users.filter((user) => user.role === 'nurse').length,
    patients: patients.length,
    entriesToday: entries.filter((entry) => entry.entry_date === today()).length,
    recentEntries,
    recentPatients,
  };
}
