# ☁️ AWS VPC Peering Dashboard

A full-stack, production-ready web application to **visualize, implement, and track** the AWS VPC Peering internship project. Built with **React + Vite** (frontend) and **Node.js + Express + SQLite** (backend), styled with a beautiful **Glassmorphism UI**.

---

## 📸 Features

| Page | Description |
|------|-------------|
| 🏠 **Home** | Live project stats, completion progress bar, architecture preview |
| 🗺️ **Architecture** | Interactive SVG VPC diagram, CIDR table, route tables, security groups |
| 📋 **Guide** | 20-step implementation guide with progress tracking (saved to localStorage) |
| 🗄️ **Resources** | Full CRUD tracker for all AWS resources (VPCs, Subnets, EC2s, IGW, etc.) |
| 🔗 **Connectivity** | Log ping/SSH tests between instances, track latency & packet loss |

---

## 🏗️ Project Architecture

```
AWS intern Project/
├── frontend/          → React 18 + Vite  → Deploy to Vercel
└── backend/           → Node.js + Express → Deploy to Render
```

### VPC Architecture (implemented in AWS)

```
AWS Cloud (ap-south-1)
│
├── VPC-1 (10.28.0.0/16)
│   ├── Internet Gateway (IGW-1)
│   ├── Public Subnet (10.28.1.0/24)
│   │   ├── EC2-Public-1 (10.28.1.10) ← has public IP
│   │   └── Route Table → 0.0.0.0/0 → IGW, 10.28.200.0/16 → Peering
│   └── Private Subnet (10.28.2.0/24)
│       ├── EC2-Private-1 (10.28.2.10)
│       └── Route Table → 10.28.200.0/16 → Peering
│
├── VPC-2 (10.28.200.0/16)
│   └── Private Subnet (10.28.200.0/24)
│       ├── EC2-VPC2 (10.28.200.10)
│       └── Route Table → 10.28.0.0/16 → Peering
│
└── VPC Peering Connection (VPC-1 ↔ VPC-2)
```

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Backend

```bash
cd backend
npm install
npm run dev        # runs on http://localhost:5000
```

Health check: `http://localhost:5000/api/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `localhost:5000` automatically.

---

## 🌐 Deployment

### Backend → Render

1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`

### Frontend → Vercel

1. New Project on [vercel.com](https://vercel.com)
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Environment Variables**:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

---

## 🔌 Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Project completion stats |
| GET | `/api/resources` | List resources (filter: `?vpc=VPC-1&type=EC2 Instance`) |
| POST | `/api/resources` | Create resource |
| PUT | `/api/resources/:id` | Update resource |
| DELETE | `/api/resources/:id` | Delete resource |
| GET | `/api/connectivity` | List connectivity tests |
| POST | `/api/connectivity` | Log a test |
| DELETE | `/api/connectivity/:id` | Delete a test log |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS Glassmorphism (`backdrop-filter: blur()`) |
| HTTP | Axios |
| Backend | Node.js, Express 4 |
| Database | SQLite via `better-sqlite3` |
| Security | Helmet, CORS |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📋 Internship Submission Checklist

- [ ] VPC-1 created (10.28.0.0/16)
- [ ] Public Subnet created (10.28.1.0/24)
- [ ] Private Subnet created (10.28.2.0/24)
- [ ] Internet Gateway created and attached
- [ ] Route tables configured (public + private)
- [ ] EC2 in Public Subnet launched
- [ ] EC2 in Private Subnet launched
- [ ] VPC-2 created (10.28.200.0/16)
- [ ] Private Subnet in VPC-2 created (10.28.200.0/24)
- [ ] EC2 in VPC-2 launched
- [ ] VPC Peering connection created and accepted
- [ ] Route tables updated with peering routes (both VPCs)
- [ ] Ping test successful: EC2-Public → EC2-Private
- [ ] Ping test successful: EC2-Public → EC2-VPC2 (cross-VPC)
- [ ] Screenshots taken of successful ping outputs
- [ ] Dashboard deployed to Vercel + Render

---

## 👨‍💻 Project By

AWS Cloud Internship — VPC Peering Architecture Project  
Region: ap-south-1 (Mumbai)
