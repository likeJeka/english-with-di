/* =====================
   GET STUDENT ID
===================== */

const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

if (!studentId) {
  document.body.innerHTML =
    '<p style="padding:40px">Your teacher will send you a personal dashboard link.</p>';
  throw new Error("No student id");
}

/* =====================
   GOOGLE SHEETS (READ)
   ⚠️ CSV links ONLY from "Publish to web"
===================== */

// lessons (schedule)
const LESSONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?gid=0&single=true&output=csv";

// students_info
const STUDENTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?gid=1020253581&single=true&output=csv";

/* =====================
   REQUEST API (WRITE)
===================== */

const REQUEST_API_URL = "https://script.google.com/macros/s/AKfycbxB9_ncsflK8Ni0Py-PYPHz1J3rEPhCUmBFWeCltGea7pkbsX1T6bqeiuWLSShTIm5t/exec";


/* =====================
   CSV → JSON
===================== */

function csvToJson(text) {
  const rows = text
    .trim()
    .split("\n")
    .map((r) => r.split(",").map((v) => v.trim()));
  const headers = rows.shift();
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

/* =====================
   SEND MESSAGE
===================== */

const sendBtn = document.getElementById("sendRequestBtn");

if (sendBtn) {
  sendBtn.onclick = async () => {
    const text = document.getElementById("requestText").value.trim();
    const status = document.getElementById("requestStatus");

    if (!text) {
      alert("Please write a message");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      const formData = new URLSearchParams();
      formData.append("student_id", studentId);
      formData.append("message", text);
      formData.append("created_at", new Date().toISOString());

const res = await fetch(REQUEST_API_URL, { method: "POST", body: formData });
const txt = await res.text();
console.log("API:", txt);


      document.getElementById("requestText").value = "";
      status.textContent = "Message sent ✅";
      status.classList.remove("hidden");
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send message");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send message";
    }
  };
}

/* =====================
   LOAD DATA
===================== */

Promise.all([
  fetch(STUDENTS_URL).then((r) => r.text()),
  fetch(LESSONS_URL).then((r) => r.text()),
])
  .then(([studentsCSV, lessonsCSV]) => {
    const students = csvToJson(studentsCSV);
    const lessons = csvToJson(lessonsCSV);

    console.log("STUDENTS:", students);
    console.log("LESSONS:", lessons);
    console.log("STUDENT ID:", studentId);

    const student = students.find((s) => s.id === studentId);

    const studentLessons = lessons.filter((l) => l.student_id === studentId);

    if (!student) {
      document.body.innerHTML = '<p style="padding:40px">Student not found</p>';
      return;
    }

    render(student, studentLessons);
  })
  .catch((err) => {
    console.error("LOAD ERROR:", err);
    document.body.innerHTML = '<p style="padding:40px">Failed to load data</p>';
  });

/* =====================
   RENDER
===================== */

function render(student, lessons) {
  document.getElementById("greeting").textContent = `Hey, ${student.name} ⭐`;

  const today = new Date().toISOString().slice(0, 10);

  lessons.sort((a, b) => a.date.localeCompare(b.date));

  // TODAY BOX
  const todayLesson = lessons.find((l) => l.date === today);
  if (todayLesson) {
    const box = document.getElementById("todayBox");
    box.textContent = `You have a lesson today at ${todayLesson.time}.`;
    box.classList.remove("hidden");
  }

  // TABLE
  const tbody = document.getElementById("scheduleTable");
  tbody.innerHTML = "";

  lessons.forEach((l) => {
    const tr = document.createElement("tr");

    if (l.date < today) tr.classList.add("past");
    if (l.date > today && !tbody.querySelector(".next"))
      tr.classList.add("next");

    tr.innerHTML = `
      <td>${l.date}</td>
      <td>${l.day}</td>
      <td>${l.time}</td>
    `;
    tbody.appendChild(tr);
  });

  // PAYMENT
  const price = Number(student.price || 0);

  document.getElementById("lessonsCount").textContent = lessons.length;
  document.getElementById("pricePerLesson").textContent =
    `${price} ${student.currency || ""}`;
  document.getElementById("totalPay").textContent =
    `${price * lessons.length} ${student.currency || ""}`;

  // PAYMENT STATUS
  const paidUntil = student.paid_until;
  const statusEl = document.getElementById("paymentStatus");

  if (paidUntil && paidUntil < today) {
    statusEl.textContent = "Payment overdue";
    statusEl.style.color = "#dc2626";
  } else if (paidUntil) {
    statusEl.textContent = `Paid until ${paidUntil}`;
    statusEl.style.color = "#16a34a";
  } else {
    statusEl.textContent = "Payment status unknown";
    statusEl.style.color = "#64748b";
  }
}
