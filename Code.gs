const SPREADSHEET_ID = "1vNVsjibrrxxOcKgllB0kawCdnPIcqdX7kDpWd7q8FDU";
const STUDENTS_SHEET = "students";
const STUDENT_INFO_SHEET = "students_info";
const REQUESTS_SHEET = "requests";
const REPLIES_SHEET = "teacher_messages";
const APP_TIME_ZONE = "Europe/Kyiv";
const BOOKING_SHEET = "booking_forms";

function doGet(e) {
  return handleRequest_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  return handleRequest_(e && e.parameter ? e.parameter : {});
}

function handleRequest_(data) {
  try {
    let result;
    switch (data.action) {
      case "student_dashboard":
        result = getStudentDashboard_(data);
        break;
      case "student_replies":
        result = getStudentReplies_(data);
        break;
      case "student_message":
        result = createStudentMessage_(data);
        break;
      case "booking":
        result = createBooking_(data);
        break;
      case "admin_requests":
        requireAdmin_(data);
        result = { requests: readRecords_(getRequestsSheet_()) };
        break;
      case "admin_resolve":
        requireAdmin_(data);
        result = resolveRequest_(data);
        break;
      case "admin_send_reply":
        requireAdmin_(data);
        result = sendTeacherReply_(data);
        break;
      case "admin_create_request":
        requireAdmin_(data);
        result = appendRequest_(data.student_id, data.message, data.request_type, data.request_date);
        break;
      default:
        throw new Error("Unknown action");
    }
    return json_({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: error.message || "Unknown server error" });
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getRequestsSheet_() {
  const sheet = getSpreadsheet_().getSheetByName(REQUESTS_SHEET);
  if (!sheet) throw new Error(`Sheet "${REQUESTS_SHEET}" was not found`);
  ensureRequestIds_(sheet);
  return sheet;
}

function getRepliesSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(REPLIES_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(REPLIES_SHEET);
    sheet.appendRow(["message_id", "student_id", "message", "created_at"]);
  }
  return sheet;
}

function ensureRequestIds_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  let idColumn = headers.indexOf("request_id") + 1;
  if (!idColumn) {
    idColumn = headers.length + 1;
    sheet.getRange(1, idColumn).setValue("request_id");
  }

  const rowCount = sheet.getLastRow() - 1;
  if (rowCount < 1) return;
  const range = sheet.getRange(2, idColumn, rowCount, 1);
  const ids = range.getDisplayValues();
  let changed = false;
  ids.forEach((row) => {
    if (!row[0]) {
      row[0] = Utilities.getUuid();
      changed = true;
    }
  });
  if (changed) range.setValues(ids);
}

function readRecords_(sheet) {
  if (!sheet) throw new Error("Required sheet was not found");
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values.shift().map(String);

  return values
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = formatCell_(header, row[index]);
      });
      return record;
    });
}

function formatCell_(header, value) {
  if (value instanceof Date) {
    const timeZone = APP_TIME_ZONE;
    if (header === "date" || header === "paid_until") {
      return Utilities.formatDate(value, timeZone, "yyyy-MM-dd");
    }
    return value.toISOString();
  }
  return value === null || value === undefined ? "" : String(value);
}

function findStudent_(studentId) {
  const students = readRecords_(getSpreadsheet_().getSheetByName(STUDENT_INFO_SHEET));
  const student = students.find((item) => item.id === String(studentId));
  if (!student) throw new Error("Student not found");
  return student;
}

function getStudent_(studentId, token) {
  const student = findStudent_(studentId);
  if (!token || student.access_token !== String(token)) {
    throw new Error("Invalid personal link");
  }
  return student;
}

function getStudentDashboard_(data) {
  const student = getStudent_(data.student_id, data.token);
  const lessons = readRecords_(getSpreadsheet_().getSheetByName(STUDENTS_SHEET))
    .filter((lesson) => lesson.student_id === student.id);
  delete student.access_token;
  return { student, lessons };
}

function getStudentReplies_(data) {
  const student = getStudent_(data.student_id, data.token);
  const replies = readRecords_(getRepliesSheet_())
    .filter((reply) => reply.student_id === student.id)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  return { replies };
}

function createStudentMessage_(data) {
  const student = getStudent_(data.student_id, data.token);
  return appendRequest_(student.id, data.message, "Student message", "");
}

function getBookingSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(BOOKING_SHEET);

  const headers = [
    "created_at",
    "name",
    "age",
    "contact",
    "level",
    "goal",
    "format",
    "request_type",
    "teacher",
    "lessons_per_week",
    "preferred_time",
    "experience",
    "skills",
    "wishes",
    "source",
  ];

  if (!sheet) {
    sheet = spreadsheet.insertSheet(BOOKING_SHEET);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  headers.forEach((header) => {
    if (!existing.includes(header)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      existing.push(header);
    }
  });

  return sheet;
}

