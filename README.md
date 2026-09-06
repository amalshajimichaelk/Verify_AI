# 🛡️ VerifyAI

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/Inngest-Background_Jobs-6366F1?style=for-the-badge&logo=inngest&logoColor=white" alt="Inngest">
</p>

<p align="center">
  <i>A production-grade multi-modal media verification platform with forensic evidence under glass, uncertainty calibration, and source provenance.</i>
</p>

---

Welcome to **VerifyAI**, a comprehensive full-stack forensic intelligence and media verification platform engineered to detect deepfakes, synthetic media, and digital manipulations. Built with Next.js 15, React 19, and Google Gemini AI, VerifyAI provides analysts, researchers, and journalists with deep multi-modal verification across images, video, audio, and documents—complete with calibrated confidence scoring, cryptographic hashing, and automated forensic report generation.

---

## ✨ Key Features

* **Multi-Modal Deepfake & Synthetic Detection:**
  * Deep forensic inspection of images, videos, audio, and documents powered by Google Gemini 2.5 Flash multimodal models.
  * Automated detection of GAN artifacts, diffusion inconsistencies, biometric anomalies, and digital tampering.
* **Forensic Evidence Under Glass:**
  * Interactive frame-by-frame scrubber, audio frequency spectrogram visualizer, and EXIF/metadata inspection.
  * Visual anomaly highlighting with detailed forensic explanations and confidence assessments.
* **Uncertainty Calibration & Scoring:**
  * Probabilistic authenticity classification (*Authentic*, *Likely AI-Generated*, *Manipulated*, *Inconclusive*).
  * Calibrated confidence scores with explicit uncertainty estimates to eliminate false certainties.
* **Source Provenance & Integrity Checking:**
  * Reverse image search intelligence and hash-based integrity verification (SHA-256, Perceptual hashing).
  * C2PA Content Credentials validation to verify cryptographic digital signatures and edit history.
* **Collaborative Investigation Boards:**
  * Organize media items into investigative case files, pin critical evidence, add analyst notes, and track statuses.
* **Audit-Ready Forensic Reporting:**
  * One-click generation of exportable verification dossiers and forensic investigation reports with cryptographic checksums.
* **Zero-Config Sandbox Mode:**
  * Built-in mock mode (`DEMO_MODE=true`) allows full exploration of all forensic workflows offline without external API dependencies.
* **Enterprise Security & Rate Limiting:**
  * NextAuth v5 session management, Upstash Redis edge rate limiting, and Vercel Blob secure media storage.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Full-Stack Framework** | Next.js 15 (App Router & Server Actions) |
| **Frontend UI & Library** | React 19, Lucide Icons, Motion (Framer Motion) |
| **Styling & Design System** | Tailwind CSS v4 |
| **AI & Multimodal Reasoning** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Database & ORM** | Neon PostgreSQL (Serverless) & Drizzle ORM |
| **Async Job Queue** | Inngest Background Workflows |
| **Media & File Storage** | Vercel Blob Storage |
| **Authentication** | Auth.js / NextAuth v5 |
| **Rate Limiting & Caching** | Upstash Redis |
| **Testing & Quality** | Vitest (Unit & Integration) & TypeScript 5.8 |

---

## 🏛️ Architecture

This project is structured as a **Monolithic Full-Stack Next.js 15 Application**, combining a rich client-side forensic console with serverless API routes, background job queues, and type-safe database access within a unified codebase.

* **Frontend (`src/` & `app/`):** A responsive Single Page Application (SPA) built with React 19 and Tailwind CSS v4. Provides real-time analysis consoles, interactive spectrogram visualizers, and case investigation boards.
* **API Layer (`app/api/`):** Next.js App Router endpoints handling secure media upload tokens, async verification triggers, job status polling, investigation management, and PDF report generation.
* **Analysis Pipeline (`lib/analysis/` & `lib/jobs/`):** Multi-stage asynchronous forensic pipeline powered by Inngest workflows and Google Gemini AI for metadata parsing, tampering heuristics, and multimodal inference.
* **Database Layer (`lib/db/`):** Drizzle ORM with Neon PostgreSQL providing type-safe models for media assets, forensic jobs, findings, case files, and audit logs.

This unified architecture enables seamless local development with zero friction while remaining ready for instant deployment on Vercel.

---

## 🗄️ Database Setup

VerifyAI uses **Neon PostgreSQL** (or any standard PostgreSQL instance) paired with **Drizzle ORM** for schema migrations and type-safe queries.

1. Create a free PostgreSQL database on [Neon](https://neon.tech) (or start a local Postgres instance).
2. Copy your PostgreSQL connection string (URI).
3. Create a `.env.local` file in the project root and add your database URL:
   ```env
   DATABASE_URL="postgres://[user]:[password]@[host]/[dbname]?sslmode=require"
   ```
4. Run Drizzle commands to manage your database schema:
   ```bash
   # Generate schema migration files
   npm run db:generate

   # Apply migrations to your database
   npm run db:migrate

   # (Optional) Open Drizzle Studio to inspect your data
   npm run db:studio
   ```

> **Note:** If `DEMO_MODE=true` is set in your `.env.local`, VerifyAI operates completely in memory with simulated data—no database setup required!

---

## 🚀 How to Run

### Prerequisites

1. **Node.js:** Ensure you have Node.js (v18+ or v20+) installed.
2. **Database:** A running PostgreSQL instance or Neon URI (optional if running in Demo Mode).
3. **API Keys:** A Google Gemini API key if you wish to enable live AI forensic analysis (`ENABLE_REAL_ANALYSIS=true`).

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amalshajimichaelk/Verify_AI.git
   cd Verify_AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   * Open `.env.local` and configure your settings:
     ```env
     # Enable mock mode for instant offline exploration
     DEMO_MODE=true

     # Or configure real services:
     ENABLE_REAL_ANALYSIS=true
     GEMINI_API_KEY="your_gemini_api_key_here"
     AUTH_SECRET="your_auth_secret_here"
     DATABASE_URL="postgres://..."
     BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
     INNGEST_EVENT_KEY="your_inngest_key"
     ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   * The app will now be running at `http://localhost:3000`.

### Running Tests

Execute unit and integration test suites:
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Production Build

To build and run the optimized production version:
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
Verify_AI/
├── .env.example          # Environment variable template
├── package.json          # Dependencies, scripts, and package metadata
├── next.config.mjs       # Next.js configuration
├── drizzle.config.ts     # Drizzle ORM configuration
├── middleware.ts         # Edge authentication & routing middleware
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # REST API endpoints (analyze, inngest, media, reports)
│   ├── layout.tsx        # Root HTML layout and provider shell
│   └── page.tsx          # Main application page entry point
├── lib/                  # Core backend services & business logic
│   ├── analysis/         # Forensic inspection & AI pipeline
│   ├── auth/             # Auth.js / NextAuth configuration
│   ├── db/               # Drizzle database client & schemas
│   ├── jobs/             # Inngest async job workflows
│   ├── security/         # Cryptographic hashing & rate limiting
│   └── storage/          # Vercel Blob media storage helpers
├── src/                  # Client-side React components & views
│   ├── components/       # Reusable UI components & modals
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Client-side API service clients
│   ├── types/            # TypeScript domain interfaces
│   └── views/            # Main application views & consoles
└── tests/                # Unit and integration test suites
```

---
