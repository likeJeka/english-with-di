/* =====================
   REQUESTS CSV
===================== */

// ⚠️ CSV ТОЙ ЖЕ ТАБЛИЦЫ, КУДА ПИШЕТ Apps Script
const REQUESTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?output=csv&gid=928782791";

const RESOLVE_API_URL =
  "https://script.google.com/macros/s/AKfycbxB9_ncsflK8Ni0Py-PYPHz1J3rEPhCUmBFWeCltGea7pkbsX1T6bqeiuWLSShTIm5t/exec";

/* =====================
   CSV → JSON
===================== */

const csvToJson = (text) => {
  const rows = text
    .trim()
    .split("\n")
    .map((r) => r.split(",").map((v) => v.trim()));

  const headers = rows.shift();

  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
};

/* =====================
   LOAD REQUESTS
===================== */

fetch(REQUESTS_URL + "&nocache=" + Date.now())
  .then((r) => r.text())
  .then((csv) => {
    const requests = csvToJson(csv);
    renderRequests(requests);
  })
  .catch((err) => console.error("REQUESTS ERROR:", err));

/* =====================
   RENDER REQUESTS
===================== */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderRequests(requests) {
  const tbody = document.getElementById("requestsTable");
  tbody.innerHTML = "";

  requests
    .filter((r) => r.status !== "resolved")
    .forEach((r) => {
      const tr = document.createElement("tr");

      const isNew = r.status === "new";
      if (isNew) tr.classList.add("new");

      tr.innerHTML = `
        <td>${r.student_id || ""}</td>
        <td>${r.message || ""}</td>
        <td>${formatDate(r.created_at)}</td>
        <td>
          <span class="status ${isNew ? "status-new" : "status-resolved"}">
            ${r.status || ""}
          </span>
        </td>
        <td>
          ${
            isNew
              ? `<button class="resolve-btn" title="Resolved">✔</button>`
              : ""
          }
        </td>
      `;

      if (isNew) {
        tr.querySelector(".resolve-btn").addEventListener("click", async () => {
          try {
            const formData = new URLSearchParams();
            formData.append("action", "resolve");
            formData.append("created_at", r.created_at);

            await fetch(RESOLVE_API_URL, {
              method: "POST",
              body: formData,
            });

            tr.remove();
          } catch (err) {
            console.error("Resolve error:", err);
            alert("Failed to resolve request");
          }
        });
      }

      tbody.appendChild(tr);
    });
}
