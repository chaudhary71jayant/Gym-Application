# Gym Management System — Backend API

A production-ready **REST API** built with the **MERN stack** (Node.js, Express.js, MongoDB) for managing gym operations. The system implements a multi-role ERP architecture with JWT-based authentication, role-based access control, cloud storage, scheduled background jobs, and real-time notifications.

---

## Live Demo

> Backend API Base URL: https://gym-application-09kv.onrender.com

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB schema modeling |
| **JWT** | Stateless authentication via httpOnly cookies |
| **bcrypt** | Password hashing |
| **Cloudinary** | Cloud image storage |
| **Multer** | Multipart file upload handling |
| **node-cron** | Scheduled background jobs |
| **cookie-parser** | Cookie parsing middleware |
| **cors** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

---

## User Roles & Hierarchy

```
SuperAdmin
    └── Admin (created by SuperAdmin)
            ├── Trainer (created by Admin)
            └── Member (self-registration)
```

| Role | Responsibilities |
|---|---|
| **SuperAdmin** | Creates and deletes admin accounts only. No access to gym operations. |
| **Admin** | Manages members, trainers, assignments, payments, and attendance. |
| **Trainer** | Creates workout and diet plans for assigned members. |
| **Member** | Views plans, checks in/out, views payment history and notifications. |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary SDK setup
│   ├── models/
│   │   ├── user.model.js          # Base auth model (all roles)
│   │   ├── member.model.js        # Member fitness + membership
│   │   ├── trainer.model.js       # Trainer profile + assigned members
│   │   ├── workoutPlan.model.js   # Exercise plans
│   │   ├── dietPlan.model.js      # Nutrition plans
│   │   ├── attendance.model.js    # Check-in/out records
│   │   ├── payment.model.js       # Fee transactions
│   │   └── notification.model.js  # In-app alerts
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── member.controller.js
│   │   ├── trainer.controller.js
│   │   ├── assignment.controller.js
│   │   ├── workoutPlan.controller.js
│   │   ├── dietPlan.controller.js
│   │   ├── attendance.controller.js
│   │   ├── payment.controller.js
│   │   ├── notification.controller.js
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── member.routes.js
│   │   ├── trainer.routes.js
│   │   ├── assignment.routes.js
│   │   ├── workoutPlan.routes.js
│   │   ├── dietPlan.routes.js
│   │   ├── attendance.routes.js
│   │   ├── payment.routes.js
│   │   ├── notification.routes.js
│   │   └── stats.routes.js
│   ├── middlewares/
│   │   ├── authmiddleware.js      # JWT verification
│   │   ├── rolemiddleware.js      # Role-based access control
│   │   ├── uploadmiddleware.js    # Multer configuration
│   │   └── errorhandler.js       # Centralized error handling
│   ├── utils/
│   │   ├── generateToken.js       # JWT signing utility
│   │   └── uploading.js           # Cloudinary upload wrapper
│   ├── jobs/
│   │   └── schedule.jobs.js       # node-cron background jobs
│   └── scripts/
│       └── createSuperAdmin.js    # One-time seed script
└── server.js                      # Entry point
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register a new member |
| POST | `/api/v1/auth/login` | Public | Login (sets httpOnly cookie) |
| POST | `/api/v1/auth/logout` | Private | Logout (clears cookie) |
| PUT | `/api/v1/auth/change-password` | Private | Change password |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/user/admins` | SuperAdmin | Get all admins |
| POST | `/api/v1/user/create-admin` | SuperAdmin | Create admin account |
| DELETE | `/api/v1/user/admin/:id` | SuperAdmin | Delete admin |
| GET | `/api/v1/user` | Admin | Get all members & trainers |
| GET | `/api/v1/user/me` | Any | Get own profile |
| PUT | `/api/v1/user/me` | Any | Update own profile |
| PUT | `/api/v1/user/me/profile-image` | Any | Upload profile picture |
| PUT | `/api/v1/user/:id/status` | Admin | Activate/deactivate user |

### Members
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/member` | Admin/Trainer | Get all members |
| GET | `/api/v1/member/me` | Member | Get own member profile |
| GET | `/api/v1/member/:id` | Admin/Trainer/Self | Get member by ID |
| PUT | `/api/v1/member/:id` | Admin/Self | Update member profile |
| PUT | `/api/v1/member/:id/membership-status` | Admin | Update membership status |
| DELETE | `/api/v1/member/:id` | Admin | Delete member |

