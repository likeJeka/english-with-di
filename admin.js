const API_URL =
  "https://script.google.com/macros/s/AKfycbxuUdGX97TR3mcTENaJiIyE6oEVKHsY36u0CwGNpcmzzXWDl4UmTeph69U37eIl4tHU/exec";

function getAdminKey() {
  let key = sessionStorage.getItem("diAdminKey");
  if (!key) {
    key = window.prompt("Enter the admin key:")?.trim();
    if (key) sessionStorage.setItem("diAdminKey", key);
  }
  if (!key) throw new Error("Admin key is required");
  return key;
}

async function adminRequest(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action, admin_key: getAdminKey(), ...data }),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response");
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Server error: ${response.status}`);
  }
  return result;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "" : date.toLocaleString("en-GB");
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

function renderRequests(requests) {
  const tbody = document.getElementById("requestsTable");
  tbody.innerHTML = "";
  requests.forEach((request) => {
    const row = document.createElement("tr");
    const isNew = request.status === "new";
    if (isNew) row.classList.add("new");
    addCell(row, request.student_id);
    addCell(row, request.message);
    addCell(row, formatDate(request.created_at));

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `status ${isNew ? "status-new" : "status-resolved"}`;
    status.textContent = request.status || "";
    statusCell.appendChild(status);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    if (isNew) {
      const button = document.createElement("button");
      button.className = "resolve-btn";
      button.type = "button";
      button.title = "Mark as resolved";
      button.textContent = "✔";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await adminRequest("admin_resolve", { request_id: request.request_id });
          await loadRequests();
        } catch (error) {
          console.error("Resolve error:", error);
          alert("The request could not be resolved.");
          button.disabled = false;
        }
      });
      actionCell.appendChild(button);
    }
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

async function loadRequests() {
  try {
    const result = await adminRequest("admin_requests");
    document.getElementById("adminStatus").textContent = "";
    renderRequests(result.requests || []);
  } catch (error) {
    console.error("Requests loading error:", error);
    document.getElementById("adminStatus").textContent =
      "Requests could not be loaded. Check the admin key and Apps Script deployment.";
  }
}

document.getElementById("changeAdminKey").addEventListener("click", () => {
  sessionStorage.removeItem("diAdminKey");
  loadRequests();
});

document.getElementById("sendReply").addEventListener("click", async () => {
  const studentInput = document.getElementById("replyStudent");
  const messageInput = document.getElementById("replyMessage");
  const student = studentInput.value.trim();
  const message = messageInput.value.trim();
  if (!student || !message) return alert("Enter a student id and a message.");

  const button = document.getElementById("sendReply");
  button.disabled = true;
  button.textContent = "Sending...";
  try {
    await adminRequest("admin_send_reply", { student_id: student, message });
    studentInput.value = "";
    messageInput.value = "";
    alert("Reply sent.");
  } catch (error) {
    console.error("Reply error:", error);
    alert("The reply could not be sent.");
  } finally {
    button.disabled = false;
    button.textContent = "Send reply";
  }
});

document.getElementById("addRequest").addEventListener("click", async () => {
  const student = document.getElementById("reqStudent").value.trim();
  const type = document.getElementById("reqType").value;
  const comment = document.getElementById("reqComment").value.trim();
  if (!student) return alert("Enter the student name or id.");

  const button = document.getElementById("addRequest");
  button.disabled = true;
  button.textContent = "Adding...";
  try {
    await adminRequest("admin_create_request", {
      student_id: student,
      message: `${type}${comment ? `: ${comment}` : ""}`,
    });
    document.getElementById("reqStudent").value = "";
    document.getElementById("reqComment").value = "";
    await loadRequests();
  } catch (error) {
    console.error("Add request error:", error);
    alert("The request could not be added.");
  } finally {
    button.disabled = false;
    button.textContent = "Add";
  }
});

loadRequests();
window.setInterval(loadRequests, 30_000);
