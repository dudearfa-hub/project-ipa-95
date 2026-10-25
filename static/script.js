
(() => {
  "use strict";

  const KEY = "mamora_checkins_v2";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  let entries = loadEntries();
  let homeChart = null;
  let detailChart = null;

  function loadEntries() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
      return true;
    } catch {
      alert("Penyimpanan browser tidak tersedia atau penuh.");
      return false;
    }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function asDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function formatDate(value) {
    return asDate(value).toLocaleString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function appetiteLabel(score) {
    return ({
      1: "Sangat rendah", 2: "Rendah", 3: "Biasa",
      4: "Baik", 5: "Sangat baik"
    })[Number(score)] || "Belum dicatat";
  }

  function latest() {
    return [...entries].sort((a, b) =>
      asDate(b.date) - asDate(a.date)
    )[0] || null;
  }

  function navigate(page) {
    $$(".page").forEach(p =>
      p.classList.toggle("active", p.id === `page-${page}`)
    );

    $$(".nav-item, .mobile-nav button").forEach(b =>
      b.classList.toggle("active", b.dataset.page === page)
    );

    const titles = {
      home: "Halo, apa kabar hari ini?",
      checkin: "Luangkan waktu untuk dirimu.",
      charts: "Perjalananmu dari waktu ke waktu.",
      history: "Catatan perjalananmu."
    };

    $("#page-heading").textContent = titles[page] || titles.home;

    if (page === "charts") renderDetailChart();
    if (page === "history") renderHistory();
    if (page === "home") renderHomeChart();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$("[data-page]").forEach(button =>
    button.addEventListener("click", () => navigate(button.dataset.page))
  );

  const now = new Date();
  $("#date-label").textContent =
    now.toLocaleDateString("id-ID", { weekday: "long" }).toUpperCase();
  $("#today-label").textContent =
    now.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });

  function localDateTime() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  $("#entry-date").value = localDateTime();

  async function getFeedback(entry) {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      if (!response.ok) throw new Error("Feedback API gagal");
      return await response.json();
    } catch {
      const low = Number(entry.appetite) <= 2;
      const tips = low
        ? ["Coba porsi kecil secara berkala.", "Pilih makanan yang terasa nyaman."]
        : ["Coba makan teratur.", "Perhatikan perubahan selera makanmu."];

      if (entry.symptoms.length) {
        tips.push("Catat gejala yang dirasakan dan bicarakan dengan orang dewasa tepercaya bila mengkhawatirkan.");
      }
      if (["Sedih", "Cemas", "Stres"].includes(entry.mood)) {
        tips.push("Suasana hati dapat berkaitan dengan selera makan. Ceritakan kepada orang tepercaya bila perlu.");
      }

      return {
        headline: low ? "Mulai dari langkah kecil 🌱" : "Terus dengarkan tubuhmu 💚",
        message: low
          ? "Nafsu makanmu sedang rendah. Cobalah langkah kecil tanpa memaksakan diri."
          : "Terima kasih sudah meluangkan waktu untuk mengenali keadaanmu.",
        tips,
        note: "Feedback umum, bukan diagnosis medis."
      };
    }
  }

  $("#checkin-form").addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const fd = new FormData(form);
    const symptoms = fd.getAll("symptoms")
      .filter(s => s !== "Tidak ada");

    const entry = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      date: fd.get("date") || new Date().toISOString(),
      appetite: Number(fd.get("appetite")),
      mood: fd.get("mood") || "Biasa saja",
      symptoms,
      meal: String(fd.get("meal") || "").trim(),
      preference: String(fd.get("preference") || "").trim(),
      notes: String(fd.get("notes") || "").trim()
    };

    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    submit.textContent = "Menyimpan…";

    try {
      const feedback = await getFeedback(entry);
      entry.feedback = feedback;
      entries.push(entry);

      if (!saveEntries()) {
        entries = entries.filter(e => e.id !== entry.id);
        return;
      }

      $("#feedback-title").textContent = feedback.headline;
      $("#feedback-message").textContent = feedback.message;
      $("#feedback-tips").innerHTML = (feedback.tips || [])
        .map(t => `<li>${esc(t)}</li>`).join("");
      $("#feedback-note").textContent = feedback.note || "";
      $("#feedback-panel").classList.remove("hidden");

      updateDashboard();
      $("#feedback-panel").scrollIntoView({
        behavior: "smooth", block: "start"
      });
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Simpan check-in <span>→</span>';
    }
  });

  function updateDashboard() {
    const entry = latest();
    $("#stat-appetite").textContent =
      entry ? appetiteLabel(entry.appetite) : "Belum ada";
    $("#stat-appetite-detail").textContent =
      entry ? `Skor ${entry.appetite}/5 · ${formatDate(entry.date)}` : "Mulai check-in pertamamu";
    $("#stat-mood").textContent = entry ? entry.mood : "Belum dicatat";
    $("#stat-count").textContent = String(entries.length);

    renderHomeChart();
    renderDetailChart();
    renderHistory();
  }

  function series(days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const values = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

      const matches = entries.filter(e => {
        const d = asDate(e.date);
        return d.getFullYear() === day.getFullYear()
          && d.getMonth() === day.getMonth()
          && d.getDate() === day.getDate();
      });

      labels.push(days === 7
        ? day.toLocaleDateString("id-ID", { weekday: "short" })
        : day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));

      values.push(matches.length
        ? matches.reduce((sum, e) => sum + Number(e.appetite), 0) / matches.length
        : null);
    }

    return { labels, values };
  }

  function createChart(canvas, data) {
    if (!window.Chart || !canvas) return null;

    return new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Nafsu makan",
          data: data.values,
          spanGaps: true,
          borderColor: "#3e7a58",
          backgroundColor: "rgba(62,122,88,.12)",
          fill: true,
          tension: .35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: "#3e7a58"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 1, max: 5,
            ticks: { stepSize: 1, color: "#849187" },
            grid: { color: "#edf1ec" }
          },
          x: {
            ticks: { color: "#849187", maxTicksLimit: 7, maxRotation: 0 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderHomeChart() {
    const canvas = $("#home-chart");
    if (!canvas) return;

    const data = series(7);
    const hasData = data.values.some(v => v !== null);
    $("#home-empty").style.display = hasData ? "none" : "flex";

    if (homeChart) homeChart.destroy();
    homeChart = createChart(canvas, data);
  }

  function renderDetailChart() {
    const canvas = $("#detail-chart");
    if (!canvas) return;

    const data = series(Number($("#chart-range").value || 7));
    const hasData = data.values.some(v => v !== null);
    $("#detail-empty").style.display = hasData ? "none" : "flex";

    const average = entries.length
      ? (entries.reduce((s, e) => s + Number(e.appetite), 0) / entries.length).toFixed(1)
      : "—";

    $("#chart-summary").textContent =
      `${entries.length} catatan · rata-rata ${average}/5`;

    if (detailChart) detailChart.destroy();
    detailChart = createChart(canvas, data);
  }

  $("#chart-range").addEventListener("change", renderDetailChart);

  function renderHistory() {
    const query = ($("#history-search").value || "").trim().toLowerCase();
    const filtered = [...entries]
      .sort((a, b) => asDate(b.date) - asDate(a.date))
      .filter(e => [
        e.meal, e.preference, e.mood, e.notes, ...(e.symptoms || [])
      ].join(" ").toLowerCase().includes(query));

    $("#history-count").textContent = `${entries.length} catatan`;

    const list = $("#history-list");

    if (!filtered.length) {
      list.innerHTML = `
        <div class="history-empty">
          <div style="font-size:28px">🌱</div>
          <strong>${entries.length ? "Catatan tidak ditemukan" : "Belum ada catatan"}</strong>
          <span>${entries.length ? "Coba kata kunci lain." : "Check-in pertamamu akan muncul di sini."}</span>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(e => `
      <article class="history-item">
        <div class="history-score">${esc(e.appetite)}<small>/5</small></div>
        <div class="history-main">
          <h3>${esc(appetiteLabel(e.appetite))} · ${esc(e.mood)}</h3>
          <div class="history-meta">${esc(formatDate(e.date))}</div>
          <p class="history-detail">${esc([
            e.meal && `Makanan: ${e.meal}`,
            e.preference && `Diinginkan: ${e.preference}`,
            e.symptoms?.length && `Gejala: ${e.symptoms.join(", ")}`,
            e.notes
          ].filter(Boolean).join(" · ") || "Tidak ada catatan tambahan.")}</p>
        </div>
        <button class="history-delete" data-delete="${esc(e.id)}"
                aria-label="Hapus catatan" title="Hapus catatan">✕</button>
      </article>
    `).join("");

    $$("[data-delete]", list).forEach(button => {
      button.addEventListener("click", () => {
        if (!confirm("Hapus catatan ini?")) return;
        entries = entries.filter(e => e.id !== button.dataset.delete);
        if (saveEntries()) updateDashboard();
      });
    });
  }

  $("#history-search").addEventListener("input", renderHistory);

  $("#clear-all").addEventListener("click", () => {
    if (!entries.length) {
      alert("Belum ada catatan untuk dihapus.");
      return;
    }
    if (!confirm("Hapus semua catatan MAMORA dari browser ini?")) return;
    entries = [];
    if (saveEntries()) updateDashboard();
  });

  $("#export-csv").addEventListener("click", () => {
    if (!entries.length) {
      alert("Belum ada catatan untuk diekspor.");
      return;
    }

    const columns = [
      "Tanggal", "Nafsu makan", "Suasana hati",
      "Gejala", "Makanan", "Makanan yang diinginkan", "Catatan"
    ];

    const rows = entries.map(e => [
      e.date, e.appetite, e.mood,
      (e.symptoms || []).join("; "),
      e.meal, e.preference, e.notes
    ]);

    const cell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [columns, ...rows]
      .map(row => row.map(cell).join(",")).join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `mamora-riwayat-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  updateDashboard();
})();
