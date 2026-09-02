# 🎓 Jadoon Public School & College Management Portal

> **A modern, bespoke institutional management and student information portal built for Jadoon Public High School & College.**

---

## 📌 Project Overview
**Jadoon CMS Portal** is a comprehensive educational administration system engineered to streamline day-to-day school operations. From real-time daily attendance recording to dynamic student directory indexing, fee challan generation, and financial analytics, this platform unifies faculty tasks into a modern, accessible web application.

---

## ✨ Key Features
- **📊 Executive Administrative Dashboard:** Real-time KPI summaries including total active enrollments, daily attendance rates, and month-to-date fee collections.
- **📋 Swipe & Go Attendance System:** Rapid attendance marking interface with live percentage recalculations and absent alert flagging.
- **💳 Automated Fee Challan Generator:** Generate, preview, and track student tuition fee challans with status indicators (Paid, Pending, Overdue).
- **🧑‍🎓 Student Records Directory:** Searchable, filterable student database with detailed personal, guardian, and academic history profiles.
- **📈 Academic Analytics & Visual Reports:** Data visualizations powered by Recharts for institutional performance metrics.
- **⚡ Drag-and-Drop Workspace Customization:** Powered by `@dnd-kit` for intuitive reordering of dashboard panels and widgets.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, TypeScript
- **State Management & Data Fetching:** Zustand, TanStack React Query (`@tanstack/react-query`)
- **Forms & Validation:** React Hook Form, Zod (`@hookform/resolvers`)
- **Styling & UI Components:** Tailwind CSS, Radix UI primitives, Lucide React, clsx, tailwind-merge
- **Data Visualization & DnD:** Recharts, `@dnd-kit/core`, `@dnd-kit/sortable`
- **Backend & Integration:** Express.js, Google GenAI SDK (`@google/genai`)

---

## 📂 Project Structure
```text
src/
├── components/
│   └── ui/                          # Reusable UI component library (Button, Dialog, Card, Badge)
├── lib/
│   └── utils.ts                     # Utility helpers & class merger
├── store/
│   └── useStore.ts                  # Central Zustand state store (students, attendance, fees)
├── views/
│   ├── Dashboard.tsx                # Principal administrative overview
│   ├── Attendance.tsx               # Quick attendance logging view
│   ├── FeeChallan.tsx               # Challan generator and ledger
│   ├── Students.tsx                 # Student enrollment directory
│   ├── Shell.tsx                    # Main portal layout with persistent sidebar
│   └── Login.tsx                    # Administrative authentication gate
├── App.tsx                          # Route definitions & router provider
└── main.tsx                         # App bootstrap with QueryClientProvider
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation
```bash
git clone git@github.com:xxsoloxxleveling-sketch/Jadoon-Portal-Live.git
cd Jadoon-Portal-Live
npm install
```

### Running Locally
```bash
npm run dev
```

---

## 👤 Author
- **xxsoloxxleveling** ([GitHub](https://github.com/xxsoloxxleveling-sketch))\n