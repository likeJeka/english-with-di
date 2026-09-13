const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");
const accessToken = params.get("token");

const API_URL =
  "https://script.google.com/macros/s/AKfycbxuUdGX97TR3mcTENaJiIyE6oEVKHsY36u0CwGNpcmzzXWDl4UmTeph69U37eIl4tHU/exec";

if (!studentId || !accessToken) {
  document.body.innerHTML =
    '<p style="padding:40px">Use the personal link sent by your teacher.</p>';
  throw new Error("Missing student id or access token");
}

async function apiRequest(action, data = {}, method = "GET") {
  let response;
  if (method === "GET") {
    response = await fetch(`${API_URL}?${new URLSearchParams({ action, ...data })}`);
  } else {
    response = await fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({ action, ...data }),
    });
  }

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

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB");
}

function renderReplies(replies) {
  const list = document.getElementById("repliesList");
  const empty = document.getElementById("repliesEmpty");
  list.innerHTML = "";
  empty.classList.toggle("hidden", replies.length > 0);

  replies.forEach((reply) => {
    const item = document.createElement("article");
    item.className = "reply";
    const message = document.createElement("p");
    message.textContent = reply.message || "";
    const timestamp = document.createElement("time");
    timestamp.textContent = formatDateTime(reply.created_at || "");
    item.append(message, timestamp);
    list.appendChild(item);
  });
}

async function loadReplies() {
  try {
    const result = await apiRequest("student_replies", {
      student_id: studentId,
      token: accessToken,
    });
    renderReplies(result.replies || []);
  } catch (error) {
    console.error("Replies loading error:", error);
  }
}

function render(student, lessons) {
  document.getElementById("greeting").textContent = `Hey, ${student.name} ⭐`;
  const today = localDate();
  const sortedLessons = [...lessons].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  const todayLesson = sortedLessons.find((lesson) => lesson.date === today);
  if (todayLesson) {
    const box = document.getElementById("todayBox");
    box.textContent = `You have a lesson today at ${todayLesson.time}.`;
    box.classList.remove("hidden");
  }

  const tbody = document.getElementById("scheduleTable");
  tbody.innerHTML = "";
  sortedLessons.forEach((lesson) => {
    const row = document.createElement("tr");
    if (lesson.date < today) row.classList.add("past");
    if (lesson.date > today && !tbody.querySelector(".next")) row.classList.add("next");

    [lesson.date, lesson.day, lesson.time].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value || "";
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });

  const price = Number(student.price || 0);
  const monthlyLessons = sortedLessons.filter((lesson) =>
    String(lesson.date || "").startsWith(today.slice(0, 7)),
  );
  document.getElementById("lessonsCount").textContent = monthlyLessons.length;
  document.getElementById("pricePerLesson").textContent = `${price} ${student.currency || ""}`;
  document.getElementById("totalPay").textContent =
    `${price * monthlyLessons.length} ${student.currency || ""}`;

  const status = document.getElementById("paymentStatus");
  if (student.paid_until && student.paid_until < today) {
    status.textContent = "Payment overdue";
    status.style.color = "#dc2626";
  } else if (student.paid_until) {
    status.textContent = `Paid until ${student.paid_until}`;
    status.style.color = "#16a34a";
  } else {
    status.textContent = "Payment status unknown";
    status.style.color = "#64748b";
  }
}

async function loadDashboard() {
  try {
    const result = await apiRequest("student_dashboard", {
      student_id: studentId,
      token: accessToken,
    });
    render(result.student, result.lessons || []);
    await loadReplies();
  } catch (error) {
    console.error("Dashboard loading error:", error);
    document.body.innerHTML =
      '<p style="padding:40px">This personal link is invalid or has expired.</p>';
  }
}

const sendButton = document.getElementById("sendRequestBtn");
sendButton.addEventListener("click", async () => {
  const input = document.getElementById("requestText");
  const status = document.getElementById("requestStatus");
  const message = input.value.trim();
  if (!message) {
    status.textContent = "Please write a message.";
    status.classList.remove("hidden");
    return;
  }

  sendButton.disabled = true;
  sendButton.textContent = "Sending...";
  try {
    await apiRequest(
      "student_message",
      { student_id: studentId, token: accessToken, message },
      "POST",
    );
    input.value = "";
    status.textContent = "Message sent ✅";
  } catch (error) {
    console.error("Message sending error:", error);
    status.textContent = "The message was not sent. Please try again.";
  } finally {
    status.classList.remove("hidden");
    sendButton.disabled = false;
    sendButton.textContent = "Send message";
  }
});

loadDashboard();
window.setInterval(loadReplies, 30_000);
