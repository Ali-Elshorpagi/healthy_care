const API_BASE = 'http://localhost:8877';
const APPOINTMENTS_API_BASE = 'http://localhost:8876';
const MEDICAL_RECORDS_API_BASE = 'http://localhost:8875';
const FAQS_API_BASE = 'http://localhost:8872';

let currentAdminUser = null;
let editingUserId = null;

// User management state
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let sortColumn = 'createdAt';
let sortDirection = 'desc';
let searchQuery = '';

if (typeof loadHeader === 'function') {
  loadHeader({
    path: '../../../shared/header.html',
    targetId: 'header-slot',
  });
}

if (typeof loadFooter === 'function') {
  loadFooter({
    path: '../../footer.html',
    targetId: 'footer-slot',
  });
}

function formatDate(value) {
  try {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return '—';
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

// ============================================
// CASCADING DELETE BUSINESS LOGIC
// ============================================

async function getAppointmentsByPatientId(patientId) {
  try {
    let appointments = await fetchJson(
      `${APPOINTMENTS_API_BASE}/appointments?patientId=${encodeURIComponent(
        patientId
      )}`
    );
    return Array.isArray(appointments) ? appointments : [];
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return [];
  }
}

async function getAppointmentsByDoctorId(doctorId) {
  try {
    let appointments = await fetchJson(
      `${APPOINTMENTS_API_BASE}/appointments?doctorId=${encodeURIComponent(
        doctorId
      )}`
    );
    return Array.isArray(appointments) ? appointments : [];
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return [];
  }
}

async function getMedicalRecordsByPatientId(patientId) {
  try {
    let records = await fetchJson(
      `${MEDICAL_RECORDS_API_BASE}/records?patientId=${encodeURIComponent(
        patientId
      )}`
    );
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    return [];
  }
}

async function getMedicalRecordsByDoctorId(doctorId) {
  try {
    let records = await fetchJson(
      `${MEDICAL_RECORDS_API_BASE}/records?doctorId=${encodeURIComponent(
        doctorId
      )}`
    );
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Error fetching doctor medical records:', error);
    return [];
  }
}

async function softDeleteAppointmentById(appointmentId) {
  try {
    await fetch(
      `${APPOINTMENTS_API_BASE}/appointments/${encodeURIComponent(
        appointmentId
      )}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        }),
      }
    );
    return true;
  } catch (error) {
    console.error('Error soft deleting appointment:', error);
    return false;
  }
}

async function softDeleteMedicalRecordById(recordId) {
  try {
    await fetch(
      `${MEDICAL_RECORDS_API_BASE}/records/${encodeURIComponent(recordId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        }),
      }
    );
    return true;
  } catch (error) {
    console.error('Error soft deleting medical record:', error);
    return false;
  }
}

async function cascadeDeletePatient(patientId) {
  let deletedAppointments = 0;
  let deletedRecords = 0;

  // Soft delete all patient's appointments
  let appointments = await getAppointmentsByPatientId(patientId);
  for (let apt of appointments) {
    if (!apt.isDeleted && (await softDeleteAppointmentById(apt.id))) {
      deletedAppointments++;
    }
  }

  // Soft delete all patient's medical records
  let records = await getMedicalRecordsByPatientId(patientId);
  for (let record of records) {
    if (!record.isDeleted && (await softDeleteMedicalRecordById(record.id))) {
      deletedRecords++;
    }
  }

  return { deletedAppointments, deletedRecords };
}

async function cascadeDeleteDoctor(doctorId) {
  let cancelledAppointments = 0;
  let deletedRecords = 0;

  // Soft delete all doctor's appointments
  let appointments = await getAppointmentsByDoctorId(doctorId);
  for (let apt of appointments) {
    if (!apt.isDeleted && (await softDeleteAppointmentById(apt.id))) {
      cancelledAppointments++;
    }
  }

  // Soft delete all medical records created by this doctor
  let records = await getMedicalRecordsByDoctorId(doctorId);
  for (let record of records) {
    if (!record.isDeleted && (await softDeleteMedicalRecordById(record.id))) {
      deletedRecords++;
    }
  }

  return { cancelledAppointments, deletedRecords };
}

async function deleteUserWithCascade(user) {
  let result = { success: false, message: '' };

  try {
    let cascadeResult = {
      deletedAppointments: 0,
      deletedRecords: 0,
      cancelledAppointments: 0,
    };

    // Handle cascade based on user role
    if (user.role === 'patient') {
      cascadeResult = await cascadeDeletePatient(user.id);
      result.message = `Patient deleted. Also archived ${cascadeResult.deletedAppointments} appointment(s) and ${cascadeResult.deletedRecords} medical record(s).`;
    } else if (user.role === 'doctor') {
      cascadeResult = await cascadeDeleteDoctor(user.id);
      result.message = `Doctor deleted. Also archived ${cascadeResult.cancelledAppointments} appointment(s) and ${cascadeResult.deletedRecords} medical record(s).`;
    } else {
      result.message = 'User deleted successfully.';
    }

    // Finally delete the user
    let deleteResponse = await fetch(
      `${API_BASE}/users/${encodeURIComponent(user.id)}`,
      { method: 'DELETE' }
    );

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete user from database');
    }

    result.success = true;
  } catch (error) {
    console.error('Error in cascade delete:', error);
    result.message = 'Failed to delete user. Please try again.';
    result.success = false;
  }

  return result;
}

