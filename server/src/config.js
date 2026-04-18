import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseOrigins(value) {
  if (!value) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePrivateKey(value) {
  if (!value) {
    return '';
  }

  return value.replace(/\\n/g, '\n');
}

export const appConfig = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-before-real-deploy',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  dbProvider: process.env.DB_PROVIDER || 'sqlite',
  dbPath:
    process.env.DB_PATH ||
    path.resolve(__dirname, '../data/nursing-app.db'),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || '',
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME || 'admin',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  seedAdminName: process.env.SEED_ADMIN_NAME || 'Administrateur principal',
  seedNurseUsername: process.env.SEED_NURSE_USERNAME || 'nurse.demo',
  seedNursePassword: process.env.SEED_NURSE_PASSWORD || 'nurse123',
  seedNurseName: process.env.SEED_NURSE_NAME || 'Infirmier demo',
  clientDistPath: path.resolve(__dirname, '../../client/dist'),
};
