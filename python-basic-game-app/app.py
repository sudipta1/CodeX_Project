from __future__ import annotations

import os
import random
import time
from flask import Flask, g, redirect, render_template, request, session, url_for
from opentelemetry import metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader, start_http_server
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-me-in-production")

MAX_NUMBER = int(os.getenv("MAX_NUMBER", "20"))
MAX_ATTEMPTS = int(os.getenv("MAX_ATTEMPTS", "6"))
METRICS_HOST = os.getenv("OTEL_EXPORTER_PROMETHEUS_HOST", "0.0.0.0")
METRICS_PORT = int(os.getenv("OTEL_EXPORTER_PROMETHEUS_PORT", "9464"))


def setup_metrics() -> tuple:
    resource = Resource.create({"service.name": "python-basic-game-app"})
    prometheus_reader = PrometheusMetricReader()
    provider = MeterProvider(resource=resource, metric_readers=[prometheus_reader])
    metrics.set_meter_provider(provider)

    start_http_server(port=METRICS_PORT, addr=METRICS_HOST)

    meter = metrics.get_meter("python-basic-game-app")
    request_counter = meter.create_counter(
        name="game_http_requests_total",
        description="Total number of HTTP requests handled by the game app",
    )
    latency_histogram = meter.create_histogram(
        name="game_http_request_duration_ms",
        unit="ms",
        description="Latency of HTTP requests in milliseconds",
    )

    return request_counter, latency_histogram


REQUEST_COUNTER, LATENCY_HISTOGRAM = setup_metrics()


def reset_game() -> None:
    session["target"] = random.randint(1, MAX_NUMBER)
    session["attempts"] = 0
    session["history"] = []


@app.before_request
def start_timer() -> None:
    g.request_start = time.perf_counter()


@app.after_request
def record_metrics(response):
    duration_ms = (time.perf_counter() - g.request_start) * 1000
    attributes = {
        "method": request.method,
        "path": request.path,
        "status_code": response.status_code,
    }
    REQUEST_COUNTER.add(1, attributes)
    LATENCY_HISTOGRAM.record(duration_ms, attributes)
    return response


@app.route("/healthz", methods=["GET"])
def healthz():
    return {"status": "ok"}, 200


@app.route("/", methods=["GET", "POST"])
def index():
    if "target" not in session:
        reset_game()

    message = "Guess a number to start!"
    game_over = False

    if request.method == "POST":
        guess_raw = request.form.get("guess", "").strip()
        if not guess_raw.isdigit():
            message = "Please enter a valid positive number."
        else:
            guess = int(guess_raw)
            session["attempts"] += 1

            history = session.get("history", [])
            history.append(guess)
            session["history"] = history

            target = session["target"]
            attempts_left = MAX_ATTEMPTS - session["attempts"]

            if guess == target:
                message = f"🎉 You won! {guess} is correct."
                game_over = True
            elif attempts_left <= 0:
                message = f"Game over! The number was {target}."
                game_over = True
            elif guess < target:
                message = f"Too low. Attempts left: {attempts_left}."
            else:
                message = f"Too high. Attempts left: {attempts_left}."

    return render_template(
        "index.html",
        message=message,
        max_number=MAX_NUMBER,
        max_attempts=MAX_ATTEMPTS,
        attempts_used=session.get("attempts", 0),
        history=session.get("history", []),
        game_over=game_over,
    )


@app.route("/reset", methods=["POST"])
def reset():
    reset_game()
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
