# Project Management

A modern project management application built with Next.js, TypeScript, Tailwind CSS, and Better Auth.

## Features

- 🔐 Email/password authentication
- 🔑 Google OAuth login
- 📊 Dashboard for project management
- 🎨 Modern UI with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd project-management
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Fill in your `.env` file with:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `BETTER_AUTH_URL` - Your app URL (http://localhost:3000 for dev)
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

5. Set up the database:
```bash
pnpm drizzle-kit push
```

6. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env` file

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (base-ui)
- **Authentication:** Better Auth
- **Database:** PostgreSQL with Drizzle ORM
- **Database Hosting:** Neon

## License

MIT
