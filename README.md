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

## Before You Push To GitHub

This repo is prepared so you can publish the source code without pushing machine-specific or sensitive files.

Ignored already:
- `node_modules`
- SQLite database files
- `.env` files
- build output

Commit:
- source code
- `.env.example` files
- `README.md`

Do not commit:
- `server/data/*.db`
- `.env`
- `node_modules`
- `client/dist`

## Installation

From the project root:

```powershell
npm run install:all
```

If you prefer separate installs:

```powershell
npm install
npm install --prefix client
npm install --prefix server
```

## Development Mode

Run frontend and backend together:

```powershell
npm run dev
```

This starts:
- frontend on `http://localhost:5173`
- backend on `http://localhost:4000`

## Demo Accounts

On first startup, the app seeds one admin and one nurse if they do not already exist in the database:

- admin
  - username: `admin`
  - password: `admin123`
- nurse
  - username: `nurse.demo`
  - password: `nurse123`

These defaults can be changed with server environment variables before the first run.

## Production-Like Local Run

For a simpler "single app" run on another machine:

1. Build the frontend:

```powershell
npm run build
```

2. Start the backend:

```powershell
npm run start
```

If `client/dist` exists, the Express server will also serve the frontend build. In that mode you can open:

```text
http://localhost:4000
```

This is useful for:
- testing on another computer
- temporary online test deployment
- future hospital-local deployment on one machine or one internal server

## Environment Variables

### Server

Copy `server/.env.example` to `server/.env` and adjust if needed.

Available variables:
- `PORT`: backend port, default `4000`
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: comma-separated allowed frontend origins
- `DB_PATH`: custom SQLite file path
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`
- `SEED_NURSE_USERNAME`
- `SEED_NURSE_PASSWORD`
- `SEED_NURSE_NAME`

### Client

Copy `client/.env.example` to `client/.env` if needed.

Available variables:
- `VITE_API_BASE_URL`: use this when frontend and backend are hosted separately
- `VITE_DEV_API_PROXY`: dev proxy target for Vite, default `http://localhost:4000`

## Deployment Notes

### Local hospital deployment later

Best fit:
- run the backend on one local machine or hospital server
- keep SQLite local or on that internal machine
- build the frontend and let Express serve it
- access it through the local network only

### Temporary online test deployment now

You have two practical options:

1. Serve frontend and backend from the same server
- easiest option
- build the frontend
- run only the backend server

2. Host frontend and backend separately
- set `VITE_API_BASE_URL` in the client
- set `CORS_ORIGIN` in the server

## Notes About Seed Users

Seed users are created only when the database starts empty:
- the admin is only seeded if there is no admin yet
- the demo nurse is only seeded if that username does not already exist

If you already ran the app once, changing the seed values later will not replace existing accounts in the database.

## Useful Commands

```powershell
npm run dev
npm run build
npm run start
```

## Recommended Next Step

Before sharing the repo publicly, create your own real `.env` files and change at least:
- `JWT_SECRET`
- seeded passwords

That keeps your GitHub version clean while still making the project easy to run anywhere later.
