# CUBIQ Attendance Management System

A lightweight, production-ready, mobile-responsive attendance management web application for **CUBIQ Interior & Modular** with **Dual SQL & Google Sheets Database Architecture**, built with **Next.js 14**, **Leaflet + OpenStreetMap**, and **GPS Geofencing**.

![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Neon%20%7C%20Google%20Sheets-blue?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Hosting-Vercel%201--Click-black?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt-purple?style=for-the-badge)

---

## 🌟 Database Storage Options

CUBIQ Attendance includes a multi-driver database architecture that works anywhere with zero friction:

1. **SQL Database (PostgreSQL / Neon / Vercel Postgres)**:
   - Recommended for production and Vercel hosting.
   - Automatically connects when `POSTGRES_URL` or `DATABASE_URL` is set.
   - **Auto-creates relational tables** (`users`, `locations`, `employees`, `attendance`, `supervisor_attendance`) and runs auto-seeding.
2. **Immediate Local Persistent Storage (`data/cubic_database.json`)**:
   - Zero setup for local development and testing.
   - Every single check-in, check-out, user registration, location creation, or employee edit is **immediately saved to disk**.
   - Data persists across server restarts and terminal reboots.
3. **Google Sheets as Database**:
   - Persists rows directly to 5 Google Sheets tabs via Google Sheets API v4.

---

## 🚀 Easy Hosting on Vercel (1-Click SQL Database)

Hosting on Vercel with a production SQL database takes under 2 minutes:

1. Push this project to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New > Project**, then import this repository.
3. In your Vercel project dashboard:
   - Click the **Storage** tab at the top.
   - Select **Postgres** (or Neon / Supabase).
   - Click **Create & Connect to Project**.
   - Vercel will automatically inject `POSTGRES_URL` into your environment variables!
4. Add `JWT_SECRET="any-secure-random-key"` to your Environment Variables.
5. Click **Deploy**.
6. When the application boots on Vercel, it automatically creates all SQL tables and seeds the default admin account.

---

## 🏃‍♂️ Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the app**:
   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

3. Open **[http://localhost:3000](http://localhost:3000)**.

### Default Admin Credentials:
- **Admin**: `admin` (or `mdafnan` / `Afnan@Cubiq.com`) / `Afnan@Cubiq.com`
- **Supervisor (Salman)**: `supervisor` / `sup12345`

---

## 📐 GPS Geofencing Validation

Before any employee or supervisor can mark attendance:
1. Browser Geolocation captures exact `(latitude, longitude)`.
2. Haversine distance is calculated between user coordinates and assigned site center:
   $$\text{distance} = 2 R \arcsin\left(\sqrt{\sin^2(\Delta\text{lat}/2) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2(\Delta\text{lon}/2)}\right)$$
3. If distance $\le$ site allowed radius (e.g. 100m): check-in is recorded.
4. If distance $>$ site allowed radius: blocked with: *"You are not within your assigned work location. Distance is Xm (Allowed radius: Ym)."*

---

## 🗄️ SQL Tables Schema

### `users`
`user_id VARCHAR PK, name VARCHAR, role VARCHAR, username VARCHAR UNIQUE, password_hash TEXT, status VARCHAR, created_at TIMESTAMP`

### `locations`
`location_id VARCHAR PK, location_name VARCHAR, address TEXT, latitude DOUBLE, longitude DOUBLE, radius DOUBLE, supervisor_id VARCHAR, status VARCHAR`

### `employees`
`employee_id VARCHAR PK, name VARCHAR, phone VARCHAR, designation VARCHAR, location_id VARCHAR, status VARCHAR, created_at TIMESTAMP`

### `attendance`
`attendance_id VARCHAR PK, employee_id VARCHAR, name VARCHAR, date VARCHAR, check_in VARCHAR, check_out VARCHAR, latitude DOUBLE, longitude DOUBLE, status VARCHAR, location_name VARCHAR`

### `supervisor_attendance`
`attendance_id VARCHAR PK, supervisor_id VARCHAR, name VARCHAR, date VARCHAR, check_in VARCHAR, check_out VARCHAR, latitude DOUBLE, longitude DOUBLE, location_name VARCHAR`
