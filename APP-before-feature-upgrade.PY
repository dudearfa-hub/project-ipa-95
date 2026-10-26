
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)


# DASHBOARD UTAMA — TANPA LOGIN
@app.route("/")
def home():
    return render_template("index.html")


# PROFIL PEMILIK
@app.route("/profile")
def profile():
    return render_template(
        "profile.html",
        owner_name="Pemilik MAMORA"
    )


# HALAMAN ANALISIS
@app.route("/analysis")
def analysis():
    return render_template(
        "analysis.html",
        owner_name="Pemilik MAMORA"
    )


# PEMERIKSAAN STATUS SERVER
@app.route("/api/health")
def health():
    return jsonify({
        "success": True,
        "app": "MAMORA",
        "message": "MAMORA berjalan dengan baik!"
    })


# FEEDBACK ANALISIS NAFSU MAKAN
@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.get_json(silent=True) or {}

    try:
        appetite = int(data.get("appetite", 3))
        appetite = max(1, min(5, appetite))
    except (ValueError, TypeError):
        appetite = 3

    if appetite <= 2:
        headline = "Mulai dari langkah kecil 🌱"
        message = (
            "Kamu mencatat nafsu makan yang relatif rendah "
            "pada skala MAMORA hari ini."
        )
        tips = [
            "Coba porsi kecil sesuai kenyamananmu.",
            "Amati apakah pola ini berulang.",
            "Catat hal yang kamu rasakan tanpa menyalahkan diri."
        ]

    elif appetite == 3:
        headline = "Amati pola harianmu 🌿"
        message = (
            "Catatanmu berada di tingkat tengah skala MAMORA. "
            "Amati perubahan dari hari ke hari."
        )
        tips = [
            "Usahakan pola makan yang nyaman dan teratur.",
            "Catat suasana hati jika kamu ingin.",
            "Perhatikan kebutuhan tubuhmu."
        ]

    else:
        headline = "Terus dengarkan tubuhmu 💚"
        message = (
            "Kamu mencatat nafsu makan yang relatif lebih tinggi "
            "pada skala MAMORA hari ini."
        )
        tips = [
            "Nikmati makanan dengan nyaman.",
            "Catat pola harianmu.",
            "Ingat, satu catatan tidak menggambarkan seluruh kondisi."
        ]

    note = (
        "Skor MAMORA adalah catatan subjektif, bukan diagnosis "
        "atau ukuran kesehatan. Jika nafsu makan rendah berlangsung "
        "atau sering berulang, bicarakan dengan orang tua/wali "
        "dan tenaga kesehatan."
    )

    return jsonify({
        "success": True,
        "headline": headline,
        "message": message,
        "tips": tips,
        "note": note,
        "timestamp": datetime.now().isoformat(
            timespec="seconds"
        )
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )
    
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )
