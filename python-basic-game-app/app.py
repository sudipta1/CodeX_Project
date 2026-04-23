from __future__ import annotations

import os
import random
from flask import Flask, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-me-in-production")

MAX_NUMBER = int(os.getenv("MAX_NUMBER", "20"))
MAX_ATTEMPTS = int(os.getenv("MAX_ATTEMPTS", "6"))


def reset_game() -> None:
    session["target"] = random.randint(1, MAX_NUMBER)
    session["attempts"] = 0
    session["history"] = []


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
