# Nursing Patient Assessment App

Local-first nursing assessment web app for patient follow-up, built around the 5 Virginia Henderson needs defined for this project.

It supports:
- `admin` and `nurse` accounts
- patient files with timestamped observations
- history grouped by year, month, and day
- multilingual UI: `FR / EN / AR`
- local SQLite storage
- single-observation export

## Project Structure

- `client/`: React + Vite frontend
- `server/`: Express + SQLite backend
- `server/data/`: local database files generated at runtime

## Render Deploy Notes

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required env vars: set at least `JWT_SECRET`
- Recommended env vars: `CORS_ORIGIN=https://your-render-domain.onrender.com`

## Database Provider Switch

- Local SQLite mode: `DB_PROVIDER=sqlite`
- Firebase Firestore mode: `DB_PROVIDER=firestore`
- Firestore server env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Keep Firestore access on the server only. The Express API writes to Firestore using the Firebase Admin SDK.