### Trainers
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/trainer` | Admin | Create trainer |
| GET | `/api/v1/trainer` | Any | Get all trainers |
| GET | `/api/v1/trainer/:id` | Any | Get trainer by ID |
| PUT | `/api/v1/trainer/:id` | Admin/Self | Update trainer |
| DELETE | `/api/v1/trainer/:id` | Admin | Delete trainer |

### Assignments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/assignments/assign` | Admin | Assign trainer to member |
| POST | `/api/v1/assignments/unassign` | Admin | Unassign trainer |
| GET | `/api/v1/assignments/trainer/:id` | Admin/Trainer | Get trainer's members |
| GET | `/api/v1/assignments/member/:id` | Any | Get member's trainer |

### Workout & Diet Plans
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/workout-plans` | Trainer | Create workout plan |
| GET | `/api/v1/workout-plans/member/:id` | Any | Get member's plans |
| PUT | `/api/v1/workout-plans/:id` | Trainer | Update plan |
| DELETE | `/api/v1/workout-plans/:id` | Trainer/Admin | Delete plan |
| POST | `/api/v1/diet-plans` | Trainer | Create diet plan |
| GET | `/api/v1/diet-plans/member/:id` | Any | Get member's diet plans |

### Attendance
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/attendance/checkin` | Member | Check in to gym |
| PUT | `/api/v1/attendance/checkout` | Member | Check out of gym |
| GET | `/api/v1/attendance/today` | Admin | Today's attendance |
| GET | `/api/v1/attendance/member/:id` | Any | Member attendance history |

### Payments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/payments` | Admin | Create payment record |
| GET | `/api/v1/payments` | Admin | Get all payments |
| PUT | `/api/v1/payments/:id/status` | Admin | Update payment status |
| GET | `/api/v1/payments/member/:id` | Admin/Member | Member payment history |

### Notifications & Stats
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | Any | Get my notifications |
| PUT | `/api/v1/notifications/read-all` | Any | Mark all as read |
| PUT | `/api/v1/notifications/:id/read` | Owner | Mark one as read |
| DELETE | `/api/v1/notifications/:id` | Owner | Delete notification |
| GET | `/api/v1/stats/admin` | Admin | Dashboard stats |

---

## Authentication Flow

This API uses **httpOnly cookie-based JWT authentication** instead of localStorage:

1. User logs in → backend signs a JWT and sets it as an httpOnly cookie
2. Browser automatically sends the cookie with every request
3. `authMiddleware` reads and verifies the cookie on protected routes
4. `roleMiddleware` checks the user's role for authorization

**Why httpOnly cookies over localStorage?**
- httpOnly cookies cannot be accessed by JavaScript — immune to XSS attacks
- localStorage is vulnerable to script injection stealing the token

---

## Background Jobs (node-cron)

Three scheduled jobs run automatically:

| Job | Schedule | Description |
|---|---|---|
| Membership Expiry Alert | Every day at 00:00 | Notifies members expiring within 7 days |
| Mark Expired Memberships | Every day at 00:05 | Auto-updates expired membership status |
| Missed Session Alert | Every day at 23:00 | Notifies members who didn't check in |

---

## Image Upload Flow

```
Frontend (form-data) → Multer (memory storage) → Cloudinary SDK → URL saved in MongoDB
```

- Images are never stored on the server disk
- Multer uses memory storage (buffer) — safe for ephemeral deployment platforms
- Cloudinary auto-crops profile pictures to 500×500 with face detection

---

##  Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (free tier)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/chaudhary71jayant/Gym-Application.git
cd Gym-Application/backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Fill in your values

# 4. Create the SuperAdmin (run once)
node src/scripts/createSuperAdmin.js

# 5. Start the development server
npm run dev
```

### Environment Variables

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SUPERADMIN_EMAIL=superadmin@gym.com
SUPERADMIN_PASSWORD=your_strong_password
```

---

##  Testing

All endpoints tested via **Postman** with cookie-based authentication.

Test order:
1. Run seed script to create SuperAdmin
2. SuperAdmin login → create Admin
3. Admin login → create Trainer → register Member
4. Admin assigns Trainer to Member
5. Trainer creates Workout and Diet Plans
6. Member checks in/out
7. Admin records and confirms payment
8. Verify notifications received

---

##  Key Design Decisions

**Separation of Concerns** — Controllers handle business logic, routes handle URL mapping, middleware handles cross-cutting concerns (auth, RBAC, uploads, errors).

**Two-document user architecture** — Every user has a `User` document (auth) and a role-specific document (`Member` or `Trainer`). This keeps auth concerns separate from business data.

**SuperAdmin isolation** — SuperAdmin is blocked from all application routes via `roleMiddleware`. They can only create, view, and delete admin accounts. This is enforced at the middleware level, not per-controller.

**Promise.all for stats** — The dashboard stats endpoint runs all MongoDB queries in parallel using `Promise.all`, reducing response time significantly compared to sequential queries.

---