import { appConfig } from '../config.js';
import * as firestoreProvider from './firestore.js';
import * as sqliteProvider from './sqlite.js';

const provider = appConfig.dbProvider === 'firestore' ? firestoreProvider : sqliteProvider;

export const initializeDatabase = (...args) => provider.initializeDatabase(...args);
export const sanitizeUser = (...args) => provider.sanitizeUser(...args);
export const listUsers = (...args) => provider.listUsers(...args);
export const createUser = (...args) => provider.createUser(...args);
export const updateUser = (...args) => provider.updateUser(...args);
export const getUserById = (...args) => provider.getUserById(...args);
export const getUserByUsername = (...args) => provider.getUserByUsername(...args);
export const listPatients = (...args) => provider.listPatients(...args);
export const createPatient = (...args) => provider.createPatient(...args);
export const updatePatient = (...args) => provider.updatePatient(...args);
export const getPatientById = (...args) => provider.getPatientById(...args);
export const listEntriesByPatient = (...args) => provider.listEntriesByPatient(...args);
export const getEntryById = (...args) => provider.getEntryById(...args);
export const createEntry = (...args) => provider.createEntry(...args);
export const updateEntry = (...args) => provider.updateEntry(...args);
export const deleteEntry = (...args) => provider.deleteEntry(...args);
export const getDashboardStats = (...args) => provider.getDashboardStats(...args);
