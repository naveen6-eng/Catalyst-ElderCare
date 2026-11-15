# CareCircle — Elderly Care & Medication Management Platform
> **Catalyst Hackathon 2026 Submission** | Accessible Senior Care, Salted PIN Access & Google Cloud Run

CareCircle is a full-stack elderly care platform designed to empower senior independence through simple, accessible medication management while providing peace of mind to family caregivers.

---

## 🌟 Live Demo Credentials (Instant Hackathon Evaluation)

| Role | Access URL | Credentials / Code | Description |
| :--- | :--- | :--- | :--- |
| **Senior Kiosk Mode** | `/elder/pin` | **Code**: `CARE-8291`<br>**PIN**: `1234` | Giant touchscreen buttons, Web Speech audio instructions, 1-click dose tracking, and Emergency SOS. |
| **Caregiver Portal** | `/login` | **Email**: `sarah.vance@example.com`<br>**Password**: `password123` | Real-time adherence feed, prescription CRUD, low-supply refill warnings, and doctor appointment tracker. (Includes 1-Click Demo Login button). |

---

## 🚀 Key Functional Capabilities

1. **Elder-First Accessible Interface (`/elder`)**:
   - Oversized tactile buttons ($\ge 72\text{ px}$) meeting WCAG 2.1 AAA accessibility.
   - Integrated browser **Web Speech API** that speaks medication instructions aloud (*"Time to take Metformin 500 mg with breakfast"*).
   - One-tap dose logging (`I TOOK THIS MEDICATION` / `Skip Dose`).
   - One-touch **Emergency SOS Alert** that immediately coordinates the care circle.

2. **Caregiver & Family Oversight (`/dashboard`)**:
   - Live daily adherence percentage and dose completion progress.
   - Comprehensive **Prescription CRUD** (`/dashboard/medications`) supporting multi-time daily scheduling (e.g., `08:00`, `20:00`) and low-supply refill tracking.
   - **Doctor Appointment Scheduler** (`/dashboard/appointments`) for consultations, clinic locations, and question checklists.
   - Care Circle pairing and member management (`CARE-8291`).

3. **Dual-Tier Authentication & Security**:
   - Salted `pbkdf2` / `scrypt` password hashing for family caregivers.
   - Salted `HMAC-SHA256` 4-to-6 digit PIN verification with timing-safe comparison and rate-limiting for seniors.
   - Server-side multi-tenant Care Circle authorization.
   - Strict input validation powered by **Zod**.

4. **Production Architecture**:
   - PostgreSQL schema with Prisma ORM.
   - Stateless container architecture optimized for **Google Cloud Run** (`PORT=8080`).
   - Dedicated health check probe at `/api/health`.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Lucide Icons (Accessible high-contrast elder theme)
- **Database & ORM**: PostgreSQL + Prisma ORM (with self-contained demo store fallback)
- **Testing**: Vitest (13 comprehensive automated unit & workflow tests)
- **Speech**: Native Web Speech Synthesis API
- **Containerization**: Docker (Multi-stage `node:20-alpine`, Next.js standalone)
- **Cloud Platform**: Google Cloud Run

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js `20+` or `24+`
- npm `10+` or `11+`

### 2. Installation
```bash
git clone https://github.com/your-username/Catalyst-ElderCare.git
cd Catalyst-ElderCare
npm install
```

### 3. Environment Secrets Template
```bash
cp .env.example .env
```
*(The repository runs seamlessly out of the box with built-in fictional demo healthcare data. If connecting a live PostgreSQL database, supply `DATABASE_URL` in `.env`)*.

### 4. Run Automated Tests
```bash
npm test
```
All 13 test suites verify security, PIN hashing, session tokens, Zod schemas, medication scheduling, and dose transitions.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the landing page.

---

## ☁️ Google Cloud Run Deployment

Deploy the container directly to Google Cloud Run from source:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy to Cloud Run
gcloud run deploy carecircle \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,NEXTAUTH_SECRET=your_32_byte_secret,DATABASE_URL=your_postgres_connection_string"
```

### Health Check Verification
Once deployed, probe the health check endpoint:
```bash
curl https://carecircle-<hash>-uc.a.run.app/api/health
```
Response:
```json
{
  "status": "ok",
  "service": "CareCircle",
  "version": "1.0.0",
  "database": "connected",
  "uptimeSeconds": 142
}
```

---

## 📂 Project Structure

```
Catalyst-ElderCare/
├── prisma/
│   └── schema.prisma              # PostgreSQL database models
├── src/
│   ├── app/
│   │   ├── api/                   # 15 App Router API endpoints
│   │   │   ├── appointments/      # Consultation CRUD
│   │   │   ├── auth/              # Caregiver registration, login, session
│   │   │   ├── circle/            # Invite code & Senior PIN verification
│   │   │   ├── doses/             # Today's doses & TAKEN/MISSED logging
│   │   │   ├── health/            # Cloud Run health-check probe
│   │   │   └── medications/       # Prescription CRUD & scheduling
│   │   ├── dashboard/             # Caregiver oversight & adherence portal
│   │   ├── elder/                 # Senior Kiosk (large buttons, voice audio)
│   │   ├── login/                 # Caregiver login & 1-click demo entry
│   │   ├── layout.tsx
│   │   └── page.tsx               # Mode selector landing page
│   ├── lib/
│   │   ├── auth.ts                # Cryptographic hashing & session tokens
│   │   ├── data-service.ts        # Unified database & data access layer
│   │   ├── prisma.ts              # Global Prisma client singleton
│   │   ├── speech.ts              # Web Speech API voice synthesis
│   │   ├── store.ts               # In-memory store & demo data
│   │   └── validations.ts         # Zod schemas
│   ├── tests/
│   │   ├── setup.test.ts          # Environment & runner verification
│   │   └── workflows.test.ts      # Security, dose logic & workflow tests
│   └── types/                     # Shared TypeScript interfaces
├── .dockerignore
├── .env.example                   # Documented configuration template
├── .gitignore                     # Strict exclusion ensuring repository < 10 MB
├── Dockerfile                     # Cloud Run standalone container
├── package.json
└── vitest.config.ts
```

---

## 🛡️ Security, Privacy & Integrity

- **Zero Hardcoded Secrets**: Secrets and database credentials are strictly loaded via environment variables.
- **Strict Git Hygiene**: `node_modules`, `.next`, `coverage`, and `.env` are rigorously excluded by `.gitignore`.
- **Fictional Healthcare Data**: Uses synthetic demo patients (*Eleanor Vance*) and standard mock medications to ensure ethical compliance.
- **Repository Size**: Kept strictly below 1 MB of clean source code, well under the 10 MB limit.
