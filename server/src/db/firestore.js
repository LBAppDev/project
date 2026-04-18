import bcrypt from 'bcryptjs';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }

  throw new Error(
    'Firestore provider requires either GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
  );
}

let firestoreDb;

function getDb() {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseApp());
  }

  return firestoreDb;
}

function usersCollection() {
  return getDb().collection('users');
}

function patientsCollection() {
  return getDb().collection('patients');
}

function entriesCollection() {
  return getDb().collection('entries');
}

function countersRef() {
  return getDb().collection('_meta').doc('counters');
}

function userFromDoc(snapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return { ...snapshot.data(), id: Number(snapshot.id) };
}

function patientFromDoc(snapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return { ...snapshot.data(), id: Number(snapshot.id) };
}

function entryFromDoc(snapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return { ...snapshot.data(), id: Number(snapshot.id) };
}

async function nextId(counterName) {
  return getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(countersRef());
    const counters = snapshot.exists ? snapshot.data() : {};
    const nextValue = Number(counters[counterName] ?? 0) + 1;

    transaction.set(countersRef(), { [counterName]: nextValue }, { merge: true });
    return nextValue;
  });
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
  const patientRef = patientsCollection().doc(String(patientId));
  const entriesSnapshot = await entriesCollection().where('patient_id', '==', patientId).get();
  const entries = entriesSnapshot.docs.map(entryFromDoc).filter(Boolean).sort(compareEntriesDesc);
  const latest = entries[0];

  await patientRef.set(
    {
      last_entry: latest ? `${latest.entry_date} ${latest.entry_time}` : null,
      updated_at: now(),
    },
    { merge: true },
  );
}

export async function initializeDatabase() {
  await seedDefaults();
}

async function seedDefaults() {
  const [adminsSnapshot, nurseSnapshot] = await Promise.all([
    usersCollection().where('role', '==', 'admin').limit(1).get(),
    usersCollection().where('username', '==', appConfig.seedNurseUsername).limit(1).get(),
  ]);

  if (adminsSnapshot.empty) {
    const timestamp = now();
    const id = await nextId('users');

    await usersCollection().doc(String(id)).set({
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

  if (nurseSnapshot.empty) {
    const timestamp = now();
    const id = await nextId('users');

    await usersCollection().doc(String(id)).set({
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
  const snapshot = await usersCollection().where('role', '==', 'nurse').get();

  return snapshot.docs
    .map(userFromDoc)
    .filter(Boolean)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }))
    .map(sanitizeUser);
}

export async function createUser({ fullName, username, passwordHash, role = 'nurse', status = 'active' }) {
  const timestamp = now();
  const id = await nextId('users');

  await usersCollection().doc(String(id)).set({
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
  const current = await getUserByUsernameIdRaw(id);
  if (!current) {
    return null;
  }

  await usersCollection().doc(String(id)).set(
    {
      full_name: fullName ?? current.full_name,
      username: username ?? current.username,
      status: status ?? current.status,
      password_hash: passwordHash ?? current.password_hash,
      updated_at: now(),
    },
    { merge: true },
  );

  return getUserById(id);
}

async function getUserByUsernameIdRaw(id) {
  const snapshot = await usersCollection().doc(String(id)).get();
  return userFromDoc(snapshot);
}

export async function getUserById(id) {
  const user = await getUserByUsernameIdRaw(id);
  return sanitizeUser(user);
}

export async function getUserByUsername(username) {
  const snapshot = await usersCollection().where('username', '==', username).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return userFromDoc(snapshot.docs[0]);
}

export async function listPatients(search = '') {
  const snapshot = await patientsCollection().get();
  const query = search.trim().toLowerCase();

  return snapshot.docs
    .map(patientFromDoc)
    .filter(Boolean)
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

  await patientsCollection().doc(String(id)).set({
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
  const current = await patientsCollection().doc(String(id)).get();
  if (!current.exists) {
    return null;
  }

  const existing = current.data();

  await patientsCollection().doc(String(id)).set(
    {
      first_name: input.firstName,
      last_name: input.lastName,
      age: input.age ?? null,
      weight: input.weight ?? null,
      medical_history: input.medicalHistory || null,
      admission_date: input.admissionDate,
      bed_number: input.bedNumber,
      updated_at: now(),
      last_entry: existing.last_entry ?? null,
    },
    { merge: true },
  );

  return getPatientById(id);
}

export async function getPatientById(id) {
  const snapshot = await patientsCollection().doc(String(id)).get();
  const row = patientFromDoc(snapshot);
  return row ? mapPatientRow(row) : null;
}

export async function listEntriesByPatient(patientId) {
  const snapshot = await entriesCollection().where('patient_id', '==', patientId).get();
  const rows = snapshot.docs.map(entryFromDoc).filter(Boolean).sort(compareEntriesDesc);
  return Promise.all(rows.map(hydrateEntry));
}

export async function getEntryById(id) {
  const snapshot = await entriesCollection().doc(String(id)).get();
  const row = entryFromDoc(snapshot);
  return row ? hydrateEntry(row) : null;
}

export async function createEntry(patientId, input, userId) {
  const timestamp = now();
  const id = await nextId('entries');

  await entriesCollection().doc(String(id)).set({
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
  const current = await entriesCollection().doc(String(id)).get();
  if (!current.exists) {
    return null;
  }

  const currentData = current.data();

  await entriesCollection().doc(String(id)).set(
    {
      entry_date: input.entryDate,
      entry_time: input.entryTime,
      assessment_json: JSON.stringify(input.assessment),
      updated_by_user_id: userId,
      updated_at: now(),
    },
    { merge: true },
  );

  await setPatientLastEntry(currentData.patient_id);
  return getEntryById(id);
}

export async function deleteEntry(id) {
  const current = await entriesCollection().doc(String(id)).get();
  if (!current.exists) {
    return false;
  }

  const currentData = current.data();
  await entriesCollection().doc(String(id)).delete();
  await setPatientLastEntry(currentData.patient_id);
  return true;
}

export async function getDashboardStats() {
  const [usersSnapshot, patientsSnapshot, entriesSnapshot] = await Promise.all([
    usersCollection().where('role', '==', 'nurse').get(),
    patientsCollection().get(),
    entriesCollection().get(),
  ]);

  const entries = entriesSnapshot.docs.map(entryFromDoc).filter(Boolean).sort(compareEntriesDesc);
  const recentEntries = await Promise.all(
    entries.slice(0, 5).map(async (entry) => {
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

  const recentPatients = patientsSnapshot.docs
    .map(patientFromDoc)
    .filter(Boolean)
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
    nurses: usersSnapshot.size,
    patients: patientsSnapshot.size,
    entriesToday: entries.filter((entry) => entry.entry_date === today()).length,
    recentEntries,
    recentPatients,
  };
}