// ============================================

async function getAuthedEmailAndPassword() {
  const sessionEmail = sessionStorage.getItem('email');
  const sessionPassword = sessionStorage.getItem('password');

  if (sessionEmail && sessionPassword) {
    const valid = await checkPassword(sessionEmail, sessionPassword);
    if (valid) return { email: sessionEmail, password: sessionPassword };
    clearSession();
  }

  const cookieEmail = getCookie('email');
  const cookiePassword = getCookie('password');

  if (cookieEmail && cookiePassword) {
    const valid = await checkPassword(cookieEmail, cookiePassword);
    if (valid) return { email: cookieEmail, password: cookiePassword };
    clearCookies();
  }

  return null;
}

async function getUserByEmail(email) {
  const users = await fetchJson(
    `${API_BASE}/users?email=${encodeURIComponent(email)}`
  );
  return Array.isArray(users) && users.length ? users[0] : null;
}

async function getAllUsers() {
  const users = await fetchJson(`${API_BASE}/users`);
  return Array.isArray(users) ? users : [];
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderStats(users) {
  const patients = users.filter((u) => u.role === 'patient').length;
  const doctors = users.filter((u) => u.role === 'doctor').length;
  const pending = users.filter(
    (u) => u.role === 'doctor' && u.approved === 'pending'
  ).length;
  const admins = users.filter((u) => u.role === 'admin').length;

  setText('stat-patients', String(patients));
  setText('stat-doctors', String(doctors));
  setText('stat-pending', String(pending));
  setText('stat-admins', String(admins));
}

function setDonutChart(donutId, legendId, items) {
  const donut = document.getElementById(donutId);
  const legend = document.getElementById(legendId);
  if (!donut || !legend) return;

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    donut.style.background = 'conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)';
    legend.innerHTML = `<div class="muted">No data.</div>`;
    return;
  }

  let current = 0;
  const slices = items
    .filter((i) => i.value > 0)
    .map((i) => {
      const start = current;
      const angle = (i.value / total) * 360;
      current += angle;
      return { ...i, start, end: current };
    });

  // Fill any rounding remainder with the last color, but keep it stable.
  if (slices.length && current < 360) {
    slices[slices.length - 1].end = 360;
  }

  const gradientParts = slices.map(
    (s) => `${s.color} ${s.start}deg ${s.end}deg`
  );
  // Background (if all items are 0, handled above)
  donut.style.background = `conic-gradient(${gradientParts.join(', ')})`;

  const aria = slices.map((s) => `${s.label}: ${s.value}`).join(', ');
  donut.setAttribute('aria-label', aria || 'Chart');

  legend.innerHTML = '';
  items.forEach((item) => {
    const percent = Math.round((item.value / total) * 100);

    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
            <div class="legend-left">
                <span class="legend-dot" style="background:${item.color}"></span>
                <span class="legend-label">${item.label}</span>
            </div>
            <div class="legend-value">${item.value} (${percent}%)</div>
        `;
    legend.appendChild(row);
  });
}

function renderDonutCharts(users) {
  const patients = users.filter((u) => u.role === 'patient').length;
  const doctors = users.filter((u) => u.role === 'doctor').length;
  const admins = users.filter((u) => u.role === 'admin').length;

  const pendingDoctors = users.filter(
    (u) => u.role === 'doctor' && u.approved === 'pending'
  ).length;
  const approvedDoctors = users.filter(
    (u) => u.role === 'doctor' && u.approved === 'approved'
  ).length;

  // Use existing palette from the project
  const BLUE = '#2563eb';
  const DARK = '#111827';
  const GRAY = '#94a3b8';

  setDonutChart('donut-roles', 'legend-roles', [
    { label: 'Patients', value: patients, color: BLUE },
    { label: 'Doctors', value: doctors, color: DARK },
    { label: 'Admins', value: admins, color: GRAY },
  ]);

  setDonutChart('donut-doctors', 'legend-doctors', [
    { label: 'Approved', value: approvedDoctors, color: BLUE },
    { label: 'Pending', value: pendingDoctors, color: DARK },
  ]);
}

function renderPendingDoctors(users) {
  const tbody = document.getElementById('pending-doctors-body');
  if (!tbody) return;

  const pendingDoctors = users.filter(
    (u) => u.role === 'doctor' && u.approved === 'pending'
  );

  if (pendingDoctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No pending requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';

  pendingDoctors.forEach((doctor) => {
    const row = document.createElement('tr');

    const name = doctor.fullName || '—';
    const email = doctor.email || '—';
    const specialization = doctor.specialization || '—';
    const license = doctor.medicalLicenseNo || '—';
    const createdAt = formatDate(doctor.createdAt);

    row.innerHTML = `
            <td>${name}</td>
            <td>${email}</td>
            <td>${specialization}</td>
            <td>${license}</td>
            <td>${createdAt}</td>
            <td>
                <div class="actions">
                    <button class="action-btn" data-action="approve" type="button">Approve</button>
                    <button class="action-btn danger" data-action="reject" type="button">Reject</button>
                </div>
            </td>
        `;

    const approveBtn = row.querySelector("button[data-action='approve']");
    const rejectBtn = row.querySelector("button[data-action='reject']");

    approveBtn.addEventListener('click', async () => {
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      approveBtn.textContent = 'Approving…';

      try {
        await fetchJson(`${API_BASE}/users/${encodeURIComponent(doctor.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: 'approved' }),
        });

        approveBtn.textContent = 'Approved';
        await refreshData();
      } catch (e) {
        console.error(e);
        alert(
          'Failed to approve doctor. Make sure json-server is running and supports PATCH.'
        );
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
        approveBtn.textContent = 'Approve';
      }
    });

    rejectBtn.addEventListener('click', async () => {
      if (!confirm('Reject this doctor request? This will delete the user.'))
        return;

      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      rejectBtn.textContent = 'Deleting…';

      try {
        await fetchJson(`${API_BASE}/users/${encodeURIComponent(doctor.id)}`, {
          method: 'DELETE',
        });
        await refreshData();
      } catch (e) {
        console.error(e);
        alert(
          'Failed to delete user. Make sure json-server is running and supports DELETE.'
        );
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
        rejectBtn.textContent = 'Reject';
      }
    });

    tbody.appendChild(row);
  });
}

