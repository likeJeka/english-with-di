const API_URL =
  "https://script.google.com/macros/s/AKfycbxuUdGX97TR3mcTENaJiIyE6oEVKHsY36u0CwGNpcmzzXWDl4UmTeph69U37eIl4tHU/exec";

const STORAGE_KEY = "diAdminKey";

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const adminKeyInput = document.getElementById("adminKeyInput");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

function getStoredAdminKey() {
  return sessionStorage.getItem(STORAGE_KEY);
}

function saveAdminKey(key) {
  sessionStorage.setItem(STORAGE_KEY, key);
}

function clearAdminKey() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function showLogin(message = "") {
  loginScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
  loginError.textContent = message;
  adminKeyInput.value = "";
  setTimeout(() => adminKeyInput.focus(), 0);
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

async function requestWithKey(action, key, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action,
      admin_key: key,
      ...data,
    }),
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

async function login(key) {
  const cleanKey = String(key || "").trim();

  if (!cleanKey) {
    showLogin("Please enter the admin key.");
    return false;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Checking...";
  loginError.textContent = "";

  try {
    // The server validates the key before the dashboard is shown.
    const result = await requestWithKey("admin_requests", cleanKey);

    saveAdminKey(cleanKey);
    showDashboard();
    document.getElementById("adminStatus").textContent = "";
    renderRequests(result.requests || []);

    return true;
  } catch (error) {
    console.error("Login error:", error);
    clearAdminKey();
    showLogin("Invalid admin key.");
    return false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
}

async function adminRequest(action, data = {}) {
  const key = getStoredAdminKey();

  if (!key) {
    showLogin();
    throw new Error("Admin key is required");
  }

  try {
    return await requestWithKey(action, key, data);
  } catch (error) {
    if (error.message === "Invalid admin key") {
      clearAdminKey();
      showLogin("Your admin session has expired. Please log in again.");
    }
    throw error;
  }
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

  if (!requests.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No student requests yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

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
          await adminRequest("admin_resolve", {
            request_id: request.request_id,
          });
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
  if (dashboard.classList.contains("hidden")) return;

  try {
    const result = await adminRequest("admin_requests");
    document.getElementById("adminStatus").textContent = "";
    renderRequests(result.requests || []);
  } catch (error) {
    console.error("Requests loading error:", error);

    if (getStoredAdminKey()) {
      document.getElementById("adminStatus").textContent =
        "Requests could not be loaded. Check the admin key and Apps Script deployment.";
    }
  }
}

/* LOGIN */
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await login(adminKeyInput.value);
});

/* CHANGE KEY / LOG OUT */
document.getElementById("changeAdminKey").addEventListener("click", () => {
  clearAdminKey();
  document.getElementById("requestsTable").innerHTML = "";
  document.getElementById("adminStatus").textContent = "";
  showLogin();
});

/* SEND REPLY */
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

/* ADD REQUEST */
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

/* INITIALIZATION */
async function initAdmin() {
  const storedKey = getStoredAdminKey();

  if (!storedKey) {
    showLogin();
    return;
  }

  // Re-validate the saved key with the server before showing the dashboard.
  const success = await login(storedKey);

  if (!success) {
    clearAdminKey();
  }
}

initAdmin();

/* AUTO REFRESH */
window.setInterval(() => {
  if (!dashboard.classList.contains("hidden")) {
    loadRequests();
  }
}, 30_000);
