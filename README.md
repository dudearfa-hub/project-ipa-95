# MAMORA — Prototype v1.1

MAMORA adalah prototipe check-in nafsu makan dengan feedback umum, ide makanan, riwayat lokal, grafik rata-rata 7 hari, dan ekspor CSV. MAMORA bukan alat diagnosis medis.

## Jalankan di Windows
```powershell
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Buka `http://127.0.0.1:5000`.

## Jalankan di macOS/Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Buka `http://127.0.0.1:5000`.

## Fitur
- Check-in waktu makan, nafsu makan, suasana hati, keluhan, dan preferensi makanan.
- Feedback langsung dari backend Flask, dengan fallback frontend.
- Riwayat dan grafik rata-rata nafsu makan 7 hari.
- Riwayat disimpan menggunakan `localStorage` pada browser perangkat pengguna.
- Ekspor riwayat ke CSV dan hapus riwayat.
- Tampilan responsif untuk layar desktop dan ponsel.

## Struktur
- `app.py`: backend Flask dan aturan feedback.
- `templates/index.html`: antarmuka.
- `static/style.css`: desain responsif.
- `static/script.js`: interaksi, riwayat, grafik, dan ekspor CSV.

## Privasi dan batasan
Data check-in disimpan di browser yang digunakan dan **tidak** dikirim ke database. Orang lain yang memakai profil browser/perangkat yang sama mungkin dapat melihatnya. Hindari perangkat bersama dan jangan memasukkan nama lengkap atau informasi pengenal. Menghapus riwayat pada aplikasi menghapus salinan lokal yang dikelola aplikasi ini.

Feedback bersifat umum, bukan diagnosis atau pengganti tenaga kesehatan. Jika nafsu makan rendah berlangsung, keluhan sering berulang, sulit makan/minum, tubuh terasa sangat lemah, atau berat badan turun tanpa disengaja, ceritakan kepada orang tua/wali dan tenaga kesehatan. Jika keluhan berat atau memburuk, cari bantuan medis.

## Catatan pengembangan
Ini masih prototipe lokal, bukan layanan kesehatan yang sudah tervalidasi. Sebelum dipakai banyak orang, lakukan pengujian aksesibilitas, keamanan, validasi dengan tenaga kesehatan, serta tinjauan privasi. Untuk hosting publik dengan backend Flask, gunakan layanan hosting yang mendukung Python; GitHub Pages saja tidak menjalankan Flask.
# project-ipa-95