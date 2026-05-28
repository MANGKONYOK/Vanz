# Vanz - Marketplace Logistics Platform

A high-performance logistics and marketplace management system. Vanz streamlines the connection between customers, stores, and deliverers, managing complex workflows from order placement to final payment and expense reimbursement.

## 🚀 Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS (Modern, Clean, Professional UI)
- **Icons**: Lucide React
- **Animations**: CSS Fade-in transitions

## 🏗️ UI Architecture Standards

The project follows a strict UI consistency pattern to ensure a professional user experience.

### Standard List View Pattern
Every data list (Customers, Orders, Deliverers, etc.) must implement the **Advanced List View** layout:

1.  **PageHeader**: Title, subtitle, and primary CTA (e.g., "Add New").
2.  **Card Header**:
    *   **Left**: Global Search bar (Input with Search icon).
    *   **Right**: Pagination Info (`start-end of total`) and Items per page Selector (`10 / page`).
3.  **Table**:
    *   Professional Slate-based borders and text.
    *   Sorted columns with neutralized (Slate-400) indicators.
    *   Consistent Action column (Edit/Delete buttons).
4.  **Pagination (Bottom Right)**:
    *   Numbered page buttons (`[1] [2] [3]...`).
    *   Chevron navigation for first/last and prev/next.
    *   Strict right-alignment.

### Design Principles
- **Neutral Colors**: Shifted from high-contrast accents (like red sorting icons) to a professional slate/indigo palette.
- **Auto-ID System**: Support for both manual ID entry and auto-generated sequences in forms.
- **Responsive Layout**: Flexbox and Grid based layouts that adapt to screen size.

## 📁 Project Structure

- `client/`: The React-based administrative dashboard.
  - `src/components/ui/`: Core design primitives (Card, Table, Btn, etc.).
  - `src/views/`: Feature-specific modules (Operations, Master, Finance).
  - `src/data/`: Mock data for rapid prototyping.
- `backend/`: (Planned) Node.js API services.

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation & Execution
```bash
cd client
npm install
npm run dev
```

## 📋 Roadmap
- [x] UI Modernization (Unified Header/Pagination)
- [x] Standardized List View Patterns
- [ ] Backend API Integration
- [ ] React Hook Form & Zod Validation
- [ ] Real-time Delivery Tracking
