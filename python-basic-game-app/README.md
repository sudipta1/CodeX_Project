# Python Basic Game App (Kubernetes Ready)

A simple **Guess The Number** game built with Flask, containerized with Docker, and ready to deploy on Kubernetes.

## Features

- Browser-based Python game
- Health endpoint for Kubernetes probes (`/healthz`)
- Dockerized runtime using Gunicorn
- Kubernetes manifests for Deployment, Service, and Ingress

## Run locally

```bash
cd python-basic-game-app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`.

## Run with Docker

```bash
cd python-basic-game-app
docker build -t python-game-app:latest .
docker run --rm -p 5000:5000 -e FLASK_SECRET_KEY=dev-secret python-game-app:latest
```

## Deploy to Kubernetes

1. Build and push image (replace with your registry):

```bash
docker build -t your-registry/python-game-app:latest .
docker push your-registry/python-game-app:latest
```

2. Update `k8s/deployment.yaml` image if needed.

3. Create secret:

```bash
kubectl apply -f k8s/secret.example.yaml
```

4. Deploy app:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

5. Verify:

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

## Configurable environment variables

- `FLASK_SECRET_KEY` (required for production)
- `MAX_NUMBER` (default: `20`)
- `MAX_ATTEMPTS` (default: `6`)
