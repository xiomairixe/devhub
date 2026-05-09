# DevHub — Freelance Client Hub
## Complete Setup & Deployment Guide

---

## 📁 Project Structure

```
devhub/
├── server/              ← Express + MongoDB backend
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/          ← User, Client, Project, Inquiry
│   ├── routes/          ← auth, clients, projects, inquiries
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── client/              ← React + Vite frontend
    ├── src/
    │   ├── components/  ← layout, auth
    │   ├── pages/       ← Landing, Dashboard, Clients, Projects, ProjectDetail, InquiryForm
    │   ├── context/     ← AuthContext
    │   ├── utils/       ← api.js (axios)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

---

## 🚀 STEP 1 — Prerequisites

Install these before starting:
- **Node.js** v18+ → https://nodejs.org
- **Git** → https://git-scm.com
- **VS Code** (recommended) → https://code.visualstudio.com

---

## 🔧 STEP 2 — Local Setup

### 2a. Clone / Initialize Repo
```bash
git init devhub
cd devhub
```

Copy the provided `server/` and `client/` folders into this directory.

### 2b. Setup Backend
```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` — fill in your values:
```
PORT=5000
MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
```

Start backend dev server:
```bash
npm run dev
```
→ Server runs at http://localhost:5000

### 2c. Setup Frontend
```bash
cd ../client
npm install
cp .env.example .env
```

`.env` content:
```
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```
→ App runs at http://localhost:5173

---

## ☁️ STEP 3 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Sign up / Login
2. Create a **free M0 cluster**
3. Go to **Database Access** → Add Database User (username + password)
4. Go to **Network Access** → Add IP Address → `0.0.0.0/0` (allow all for dev)
5. Go to **Clusters** → Connect → **Connect your application**
6. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/devhub?retryWrites=true&w=majority
   ```
7. Paste into `server/.env` as `MONGO_URI`

---

## 🖼️ STEP 4 — Cloudinary Setup

1. Go to https://cloudinary.com → Sign up (free tier)
2. From the **Dashboard**, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add to `server/.env`

---

## 🌐 STEP 5 — Deployment

### 5a. Push to GitHub
```bash
cd devhub
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/devhub.git
git push -u origin main
```

---

### 5b. Deploy Backend to Render

1. Go to https://render.com → Sign up
2. New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: devhub-api
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add **Environment Variables** (same as your .env):
   ```
   MONGO_URI=<your atlas URI>
   JWT_SECRET=<your secret>
   CLIENT_URL=https://<your-vercel-domain>.vercel.app
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
6. Click **Deploy**
7. Copy your Render URL: `https://devhub-api.onrender.com`

---

### 5c. Deploy Frontend to Vercel

1. Go to https://vercel.com → Sign up
2. New Project → Import your GitHub repo
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variable**:
   ```
   VITE_API_URL=https://devhub-api.onrender.com/api
   ```
5. Click **Deploy**
6. Copy your Vercel URL: `https://devhub.vercel.app`

---

### 5d. Update CORS on Render

Go back to Render → Environment Variables → Update:
```
CLIENT_URL=https://devhub.vercel.app
```
Then redeploy.

---

## 🔐 STEP 6 — First Login

1. Open your deployed app (or http://localhost:5173)
2. Click **Client Login** in the navbar
3. Click **Sign Up** → Create your admin account
4. You're in! Start adding clients, projects, and inquiries.

---

## 📦 Key NPM Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production (client) |
| `npm start` | Start production server (server) |

---

## 🛠️ Feature Roadmap (future additions)

- [ ] Email notifications (Nodemailer / Resend)
- [ ] Client portal login (clients view their own projects)
- [ ] Invoice generation (PDF)
- [ ] Calendar view for deadlines
- [ ] Rich text notes per project
- [ ] Two-factor authentication

---

## 🐛 Common Issues

**"CORS error"** → Make sure `CLIENT_URL` in server `.env` matches your frontend URL exactly.

**"Cannot POST /api/..."** → Backend not running, or `VITE_API_URL` is wrong.

**"MongoDB connection failed"** → Check Atlas Network Access — IP `0.0.0.0/0` must be allowed.

**Render cold starts** → Free tier sleeps after 15 min inactivity. First request may take ~30s.

---

## 📞 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/clients | ✅ | List clients |
| POST | /api/clients | ✅ | Add client |
| PUT | /api/clients/:id | ✅ | Update client |
| DELETE | /api/clients/:id | ✅ | Delete client |
| GET | /api/projects | ✅ | List projects |
| POST | /api/projects | ✅ | Create project |
| PUT | /api/projects/:id | ✅ | Update project |
| POST | /api/projects/:id/upload | ✅ | Upload file |
| DELETE | /api/projects/:id | ✅ | Delete project |
| GET | /api/inquiries | ✅ | List inquiries (admin) |
| POST | /api/inquiries | ❌ | Submit inquiry (public) |
| PUT | /api/inquiries/:id | ✅ | Update inquiry status |
| DELETE | /api/inquiries/:id | ✅ | Delete inquiry |
