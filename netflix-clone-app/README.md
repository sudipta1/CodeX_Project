# Netflix Clone App (Docker + AKS Ready)

A lightweight Netflix-style clone built with Node.js + Express + vanilla frontend.

## Features

- Hero banner and responsive Netflix-like layout
- Dynamic movie/content cards loaded from backend API
- Health endpoint for container orchestration (`/healthz`)
- Dockerized for local deployment
- Kubernetes manifests included for AKS deployment

## Project Structure

```text
netflix-clone-app/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
├── Dockerfile
├── docker-compose.yml
├── package.json
└── server.js
```

## Run Locally (without Docker)

```bash
npm install
npm start
```

Open: `http://localhost:3000`

## Run with Docker (local system)

### 1) Build image

```bash
docker build -t netflix-clone-app:latest .
```

### 2) Run container

```bash
docker run -d --name netflix-clone -p 3000:3000 netflix-clone-app:latest
```

Open: `http://localhost:3000`

### 3) Using Docker Compose

```bash
docker compose up -d --build
```

## Deploy to AKS (later)

1. Build and push image to ACR:

```bash
az acr login --name <ACR_NAME>
docker tag netflix-clone-app:latest <ACR_NAME>.azurecr.io/netflix-clone-app:latest
docker push <ACR_NAME>.azurecr.io/netflix-clone-app:latest
```

2. Update image in `k8s/deployment.yaml` if needed.

3. Apply manifests:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

4. Get external IP:

```bash
kubectl get svc netflix-clone-service
```

## Notes

- If your environment blocks `npm` registry access, build in an environment with npm access.
- The app listens on `PORT` env variable (default: `3000`).