function getStatusPill(user) {
  if (user.role === 'doctor') {
    if (user.approved === 'approved')
      return `<span class="pill ok">Approved</span>`;
    if (user.approved === 'pending')
      return `<span class="pill warn">Pending</span>`;
  }
  return `<span class="pill">—</span>`;
}

async function getAllFAQs() {
  try {
    let faqs = await fetchJson(`${FAQS_API_BASE}/faqs`);
    return Array.isArray(faqs) ? faqs : [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

function renderFAQsManagement(faqs) {
  let tbody = document.getElementById('faqs-body');
  if (!tbody) return;

  if (!Array.isArray(faqs) || faqs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No FAQs submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';

  faqs.forEach((faq) => {
    let row = document.createElement('tr');
    let isEditing = editingUserId === `faq-${faq.id}`;
    let hasAnswer = faq.answer && faq.answer.trim();
    let statusPill = hasAnswer
      ? `<span class="pill ok">Answered</span>`
      : `<span class="pill warn">Pending</span>`;
    let createdDate = formatDate(faq.createdAt);

    if (!isEditing) {
      row.innerHTML = `
                <td>${faq.userId || '—'}</td>
                <td style="max-width: 300px;">${faq.question || '—'}</td>
                <td style="max-width: 250px;">${faq.answer || '—'}</td>
                <td>${statusPill}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" data-action="edit-faq" type="button">Edit</button>
                        <button class="action-btn danger" data-action="delete-faq" type="button">Delete</button>
                    </div>
                </td>
            `;

      row
        .querySelector("button[data-action='edit-faq']")
        .addEventListener('click', () => {
          editingUserId = `faq-${faq.id}`;
          renderFAQsManagement(faqs);
        });

      row
        .querySelector("button[data-action='delete-faq']")
        .addEventListener('click', async () => {
          if (!confirm('Delete this FAQ?')) return;
          try {
            await fetchJson(`${FAQS_API_BASE}/faqs/${encodeURIComponent(faq.id)}`, {
              method: 'DELETE',
            });
            await refreshData();
          } catch (e) {
            console.error(e);
            alert('Failed to delete FAQ.');
          }
        });
    } else {
      let questionEsc = (faq.question || '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      let answerEsc = (faq.answer || '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      row.innerHTML = `
                <td>${faq.userId || '—'}</td>
                <td><textarea id="edit-question-${
                  faq.id
                }" rows="3">${questionEsc}</textarea></td>
                <td><textarea id="edit-answer-${
                  faq.id
                }" rows="3" placeholder="Enter answer...">${answerEsc}</textarea></td>
                <td>${statusPill}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" data-action="save-faq" type="button">Save</button>
                        <button class="action-btn secondary" data-action="cancel-faq" type="button">Cancel</button>
                    </div>
                </td>
            `;

      row
        .querySelector("button[data-action='cancel-faq']")
        .addEventListener('click', () => {
          editingUserId = null;
          renderFAQsManagement(faqs);
        });

      row
        .querySelector("button[data-action='save-faq']")
        .addEventListener('click', async () => {
          let question = document
            .getElementById(`edit-question-${faq.id}`)
            .value.trim();
          let answer = document
            .getElementById(`edit-answer-${faq.id}`)
            .value.trim();

          if (!question) {
            alert('Question cannot be empty');
            return;
          }

          try {
            await fetchJson(`${FAQS_API_BASE}/faqs/${encodeURIComponent(faq.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question, answer }),
            });
            editingUserId = null;
            await refreshData();
          } catch (e) {
            console.error(e);
            alert('Failed to save FAQ.');
          }
        });
    }

    tbody.appendChild(row);
  });
}

function renderUsersManagement(users) {
  const tbody = document.getElementById('users-body');
  if (!tbody) return;

  if (!Array.isArray(users) || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No users.</td></tr>`;
    updatePaginationControls(0);
    return;
  }

  // Calculate pagination
  let startIndex = (currentPage - 1) * usersPerPage;
  let endIndex = startIndex + usersPerPage;
  let paginatedUsers = users.slice(startIndex, endIndex);

  tbody.innerHTML = '';

  if (paginatedUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No users found.</td></tr>`;
    updatePaginationControls(users.length);
    return;
  }

  paginatedUsers.forEach((user) => {
    const row = document.createElement('tr');
    const isEditing = editingUserId === user.id;
    const createdAt = formatDate(user.createdAt);

    const canDelete = !(
      currentAdminUser &&
      (user.id === currentAdminUser.id || user.email === currentAdminUser.email)
    );

    if (!isEditing) {
      row.innerHTML = `
                <td>${user.fullName || '—'}</td>
                <td>${user.email || '—'}</td>
                <td>${user.role || '—'}</td>
                <td>${getStatusPill(user)}</td>
                <td>${createdAt}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn secondary" data-action="edit" type="button">Edit</button>
                        <button class="action-btn danger" data-action="delete" type="button" ${
                          canDelete ? '' : 'disabled'
                        }>Delete</button>
                    </div>
                </td>
            `;

      row
        .querySelector("button[data-action='edit']")
        .addEventListener('click', () => {
          editingUserId = user.id;
          renderUsersManagement(users);
        });

      row
        .querySelector("button[data-action='delete']")
        .addEventListener('click', async () => {
          if (!canDelete) return;

          // Build confirmation message based on role
          let confirmMessage = `Delete user ${user.email || user.id}?`;
          if (user.role === 'patient') {
            confirmMessage +=
              '\n\nThis will also ARCHIVE all their appointments and medical records (they will be hidden from users but kept in the system).';
          } else if (user.role === 'doctor') {
            confirmMessage +=
              '\n\nThis will also ARCHIVE all their appointments and medical records they created (they will be hidden from users but kept in the system).';
          }

          if (!confirm(confirmMessage)) return;

          try {
            // Use cascading delete with business logic
            let result = await deleteUserWithCascade(user);

            if (result.success) {
              alert(result.message);
              editingUserId = null;
              await refreshData();
            } else {
              alert(result.message);
            }
          } catch (e) {
            console.error(e);
            alert(
              'Failed to delete user. Make sure json-server is running and supports DELETE.'
            );
          }
        });

      tbody.appendChild(row);
      return;
    }

    const role = user.role || 'patient';
    const isDoctor = role === 'doctor';
    const isApproved = user.approved === 'approved';
    const approvedValue =
      user.approved === 'approved'
        ? 'approved'
        : user.approved === 'pending'
        ? 'pending'
        : '';

    row.innerHTML = `
            <td><input id="edit-name-${user.id}" value="${(
      user.fullName || ''
    ).replace(/"/g, '&quot;')}" placeholder="Full name" /></td>
            <td><input id="edit-email-${user.id}" value="${(
      user.email || ''
    ).replace(/"/g, '&quot;')}" placeholder="Email" /></td>
            <td>
                <select id="edit-role-${user.id}">
                    <option value="patient" ${
                      role === 'patient' ? 'selected' : ''
                    }>patient</option>
                    <option value="doctor" ${
                      role === 'doctor' ? 'selected' : ''
                    }>doctor</option>
                    <option value="admin" ${
                      role === 'admin' ? 'selected' : ''
                    }>admin</option>
                </select>
            </td>
            <td>
                <select id="edit-approved-${user.id}" ${
      isDoctor && !isApproved ? '' : 'disabled'
    }>
                    <option value="" ${
                      approvedValue === '' ? 'selected' : ''
                    }>—</option>
                    <option value="approved" ${
                      approvedValue === 'approved' ? 'selected' : ''
                    }>Approved</option>
                    <option value="pending" ${
                      approvedValue === 'pending' ? 'selected' : ''
                    }>Pending</option>
                </select>
            </td>
            <td>${createdAt}</td>
            <td>
                <div class="actions">
                    <button class="action-btn" data-action="save" type="button">Save</button>
                    <button class="action-btn secondary" data-action="cancel" type="button">Cancel</button>
                </div>
            </td>
        `;

    const roleSelect = row.querySelector(
      `#edit-role-${CSS.escape(String(user.id))}`
    );
    const approvedSelect = row.querySelector(
      `#edit-approved-${CSS.escape(String(user.id))}`
    );

    roleSelect.addEventListener('change', () => {
      const isDoc = roleSelect.value === 'doctor';
      // Disable if not a doctor, or if doctor is already approved
      approvedSelect.disabled = !isDoc || isApproved;
      if (!isDoc) approvedSelect.value = '';
    });

    row
      .querySelector("button[data-action='cancel']")
      .addEventListener('click', () => {
        editingUserId = null;
        renderUsersManagement(users);
      });

    row
      .querySelector("button[data-action='save']")
      .addEventListener('click', async () => {
        const nameInput = row.querySelector(
          `#edit-name-${CSS.escape(String(user.id))}`
        );
        const emailInput = row.querySelector(
          `#edit-email-${CSS.escape(String(user.id))}`
        );
        const newRole = roleSelect.value;
        const approved = approvedSelect.value;

        const payload = {
          fullName: (nameInput.value || '').trim(),
          email: (emailInput.value || '').trim(),
          role: newRole,
        };

        if (newRole === 'doctor') {
          // If doctor was already approved, preserve the approved status
          if (isApproved) {
            payload.approved = 'approved';
          } else {
            // Only allow changing approval status if not already approved
            if (approved === 'approved') payload.approved = 'approved';
            else if (approved === 'pending') payload.approved = 'pending';
          }
        } else {
          payload.approved = undefined;
        }

        try {
          await fetchJson(`${API_BASE}/users/${encodeURIComponent(user.id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          editingUserId = null;
          await refreshData();
        } catch (e) {
          console.error(e);
          alert(
            'Failed to save changes. Make sure json-server is running and supports PATCH.'
          );
        }
      });

    tbody.appendChild(row);
  });

  updatePaginationControls(users.length);
}

function updatePaginationControls(totalUsers) {
  let totalPages = Math.ceil(totalUsers / usersPerPage);
  let prevBtn = document.getElementById('prev-page');
  let nextBtn = document.getElementById('next-page');
  let pageInfo = document.getElementById('pagination-info');

  if (!prevBtn || !nextBtn || !pageInfo) return;

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;

  if (totalPages === 0) {
    pageInfo.textContent = 'No results';
  } else {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalUsers} users)`;
  }
}

function filterAndSortUsers() {
  // Filter by search query
  filteredUsers = allUsers.filter((user) => {
    if (!searchQuery) return true;
    let fullName = (user.fullName || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Sort users
  filteredUsers.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    // Convert to lowercase for string comparison
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (sortColumn === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  renderUsersManagement(filteredUsers);
}

function setupUserManagementControls() {
  let searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      filterAndSortUsers();
    });
  }

  document.querySelectorAll('.sortable-header').forEach((header) => {
    header.addEventListener('click', () => {
      let column = header.dataset.sort;
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }

      // Update arrow indicators
      document.querySelectorAll('.sortable-header').forEach((h) => {
        let arrow = h.querySelector('.sort-arrows');
        if (h === header) {
          arrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
          h.classList.add('active-sort');
        } else {
          arrow.textContent = '⇅';
          h.classList.remove('active-sort');
        }
      });

      currentPage = 1;
      filterAndSortUsers();
    });
  });

  // Pagination buttons
  let prevBtn = document.getElementById('prev-page');
  let nextBtn = document.getElementById('next-page');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderUsersManagement(filteredUsers);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let totalPages = Math.ceil(filteredUsers.length / usersPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderUsersManagement(filteredUsers);
      }
    });
  }
}

const APPOINTMENTS_API = 'http://localhost:8876';

async function getAllAppointments() {
  try {
    let appointments = await fetchJson(`${APPOINTMENTS_API}/appointments`);
    return Array.isArray(appointments) ? appointments : [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

function getUserNameById(users, id) {
  let user = users.find((u) => u.id === id);
  return user ? user.fullName : id || '—';
}

function getStatusPillForAppointment(status) {
  if (status === 'accepted') return `<span class="pill ok">Accepted</span>`;
  if (status === 'pending') return `<span class="pill warn">Pending</span>`;
  if (status === 'cancelled')
    return `<span class="pill danger">Cancelled</span>`;
  return `<span class="pill">${status || '—'}</span>`;
}

function renderAppointmentsStats(appointments) {
  let total = appointments.length;
  let active = appointments.filter((a) => !a.isDeleted).length;
  let pending = appointments.filter(
    (a) => a.status === 'pending' && !a.isDeleted
  ).length;
  let accepted = appointments.filter(
    (a) => a.status === 'accepted' && !a.isDeleted
  ).length;
  let cancelled = appointments.filter(
    (a) => a.status === 'cancelled' && !a.isDeleted
  ).length;
  let archived = appointments.filter((a) => a.isDeleted).length;

  setText('stat-total-appointments', String(total));
  setText('stat-pending-appointments', String(pending));
  setText('stat-accepted-appointments', String(accepted));
  setText('stat-cancelled-appointments', String(cancelled));

  let archivedEl = document.getElementById('stat-archived-appointments');
  if (archivedEl) {
    archivedEl.textContent = String(archived);
  }
}

let editingAppointmentId = null;
let allAppointments = [];

async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    await fetchJson(
      `${APPOINTMENTS_API}/appointments/${encodeURIComponent(appointmentId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }),
      }
    );
    await refreshData();
  } catch (error) {
    console.error('Error updating appointment:', error);
    alert('Failed to update appointment status.');
  }
}

async function deleteAppointment(appointmentId) {
  if (
    !confirm(
      'Are you sure you want to archive this appointment? It will be hidden from patients and doctors but kept in the system.'
    )
  )
    return;
  try {
    await fetchJson(
      `${APPOINTMENTS_API}/appointments/${encodeURIComponent(appointmentId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        }),
      }
    );
    await refreshData();
  } catch (error) {
    console.error('Error archiving appointment:', error);
    alert('Failed to archive appointment.');
  }
}

async function saveAppointmentEdit(appointmentId, date, time, notes, status) {
  try {
    await fetchJson(
      `${APPOINTMENTS_API}/appointments/${encodeURIComponent(appointmentId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          notes,
          status,
          updatedAt: new Date().toISOString(),
        }),
      }
    );
    editingAppointmentId = null;
    await refreshData();
  } catch (error) {
    console.error('Error saving appointment:', error);
    alert('Failed to save appointment changes.');
  }
}

function renderAppointments(appointments, users) {
  let tbody = document.getElementById('appointments-body');
  if (!tbody) return;

  allAppointments = appointments;

  if (!Array.isArray(appointments) || appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted">No appointments found.</td></tr>`;
    return;
  }

  // Sort by date descending
  appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML = '';

  appointments.forEach((apt) => {
    let row = document.createElement('tr');
    let patientName = getUserNameById(users, apt.patientId);
    let doctorName = getUserNameById(users, apt.doctorId);
    let aptDate = apt.date || '';
    let aptTime = apt.time || '';
    let statusPill = getStatusPillForAppointment(apt.status);
    let notes = apt.notes || '';
    let isEditing = editingAppointmentId === apt.id;
    let isDeleted = apt.isDeleted === true;

    // Add visual styling for deleted appointments
    if (isDeleted) {
      row.style.opacity = '0.6';
      row.style.backgroundColor = '#fef2f2';
    }

    if (!isEditing) {
      let deletedBadge = isDeleted
        ? '<span class="pill danger" style="margin-left: 4px;">Archived</span>'
        : '';

      row.innerHTML = `
        <td>${patientName}${
        isDeleted
          ? ' <span style="color:#dc2626;font-size:10px;">(archived)</span>'
          : ''
      }</td>
        <td>${doctorName}</td>
        <td>${aptDate || '—'}</td>
        <td>${aptTime || '—'}</td>
        <td>${statusPill}${deletedBadge}</td>
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${
          notes || '—'
        }</td>
        <td>
          <div class="actions">
            ${
              isDeleted
                ? `<span class="muted" style="font-size: 12px;">—</span>`
                : `<button class="action-btn secondary" data-action="edit" data-id="${apt.id}" type="button">Edit</button>
                 <button class="action-btn danger" data-action="delete" data-id="${apt.id}" type="button">Archive</button>`
            }
          </div>
        </td>
      `;

      if (!isDeleted) {
        // Edit button handler
        row
          .querySelector('[data-action="edit"]')
          .addEventListener('click', function () {
            editingAppointmentId = apt.id;
            renderAppointments(allAppointments, allUsers);
          });

        // Delete button handler
        row
          .querySelector('[data-action="delete"]')
          .addEventListener('click', function () {
            deleteAppointment(apt.id);
          });
      }
    } else {
      // Editing mode
      row.innerHTML = `
        <td>${patientName}</td>
        <td>${doctorName}</td>
        <td><input type="date" id="edit-date-${
          apt.id
        }" value="${aptDate}" style="padding: 4px; border-radius: 4px; border: 1px solid #e5e7eb;"></td>
        <td><input type="time" id="edit-time-${
          apt.id
        }" value="${aptTime}" style="padding: 4px; border-radius: 4px; border: 1px solid #e5e7eb;"></td>
        <td>
          <select id="edit-status-${
            apt.id
          }" style="padding: 4px; border-radius: 4px; border: 1px solid #e5e7eb;">
            <option value="pending" ${
              apt.status === 'pending' ? 'selected' : ''
            }>Pending</option>
            <option value="accepted" ${
              apt.status === 'accepted' ? 'selected' : ''
            }>Accepted</option>
            <option value="cancelled" ${
              apt.status === 'cancelled' ? 'selected' : ''
            }>Cancelled</option>
          </select>
        </td>
        <td><input type="text" id="edit-notes-${
          apt.id
        }" value="${notes}" placeholder="Notes..." style="padding: 4px; border-radius: 4px; border: 1px solid #e5e7eb; width: 100%;"></td>
        <td>
          <div class="actions">
            <button class="action-btn" data-action="save" data-id="${
              apt.id
            }" type="button">Save</button>
            <button class="action-btn secondary" data-action="cancel" data-id="${
              apt.id
            }" type="button">Cancel</button>
          </div>
        </td>
      `;

      // Save button handler
      row
        .querySelector('[data-action="save"]')
        .addEventListener('click', function () {
          let newDate = document.getElementById(`edit-date-${apt.id}`).value;
          let newTime = document.getElementById(`edit-time-${apt.id}`).value;
          let newNotes = document.getElementById(`edit-notes-${apt.id}`).value;
          let newStatus = document.getElementById(
            `edit-status-${apt.id}`
          ).value;
          saveAppointmentEdit(apt.id, newDate, newTime, newNotes, newStatus);
        });

      // Cancel button handler
      row
        .querySelector('[data-action="cancel"]')
        .addEventListener('click', function () {
          editingAppointmentId = null;
          renderAppointments(allAppointments, allUsers);
        });
    }

    tbody.appendChild(row);
  });
}

// Medical Records Management
async function getAllMedicalRecords() {
  try {
    let records = await fetchJson(`${MEDICAL_RECORDS_API_BASE}/records`);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Error fetching all medical records:', error);
    return [];
  }
}

function renderMedicalRecordsStats(records) {
  let total = records.length;
  let active = records.filter((r) => !r.isDeleted).length;
  let archived = records.filter((r) => r.isDeleted).length;

  setText('stat-total-records', String(total));
  setText('stat-active-records', String(active));
  setText('stat-archived-records', String(archived));
}

async function archiveMedicalRecord(recordId) {
  if (
    !confirm(
      'Are you sure you want to archive this medical record? It will be hidden from patients and doctors but kept in the system.'
    )
  )
    return;
  try {
    await fetchJson(
      `${MEDICAL_RECORDS_API_BASE}/records/${encodeURIComponent(recordId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        }),
      }
    );
    await refreshData();
  } catch (error) {
    console.error('Error archiving medical record:', error);
    alert('Failed to archive medical record.');
  }
}

function renderMedicalRecords(records, users) {
  let tbody = document.getElementById('records-body');
  if (!tbody) return;

  if (!Array.isArray(records) || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">No medical records found.</td></tr>`;
    return;
  }

  // Sort by date descending
  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = '';

  records.forEach((record) => {
    let row = document.createElement('tr');
    let patientName = getUserNameById(users, record.patientId);
    let doctorName =
      record.doctorName || getUserNameById(users, record.doctorId);
    let recordType = record.type || '—';
    let recordTitle = record.title || '—';
    let recordDate = record.date || '—';
    let isDeleted = record.isDeleted === true;

    // Add visual styling for deleted records
    if (isDeleted) {
      row.style.opacity = '0.6';
      row.style.backgroundColor = '#fef2f2';
    }

    let statusBadge = isDeleted
      ? '<span class="pill danger">Archived</span>'
      : '<span class="pill success">Active</span>';

    let typeClass = '';
    switch (recordType) {
      case 'diagnosis':
        typeClass = 'warning';
        break;
      case 'prescription':
        typeClass = 'primary';
        break;
      case 'lab':
        typeClass = 'secondary';
        break;
      default:
        typeClass = 'secondary';
    }

    row.innerHTML = `
      <td>${patientName}${
      isDeleted
        ? ' <span style="color:#dc2626;font-size:10px;">(archived)</span>'
        : ''
    }</td>
      <td>${doctorName}</td>
      <td><span class="pill ${typeClass}">${recordType}</span></td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${recordTitle}">${recordTitle}</td>
      <td>${recordDate}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="actions">
          ${
            isDeleted
              ? `<span class="muted" style="font-size: 12px;">—</span>`
              : `<button class="action-btn danger" data-action="archive" data-id="${record.id}" type="button">Archive</button>`
          }
        </div>
      </td>
    `;

    if (!isDeleted) {
      row
        .querySelector('[data-action="archive"]')
        .addEventListener('click', function () {
          archiveMedicalRecord(record.id);
        });
    }

    tbody.appendChild(row);
  });
}

async function refreshData() {
  const users = await getAllUsers();
  allUsers = users;
  filteredUsers = users;
  renderStats(users);
  filterAndSortUsers();
  renderDonutCharts(users);
  renderPendingDoctors(users);

  let faqs = await getAllFAQs();
  renderFAQsManagement(faqs);

  let appointments = await getAllAppointments();
  renderAppointmentsStats(appointments);
  renderAppointments(appointments, users);

  let records = await getAllMedicalRecords();
  renderMedicalRecordsStats(records);
  renderMedicalRecords(records, users);
}

async function bootstrap() {
  try {
    const auth = await getAuthedEmailAndPassword();
    if (!auth) {
      redirectTo('../../auth/login/login.html');
      return;
    }

    const user = await getUserByEmail(auth.email);
    if (!user) {
      clearSessionAndCookies();
      redirectTo('../../auth/login/login.html');
      return;
    }

    if (user.role !== 'admin') {
      alert('Access denied: admin only.');
      redirectTo('../../../../index.html');
      return;
    }

    setText('admin-subtitle', `Signed in as ${user.email}`);
    setText('profile-email', user.email || '—');
    setText('profile-name', user.fullName || '—');
    setText('profile-role', user.role || '—');

    currentAdminUser = user;

    setupUserManagementControls();
    await refreshData();
  } catch (e) {
    console.error(e);
    alert(
      'Admin dashboard failed to load. Is the API running on http://localhost:3000?'
    );
  }
}

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSessionAndCookies();
  redirectTo('../../auth/login/login.html');
});

document.getElementById('refresh-btn').addEventListener('click', () => {
  refreshData();
});

bootstrap();
