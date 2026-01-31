/* =====================
   REQUESTS CSV
===================== */

// ⚠️ CSV ТОЙ ЖЕ ТАБЛИЦЫ, КУДА ПИШЕТ Apps Script
const REQUESTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?output=csv&gid=928782791";

/* =====================
   CSV → JSON
===================== */

const csvToJson = (text) => {
  const rows = text
    .trim()
    .split("\n")
    .map(r => r.split(",").map(v => v.trim()));

  const headers = rows.shift();

  return rows.map(r =>
    Object.fromEntries(headers.map((h, i) => [h, r[i]]))
  );
};

/* =====================
   LOAD REQUESTS
===================== */

fetch(REQUESTS_URL)
  .then(r => r.text())
  .then(csv => {
    const requests = csvToJson(csv);
    console.log("REQUESTS:", requests);
    renderRequests(requests);
  })
  .catch(err => console.error("REQUESTS ERROR:", err));

/* =====================
   RENDER REQUESTS
===================== */

function renderRequests(requests) {
  const tbody = document.getElementById("requestsTable");

  if (!tbody) {
    console.error("❌ #requestsTable not found");
    return;
  }

  tbody.innerHTML = "";

  requests.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.student_id || ""}</td>
      <td>${r.message || ""}</td>
      <td>${r.created_at || ""}</td>
      <td>${r.status || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}
