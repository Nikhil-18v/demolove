# Food Delivery 3-Tier Application

A beginner/intermediate DevOps practice project with three tiers:

1. Frontend - React + Vite
2. Backend - Node.js + Express REST API
3. Database - PostgreSQL

## Run locally

Requirements: Node.js 20+, Docker, Docker Compose.

### 1. Start PostgreSQL
```bash
docker compose up -d db
```

### 2. Start backend
```bash
cd backend
npm install
npm run dev
```

Backend: http://localhost:5000

### 3. Start frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## API endpoints

- GET /api/health
- GET /api/restaurants
- GET /api/restaurants/:id/menu
- POST /api/orders
- GET /api/orders/:id

The database is automatically initialized from database/init.sql.

## DevOps roadmap

Next add Dockerfiles, Docker Compose for all three tiers, Jenkins CI/CD, Docker Hub, Kubernetes, Helm, Terraform, AWS, Prometheus and Grafana.