function createBooking_(data) {
  const clean = {
    name: String(data.name || "").trim(),
    age: String(data.age || "").trim(),
    contact: String(data.contact || "").trim(),
    level: String(data.level || "").trim(),
    goal: String(data.goal || "").trim(),
    format: String(data.format || "").trim(),
    request_type: String(data.request_type || "Not specified").trim() || "Not specified",
    teacher: String(data.teacher || "").trim(),
    lessons_per_week: String(data.lessons_per_week || "").trim(),
    preferred_time: String(data.preferred_time || "").trim(),
    experience: String(data.experience || "").trim(),
    skills: String(data.skills || "").trim(),
    wishes: String(data.wishes || "").trim(),
    source: String(data.source || "").trim(),
  };

  if (clean.name.length < 2 || !clean.contact || !clean.level) {
    throw new Error("Fill in your name, level and contact details");
  }

  const allowedTypes = [
    "Individual lesson",
    "Group lesson",
    "Pair lesson",
    "Not specified",
  ];
  if (!allowedTypes.includes(clean.request_type)) {
    throw new Error("Invalid lesson format");
  }

  if (clean.age && (!/^\d+$/.test(clean.age) || Number(clean.age) < 10 || Number(clean.age) > 100)) {
    throw new Error("Please enter a valid age");
  }

  const sheet = getBookingSheet_();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];

  const values = {
    created_at: Utilities.formatDate(new Date(), APP_TIME_ZONE, "yyyy-MM-dd HH:mm:ss"),
    ...clean,
  };

  const row = headers.map((header) => values[header] !== undefined ? values[header] : "");
  sheet.appendRow(row);

  // Keep a compact notification in the existing requests sheet for the current admin panel.
  const summary = [
    `Level: ${clean.level}`,
    `Contact: ${clean.contact}`,
    `Format: ${clean.format || clean.request_type || "Not specified"}`,
    `Teacher: ${clean.teacher || "Not specified"}`,
    `Lessons/week: ${clean.lessons_per_week || "Not specified"}`,
    `Time: ${clean.preferred_time || "Not specified"}`,
  ].join("; ");

  appendRequest_(`Booking: ${clean.name}`, summary, clean.request_type, "");
  return {};
}

function ensureRequestColumns_(sheet) {
  const requiredColumns = ["student_id", "message", "created_at", "status", "request_id", "request_type", "request_date"];
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];

  requiredColumns.forEach((header) => {
    if (headers.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function appendRequest_(studentId, message, requestType, requestDate) {
  const cleanStudentId = String(studentId || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanType = String(requestType || "").trim();
  const cleanDate = String(requestDate || "").trim();

  if (!cleanStudentId || !cleanMessage || cleanMessage.length > 2000) {
    throw new Error("A valid student id and message are required");
  }
  if (cleanDate && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error("Request date must be in YYYY-MM-DD format");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getRequestsSheet_();
    ensureRequestColumns_(sheet);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const row = new Array(headers.length).fill("");

    const values = {
      student_id: cleanStudentId,
      message: cleanMessage,
      created_at: Utilities.formatDate(new Date(), APP_TIME_ZONE, "yyyy-MM-dd HH:mm:ss"),
      status: "new",
      request_id: Utilities.getUuid(),
      request_type: cleanType,
      request_date: cleanDate,
    };

    headers.forEach((header, index) => {
      if (Object.prototype.hasOwnProperty.call(values, header)) {
        row[index] = values[header];
      }
    });

    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return {};
}

function resolveRequest_(data) {
  const requestId = String(data.request_id || "").trim();
  if (!requestId) throw new Error("Request id is required");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getRequestsSheet_();
    ensureRequestColumns_(sheet);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const idColumn = headers.indexOf("request_id") + 1;
    const statusColumn = headers.indexOf("status") + 1;
    const rowCount = sheet.getLastRow() - 1;
    if (rowCount < 1) throw new Error("Request not found");

    const ids = sheet.getRange(2, idColumn, rowCount, 1).getDisplayValues();
    const index = ids.findIndex((row) => row[0] === requestId);
    if (index === -1) throw new Error("Request not found");

    sheet.getRange(index + 2, statusColumn).setValue("resolved");
  } finally {
    lock.releaseLock();
  }
  return {};
}

function sendTeacherReply_(data) {
  const student = findStudent_(data.student_id);
  const message = String(data.message || "").trim();
  if (!message || message.length > 2000) throw new Error("A valid reply is required");

  getRepliesSheet_().appendRow([
    Utilities.getUuid(),
    student.id,
    message,
    Utilities.formatDate(new Date(), APP_TIME_ZONE, "yyyy-MM-dd HH:mm:ss"),
  ]);
  return {};
}

function requireAdmin_(data) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expectedKey) throw new Error("Set the ADMIN_KEY script property first");
  if (String(data.admin_key || "") !== expectedKey) throw new Error("Invalid admin key");
}

function generateStudentTokens() {
  const sheet = getSpreadsheet_().getSheetByName(STUDENT_INFO_SHEET);
  if (!sheet) throw new Error(`Sheet "${STUDENT_INFO_SHEET}" was not found`);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const idColumn = headers.indexOf("id") + 1;
  let tokenColumn = headers.indexOf("access_token") + 1;
  if (!idColumn) throw new Error('The "id" column is required in students_info');
  if (!tokenColumn) {
    tokenColumn = headers.length + 1;
    sheet.getRange(1, tokenColumn).setValue("access_token");
  }

  const rowCount = sheet.getLastRow() - 1;
  if (rowCount < 1) return;
  const ids = sheet.getRange(2, idColumn, rowCount, 1).getDisplayValues();
  const tokenRange = sheet.getRange(2, tokenColumn, rowCount, 1);
  const tokens = tokenRange.getDisplayValues();
  tokens.forEach((row, index) => {
    if (ids[index][0] && !row[0]) row[0] = Utilities.getUuid();
  });
  tokenRange.setValues(tokens);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
