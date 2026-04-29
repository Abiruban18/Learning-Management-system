# EduQuest — Full-Stack EdTech Platform

A gamified learning platform with separate Teacher and Student portals,
built with React + TypeScript (frontend) and Node.js + Express + TypeScript + MongoDB (backend).

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS        |
| State     | Zustand (auth), TanStack Query (server state)   |
| Charts    | Recharts                                        |
| Backend   | Node.js, Express, TypeScript                    |
| Database  | MongoDB (Mongoose ODM)                          |
| Auth      | JWT + bcrypt, role-based guards                 |

---

## Project Structure

```
edtech/
├── backend/
│   ├── src/
│   │   ├── config/       db.ts
│   │   ├── controllers/  authController, courseController,
│   │   │                 studentController, settingsController
│   │   ├── middleware/   auth.ts (JWT protect + requireRole)
│   │   ├── models/       User, Course, Enrollment, Quiz,
│   │   │                 Progress, ActivityLog, SiteSettings
│   │   ├── routes/       index.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/guards/   RouteGuards.tsx
    │   ├── layouts/             TeacherLayout, StudentLayout
    │   ├── lib/                 api.ts (axios + typed helpers)
    │   ├── pages/
    │   │   ├── AuthPage.tsx
    │   │   ├── teacher/         Dashboard, Courses, CourseModuleManager,
    │   │   │                    CourseStudents, TeacherStudents,
    │   │   │                    QuizBuilder, Settings
    │   │   └── student/         Dashboard, CourseList, MyLearning,
    │   │                        CoursePage, QuizEngine, Activity
    │   ├── store/               authStore.ts (Zustand + persist)
    │   ├── types/               index.ts
    │   ├── App.tsx              (all routes wired)
    │   └── main.tsx
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.ts
    └── package.json
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm install
npm run dev         # ts-node-dev on port 5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev         # Vite on port 5173
```

Vite proxies `/api` → `http://localhost:5000` automatically.

---

## Features

### Teacher Portal
- Create, edit, publish/draft courses
- Add modules with deadlines and materials (video, PDF, text, link)
- Build gamified quizzes with per-question timers and XP rewards
- View enrolled students per course with completion % progress bar
- Full site settings (name, brand color, XP config, feature toggles, maintenance mode)

### Student Portal (dark gamified theme)
- Browse and enroll in published courses
- Task checklist per module with deadline badges (overdue warning)
- Mark materials done → auto-updates completion %
- Gamified quiz engine: animated countdown ring, A/B/C/D cards,
  correct/wrong flash, explanation on feedback, full score screen with XP earned
- Activity dashboard: 30-day heatmap, streak tracking, time spent charts (Recharts)
- Daily login tracked automatically; time-spent updates on each page visit

---

## API Routes (all under `/api`)

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /courses                       (all published)
GET    /courses/:id
GET    /teacher/courses               [teacher]
POST   /courses                       [teacher]
PUT    /courses/:id                   [teacher]
DELETE /courses/:id                   [teacher]
POST   /courses/:id/modules           [teacher]
GET    /courses/:id/students          [teacher]

GET    /quizzes/:id
GET    /quizzes/course/:courseId
POST   /quizzes                       [teacher]
POST   /quizzes/submit                [student]

POST   /enrollments                   [student]
GET    /enrollments/mine              [student]
GET    /progress/:courseId            [student]
POST   /progress/complete             [student]
POST   /activity/log                  [student]
GET    /activity/summary              [student]

GET    /settings                      [teacher]
PUT    /settings                      [teacher]
```

---

## MongoDB Collections

| Collection    | Purpose                                      |
|---------------|----------------------------------------------|
| users         | Teachers and students with hashed passwords  |
| courses       | Course metadata + nested modules/materials   |
| enrollments   | Student ↔ course link with completion %      |
| quizzes       | Quiz questions, options, timers, XP          |
| quizattempts  | Per-attempt scores, answers, XP earned       |
| courseprogress| Per-task completion, XP totals, streaks      |
| activitylogs  | Daily login, time spent, streak counter      |
| sitesettings  | Platform config managed by teacher           |

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/edtech
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
