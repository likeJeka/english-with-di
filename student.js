const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

if (!studentId) {
  document.body.innerHTML =
    '<p style="padding:40px">Your teacher will send you a personal dashboard link.</p>';
  throw new Error("No id");
}

// CSV URLs

// lessons (расписание)
const LESSONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?gid=0&single=true&output=csv";

// students_info (цены, имя)
const STUDENTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKh8UhQOSw8u-nDvvyxZ0xpceiLisPvanrPhby6R6f_xFIazLbv4vJw-LtvVPpdknvtMDmhpdCvy8A/pub?gid=1020253581&single=true&output=csv";

// Google Form
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfAVMp3g6V72YFEpomaNk2nzgILxmRvAte03Bu74kRB-AwidQ/viewform";

document.getElementById("rescheduleBtn").onclick = () =>
  window.open(
    `${FORM_URL}?entry.318781198=${studentId}&entry.2129731229=Reschedule`,
    "_blank",
  );

document.getElementById("cancelBtn").onclick = () =>
  window.open(
    `${FORM_URL}?entry.318781198=${studentId}&entry.2129731229=Cancel`,
    "_blank",
  );

// helper
const csvToJson = (text) => {
  const rows = text
    .trim()
    .split("\n")
    .map((r) => r.split(",").map((v) => v.trim()));
  const headers = rows.shift();
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
};

Promise.all([
  fetch(STUDENTS_URL).then((r) => r.text()),
  fetch(LESSONS_URL).then((r) => r.text()),
]).then(([studentsCSV, lessonsCSV]) => {
  const students = csvToJson(studentsCSV);
  const lessons = csvToJson(lessonsCSV);

  const student = students.find((s) => s.id === studentId);
  const studentLessons = lessons.filter((l) => l.student_id === studentId);

  if (!student) {
    document.body.innerHTML = '<p style="padding:40px">Student not found</p>';
    return;
  }

  render(student, studentLessons);
});

function render(student, lessons) {
  document.getElementById('greeting').textContent =
    `Hi, ${student.name} 👋`;

  const today = new Date().toISOString().slice(0, 10);

  // сортируем по дате
  lessons.sort((a, b) => a.date.localeCompare(b.date));

  // TODAY
  const todayLesson = lessons.find(l => l.date === today);
  if (todayLesson) {
    const box = document.getElementById('todayBox');
    box.textContent = `You have a lesson today at ${todayLesson.time}. Don’t forget!`;
    box.classList.remove('hidden');
  }

  // TABLE
  const tbody = document.getElementById('scheduleTable');
  tbody.innerHTML = '';

  lessons.forEach(l => {
    const tr = document.createElement('tr');

    if (l.date < today) tr.classList.add('past');
    if (l.date > today && !tbody.querySelector('.next'))
      tr.classList.add('next');

    tr.innerHTML = `
      <td>${l.date}</td>
      <td>${l.day}</td>
      <td>${l.time}</td>
    `;
    tbody.appendChild(tr);
  });

  // PAYMENT
  const price = Number(student.price);
  document.getElementById('lessonsCount').textContent = lessons.length;
  document.getElementById('pricePerLesson').textContent =
    `${price} ${student.currency}`;
  document.getElementById('totalPay').textContent =
    `${price * lessons.length} ${student.currency}`;
    // PAYMENT STATUS
const paidUntil = student.paid_until;
const statusEl = document.getElementById('paymentStatus');

if (paidUntil && paidUntil < today) {
  statusEl.textContent = 'Payment overdue';
  statusEl.style.color = '#dc2626';
} else if (paidUntil) {
  statusEl.textContent = `Paid until ${paidUntil}`;
  statusEl.style.color = '#16a34a';
} else {
  statusEl.textContent = 'Payment status unknown';
  statusEl.style.color = '#64748b';
}

}
