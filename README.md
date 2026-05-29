# Vanz - Marketplace Logistics Platform

A high-performance logistics and marketplace management system. Vanz streamlines the connection between customers, stores, and deliverers, managing complex workflows from order placement to final payment and expense reimbursement.

## 🚀 Technology Stack

**Frontend**
- **Core**: React 19 with Vite (utilizing the new React Compiler for performance optimization)
- **Routing**: React Router v6
- **Forms & Validation**: React Hook Form with Zod (strict client-side validation)
- **Styling**: Tailwind CSS v4 (Modern, Clean, Professional UI)
- **Icons**: Lucide React
- **Notifications**: React Toastify

**Backend**
- **Core**: Node.js & Express.js
- **Database**: PostgreSQL (hosted via Supabase) mapped via `pg` (node-postgres)
- **Validation**: Zod (strict server-side schema validation)
- **Logging**: Winston (Console, Error, and Combined file transports)
- **Security**: JWT-based Authentication (jsonwebtoken) & CORS

## 🏗️ Architecture Standards

The project follows strict UI consistency patterns and robust server-side data validations to ensure a professional user experience.

### Client-Side Features
1. **Advanced List Views**: Unified headers, global search, pagination (start-end of total), and strictly formatted data tables.
2. **Form Management**: All forms utilize `useForm` natively, integrating custom components (LoV Modals, Selects, Toggles) via `Controller`. Validation errors are elegantly displayed in-line.
3. **Design Principles**: Neutral Slate/Indigo palettes, auto-ID systems, and responsive grid layouts.

### Server-Side Features
1. **Service Layer Validation**: 100% of incoming data payloads across all 15 API resources are strictly validated using `schemas.safeParse()` before any business logic is executed.
2. **Centralized Error Handling**: Unified `ValidationError` and `NotFoundError` wrappers provide consistent API responses.
3. **Structured Logging**: Application state is tracked efficiently with Winston's structured file transports.

## 📁 Project Structure

- `client/`: The React-based administrative dashboard.
  - `src/api/`: HTTP client interceptors (`axios`).
  - `src/components/ui/`: Core design primitives (Card, Table, FormField, LovModal).
  - `src/schemas/`: Zod validation definitions (Master, Operations, Finance).
  - `src/views/`: Feature-specific modules.
- `server/`: The Express.js REST API.
  - `src/controllers/`: Route handlers.
  - `src/services/`: Core business logic and DB transactions.
  - `src/schemas/`: Server-side Zod definitions for all 15 resources.
  - `src/utils/`: Middleware for Authentication, Errors, and Logging.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (Supabase recommended)

### 1. Server Setup
```bash
cd server
npm install

# Copy the environment template and fill in your Supabase DB URL and JWT Secret
cp .env.example .env

# Run the development server
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install

# Run the Vite development server
npm run dev
```

## 📋 Roadmap
- [x] UI Modernization (Unified Header/Pagination)
- [x] Standardized List View Patterns
- [x] Backend API Database Integration (PostgreSQL)
- [x] React Hook Form & Zod Validation (Full Stack)
- [x] Structured Winston Logging 
- [ ] Connect Frontend Dropdowns to Live APIs (Remove Mock Data)
- [ ] Implement Real Authentication Flow (Login Page)
- [ ] Real-time Delivery Tracking
