import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import {
  createEntry,
  createPatient,
  createUser,
  deleteEntry,
  getDashboardStats,
  getEntryById,
  getPatientById,
  getUserByUsername,
  initializeDatabase,
  listEntriesByPatient,
  listPatients,
  listUsers,
  sanitizeUser,
  updateEntry,
  updatePatient,
  updateUser,
} from './db/database.js';
import { appConfig } from './config.js';
import { requireAuth, requireRole, signToken } from './middleware/auth.js';
import { normalizeNumber, requireFields } from './utils/validators.js';

const app = express();
app.use(
  cors({
    origin: appConfig.corsOrigins,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const missing = requireFields(req.body, ['username', 'password']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const user = await getUserByUsername(req.body.username.trim());
  if (!user || user.status !== 'active') {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }

  const isValid = await bcrypt.compare(req.body.password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }

  const safeUser = sanitizeUser(user);
  return res.json({ token: signToken(safeUser), user: safeUser });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/dashboard/stats', requireAuth, async (_req, res) => {
  res.json(await getDashboardStats());
});

app.get('/api/nurses', requireAuth, requireRole('admin'), async (_req, res) => {
  res.json(await listUsers());
});

app.post('/api/nurses', requireAuth, requireRole('admin'), async (req, res) => {
  const missing = requireFields(req.body, ['fullName', 'username', 'password']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const existing = await getUserByUsername(req.body.username.trim());
  if (existing) {
    return res.status(409).json({ message: 'Ce nom utilisateur existe deja' });
  }

  const user = await createUser({
    fullName: req.body.fullName.trim(),
    username: req.body.username.trim(),
    passwordHash: await bcrypt.hash(req.body.password, 10),
    role: req.body.role === 'doctor' ? 'doctor' : 'nurse',
    status: req.body.status === 'inactive' ? 'inactive' : 'active',
  });

  return res.status(201).json(user);
});

app.put('/api/nurses/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const existing = await getUserByUsername(req.body.username.trim());
  if (existing && existing.id !== Number(req.params.id)) {
    return res.status(409).json({ message: 'Ce nom utilisateur existe deja' });
  }

  const updated = await updateUser(Number(req.params.id), {
    fullName: req.body.fullName?.trim(),
    username: req.body.username?.trim(),
    role: req.body.role === 'doctor' ? 'doctor' : 'nurse',
    status: req.body.status,
    passwordHash: req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined,
  });

  if (!updated) {
    return res.status(404).json({ message: 'Infirmier introuvable' });
  }

  return res.json(updated);
});

app.get('/api/patients', requireAuth, async (req, res) => {
  res.json(await listPatients(req.query.search?.toString() ?? '', req.query.status?.toString() ?? 'active'));
});

app.post('/api/patients', requireAuth, requireRole(['admin', 'nurse']), async (req, res) => {
  const missing = requireFields(req.body, ['firstName', 'lastName', 'admissionDate', 'bedNumber']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const patient = await createPatient(
    {
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      age: normalizeNumber(req.body.age),
      weight: normalizeNumber(req.body.weight),
      medicalHistory: req.body.medicalHistory?.trim() ?? '',
      admissionDate: req.body.admissionDate,
      dischargeDate: req.body.dischargeDate || '',
      bedNumber: req.body.bedNumber.trim(),
    },
    req.user.id,
  );

  return res.status(201).json(patient);
});

app.get('/api/patients/:id', requireAuth, async (req, res) => {
  const patient = await getPatientById(Number(req.params.id));
  if (!patient) {
    return res.status(404).json({ message: 'Patient introuvable' });
  }

  return res.json({ patient, entries: await listEntriesByPatient(patient.id) });
});

app.put('/api/patients/:id', requireAuth, requireRole(['admin', 'nurse']), async (req, res) => {
  const missing = requireFields(req.body, ['firstName', 'lastName', 'admissionDate', 'bedNumber']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const patient = await updatePatient(Number(req.params.id), {
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    age: normalizeNumber(req.body.age),
    weight: normalizeNumber(req.body.weight),
    medicalHistory: req.body.medicalHistory?.trim() ?? '',
    admissionDate: req.body.admissionDate,
    dischargeDate: req.body.dischargeDate || '',
    bedNumber: req.body.bedNumber.trim(),
  });

  if (!patient) {
    return res.status(404).json({ message: 'Patient introuvable' });
  }

  return res.json(patient);
});

app.post('/api/patients/:id/entries', requireAuth, requireRole(['admin', 'nurse']), async (req, res) => {
  const patient = await getPatientById(Number(req.params.id));
  if (!patient) {
    return res.status(404).json({ message: 'Patient introuvable' });
  }

  if (patient.status === 'discharged') {
    return res.status(409).json({ message: 'Patient deja sorti' });
  }

  const missing = requireFields(req.body, ['entryDate', 'entryTime', 'assessment']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const entry = await createEntry(patient.id, req.body, req.user.id);
  return res.status(201).json(entry);
});

app.get('/api/entries/:id', requireAuth, async (req, res) => {
  const entry = await getEntryById(Number(req.params.id));
  if (!entry) {
    return res.status(404).json({ message: 'Observation introuvable' });
  }

  return res.json(entry);
});

app.put('/api/entries/:id', requireAuth, requireRole(['admin', 'nurse']), async (req, res) => {
  const missing = requireFields(req.body, ['entryDate', 'entryTime', 'assessment']);
  if (missing) {
    return res.status(400).json({ message: `Missing field: ${missing}` });
  }

  const entry = await updateEntry(Number(req.params.id), req.body, req.user.id);
  if (!entry) {
    return res.status(404).json({ message: 'Observation introuvable' });
  }

  return res.json(entry);
});

app.delete('/api/entries/:id', requireAuth, requireRole(['admin', 'nurse']), async (req, res) => {
  const ok = await deleteEntry(Number(req.params.id));
  if (!ok) {
    return res.status(404).json({ message: 'Observation introuvable' });
  }

  return res.status(204).send();
});

if (fs.existsSync(appConfig.clientDistPath)) {
  app.use(express.static(appConfig.clientDistPath));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(appConfig.clientDistPath, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

async function startServer() {
  await initializeDatabase();

  app.listen(appConfig.port, () => {
    console.log(`API running on http://localhost:${appConfig.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
