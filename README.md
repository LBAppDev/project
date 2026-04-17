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
