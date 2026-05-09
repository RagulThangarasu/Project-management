# Hashout Project Management System

A premium, high-performance project management application built for teams that need precision, speed, and beautiful design.

![Live Site](https://ragulthangarasu.github.io/Project-management/)

## 🚀 Key Features

- **Dynamic Kanban Board**: Drag-and-drop task management with real-time state synchronization.
- **Advanced Backlog**: Sprint planning and task prioritization with a focus on developer efficiency.
- **Intelligent Timesheets**: Track effort across projects and tasks with granular logging.
- **Admin Portal**: Robust user management, invitation system, and role-based access control.
- **Analytics & Metrics**: Visualized project health with charts and performance tracking.
- **Excel View**: Bulk task management and data export/import capabilities.
- **Premium UI**: Sleek dark-mode aesthetic with glassmorphism and smooth micro-animations.

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with a custom design system and Glassmorphism.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend & Data
- **Server**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) for local development and lightweight persistence.
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth) for secure user sessions.
- **Scalability**: Integrated with [Supabase](https://supabase.com/) for future-proof object storage (1M+ files) and PostgreSQL migration.

## 🌐 Deployment

- **Frontend**: Hosted on **GitHub Pages** ([Live Link](https://ragulthangarasu.github.io/Project-management/))
- **Backend**: Hosted on **Render** (Auto-waking service)
- **Infrastructure**: Configured for **Netlify** edge deployments.

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RagulThangarasu/Project-management.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root and server directories with:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SMTP_USER` / `SMTP_PASS` (for invite emails)

4. **Run the application**:
   ```bash
   npm run dev
   ```

## 📈 Scalability Note

This project is built to grow. While it currently uses SQLite for its simplicity, the integration with **Supabase** allows for handling:
- Over 1 million tasks and projects.
- Petabytes of photo and video storage via Supabase Buckets.
- Global CDN delivery for all media assets.

---
© 2026 Hashout Tech. All rights reserved.
