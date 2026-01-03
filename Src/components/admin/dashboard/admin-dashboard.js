
const API_BASE = "http://localhost:3000";

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

if (typeof loadHeader === "function") {
    loadHeader({
        path: "../../../shared/header.html",
        targetId: "header-slot"
    });
}

if (typeof loadFooter === "function") {
    loadFooter({
        path: "../../footer.html",
        targetId: "footer-slot"
    });
}

function formatDate(value) {
    try {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
    } catch {
        return "—";
    }
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.json();
}

async function getAuthedEmailAndPassword() {
    const sessionEmail = sessionStorage.getItem("email");
    const sessionPassword = sessionStorage.getItem("password");

    if (sessionEmail && sessionPassword) {
        const valid = await checkPassword(sessionEmail, sessionPassword);
        if (valid) return { email: sessionEmail, password: sessionPassword };
        clearSession();
    }

    const cookieEmail = getCookie("email");
    const cookiePassword = getCookie("password");

    if (cookieEmail && cookiePassword) {
        const valid = await checkPassword(cookieEmail, cookiePassword);
        if (valid) return { email: cookieEmail, password: cookiePassword };
        clearCookies();
    }

    return null;
}

async function getUserByEmail(email) {
    const users = await fetchJson(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
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
    const patients = users.filter(u => u.role === "patient").length;
    const doctors = users.filter(u => u.role === "doctor").length;
    const pending = users.filter(u => u.role === "doctor" && u.approved === "pending").length;
    const admins = users.filter(u => u.role === "admin").length;

    setText("stat-patients", String(patients));
    setText("stat-doctors", String(doctors));
    setText("stat-pending", String(pending));
    setText("stat-admins", String(admins));
}

function setDonutChart(donutId, legendId, items) {
    const donut = document.getElementById(donutId);
    const legend = document.getElementById(legendId);
    if (!donut || !legend) return;

    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
        donut.style.background = "conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)";
        legend.innerHTML = `<div class="muted">No data.</div>`;
        return;
    }

    let current = 0;
    const slices = items
        .filter(i => i.value > 0)
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

    const gradientParts = slices.map(s => `${s.color} ${s.start}deg ${s.end}deg`);
    // Background (if all items are 0, handled above)
    donut.style.background = `conic-gradient(${gradientParts.join(", ")})`;

    const aria = slices.map(s => `${s.label}: ${s.value}`).join(", ");
    donut.setAttribute("aria-label", aria || "Chart");

    legend.innerHTML = "";
    items.forEach((item) => {
        const percent = Math.round((item.value / total) * 100);

        const row = document.createElement("div");
        row.className = "legend-row";
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
    const patients = users.filter(u => u.role === "patient").length;
    const doctors = users.filter(u => u.role === "doctor").length;
    const admins = users.filter(u => u.role === "admin").length;

    const pendingDoctors = users.filter(u => u.role === "doctor" && u.approved === "pending").length;
    const approvedDoctors = users.filter(u => u.role === "doctor" && u.approved === "approved").length;

    // Use existing palette from the project
    const BLUE = "#2563eb";
    const DARK = "#111827";
    const GRAY = "#94a3b8";

    setDonutChart("donut-roles", "legend-roles", [
        { label: "Patients", value: patients, color: BLUE },
        { label: "Doctors", value: doctors, color: DARK },
        { label: "Admins", value: admins, color: GRAY }
    ]);

    setDonutChart("donut-doctors", "legend-doctors", [
        { label: "Approved", value: approvedDoctors, color: BLUE },
        { label: "Pending", value: pendingDoctors, color: DARK }
    ]);
}

function renderPendingDoctors(users) {
    const tbody = document.getElementById("pending-doctors-body");
    if (!tbody) return;

    const pendingDoctors = users.filter(u => u.role === "doctor" && u.approved === "pending");

    if (pendingDoctors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="muted">No pending requests.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    pendingDoctors.forEach(doctor => {
        const row = document.createElement("tr");

        const name = doctor.fullName || "—";
        const email = doctor.email || "—";
        const specialization = doctor.specialization || "—";
        const license = doctor.medicalLicenseNo || "—";
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

        approveBtn.addEventListener("click", async () => {
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            approveBtn.textContent = "Approving…";

            try {
                await fetchJson(`${API_BASE}/users/${encodeURIComponent(doctor.id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ approved: "approved" })
                });

                approveBtn.textContent = "Approved";
                await refreshData();
            } catch (e) {
                console.error(e);
                alert("Failed to approve doctor. Make sure json-server is running and supports PATCH.");
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                approveBtn.textContent = "Approve";
            }
        });

        rejectBtn.addEventListener("click", async () => {
            if (!confirm("Reject this doctor request? This will delete the user.")) return;

            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            rejectBtn.textContent = "Deleting…";

            try {
                await fetchJson(`${API_BASE}/users/${encodeURIComponent(doctor.id)}`, {
                    method: "DELETE"
                });
                await refreshData();
            } catch (e) {
                console.error(e);
                alert("Failed to delete user. Make sure json-server is running and supports DELETE.");
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                rejectBtn.textContent = "Reject";
            }
        });

        tbody.appendChild(row);
    });
}

function getStatusPill(user) {
    if (user.role === "doctor") {
        if (user.approved === "approved") return `<span class="pill ok">Approved</span>`;
        if (user.approved === "pending") return `<span class="pill warn">Pending</span>`;
    }
    return `<span class="pill">—</span>`;
}

async function getAllFAQs() {
    try {
        let faqs = await fetchJson(`${API_BASE}/faqs`);
        return Array.isArray(faqs) ? faqs : [];
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
}

function renderFAQsManagement(faqs) {
    let tbody = document.getElementById("faqs-body");
    if (!tbody) return;

    if (!Array.isArray(faqs) || faqs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="muted">No FAQs submitted yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    faqs.forEach((faq) => {
        let row = document.createElement("tr");
        let isEditing = editingUserId === `faq-${faq.id}`;
        let hasAnswer = faq.answer && faq.answer.trim();
        let statusPill = hasAnswer
            ? `<span class="pill ok">Answered</span>` 
            : `<span class="pill warn">Pending</span>`;
        let createdDate = formatDate(faq.createdAt);

        if (!isEditing) {
            row.innerHTML = `
                <td>${faq.userId || "—"}</td>
                <td style="max-width: 300px;">${faq.question || "—"}</td>
                <td style="max-width: 250px;">${faq.answer || "—"}</td>
                <td>${statusPill}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" data-action="edit-faq" type="button">Edit</button>
                        <button class="action-btn danger" data-action="delete-faq" type="button">Delete</button>
                    </div>
                </td>
            `;

            row.querySelector("button[data-action='edit-faq']").addEventListener("click", () => {
                editingUserId = `faq-${faq.id}`;
                renderFAQsManagement(faqs);
            });

            row.querySelector("button[data-action='delete-faq']").addEventListener("click", async () => {
                if (!confirm("Delete this FAQ?")) return;
                try {
                    await fetchJson(`${API_BASE}/faqs/${encodeURIComponent(faq.id)}`, { method: "DELETE" });
                    await refreshData();
                } catch (e) {
                    console.error(e);
                    alert("Failed to delete FAQ.");
                }
            });
        } else {
            let questionEsc = (faq.question || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            let answerEsc = (faq.answer || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            row.innerHTML = `
                <td>${faq.userId || "—"}</td>
                <td><textarea id="edit-question-${faq.id}" rows="3">${questionEsc}</textarea></td>
                <td><textarea id="edit-answer-${faq.id}" rows="3" placeholder="Enter answer...">${answerEsc}</textarea></td>
                <td>${statusPill}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" data-action="save-faq" type="button">Save</button>
                        <button class="action-btn secondary" data-action="cancel-faq" type="button">Cancel</button>
                    </div>
                </td>
            `;

            row.querySelector("button[data-action='cancel-faq']").addEventListener("click", () => {
                editingUserId = null;
                renderFAQsManagement(faqs);
            });

            row.querySelector("button[data-action='save-faq']").addEventListener("click", async () => {
                let question = document.getElementById(`edit-question-${faq.id}`).value.trim();
                let answer = document.getElementById(`edit-answer-${faq.id}`).value.trim();

                if (!question) {
                    alert("Question cannot be empty");
                    return;
                }

                try {
                    await fetchJson(`${API_BASE}/faqs/${encodeURIComponent(faq.id)}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ question, answer })
                    });
                    editingUserId = null;
                    await refreshData();
                } catch (e) {
                    console.error(e);
                    alert("Failed to save FAQ.");
                }
            });
        }

        tbody.appendChild(row);
    });
}

function renderUsersManagement(users) {
    const tbody = document.getElementById("users-body");
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

    tbody.innerHTML = "";

    if (paginatedUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="muted">No users found.</td></tr>`;
        updatePaginationControls(users.length);
        return;
    }

    paginatedUsers.forEach((user) => {
        const row = document.createElement("tr");
        const isEditing = editingUserId === user.id;
        const createdAt = formatDate(user.createdAt);

        const canDelete = !(currentAdminUser && (user.id === currentAdminUser.id || user.email === currentAdminUser.email));

        if (!isEditing) {
            row.innerHTML = `
                <td>${user.fullName || "—"}</td>
                <td>${user.email || "—"}</td>
                <td>${user.role || "—"}</td>
                <td>${getStatusPill(user)}</td>
                <td>${createdAt}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn secondary" data-action="edit" type="button">Edit</button>
                        <button class="action-btn danger" data-action="delete" type="button" ${canDelete ? "" : "disabled"}>Delete</button>
                    </div>
                </td>
            `;

            row.querySelector("button[data-action='edit']").addEventListener("click", () => {
                editingUserId = user.id;
                renderUsersManagement(users);
            });

            row.querySelector("button[data-action='delete']").addEventListener("click", async () => {
                if (!canDelete) return;
                if (!confirm(`Delete user ${user.email || user.id}?`)) return;

                try {
                    await fetchJson(`${API_BASE}/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
                    editingUserId = null;
                    await refreshData();
                } catch (e) {
                    console.error(e);
                    alert("Failed to delete user. Make sure json-server is running and supports DELETE.");
                }
            });

            tbody.appendChild(row);
            return;
        }

        const role = user.role || "patient";
        const isDoctor = role === "doctor";
        const approvedValue = user.approved === "approved" ? "approved" : user.approved === "pending" ? "pending" : "";

        row.innerHTML = `
            <td><input id="edit-name-${user.id}" value="${(user.fullName || "").replace(/"/g, "&quot;")}" placeholder="Full name" /></td>
            <td><input id="edit-email-${user.id}" value="${(user.email || "").replace(/"/g, "&quot;")}" placeholder="Email" /></td>
            <td>
                <select id="edit-role-${user.id}">
                    <option value="patient" ${role === "patient" ? "selected" : ""}>patient</option>
                    <option value="doctor" ${role === "doctor" ? "selected" : ""}>doctor</option>
                    <option value="admin" ${role === "admin" ? "selected" : ""}>admin</option>
                </select>
            </td>
            <td>
                <select id="edit-approved-${user.id}" ${isDoctor ? "" : "disabled"}>
                    <option value="" ${approvedValue === "" ? "selected" : ""}>—</option>
                    <option value="approved" ${approvedValue === "approved" ? "selected" : ""}>Approved</option>
                    <option value="pending" ${approvedValue === "pending" ? "selected" : ""}>Pending</option>
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

        const roleSelect = row.querySelector(`#edit-role-${CSS.escape(String(user.id))}`);
        const approvedSelect = row.querySelector(`#edit-approved-${CSS.escape(String(user.id))}`);

        roleSelect.addEventListener("change", () => {
            const isDoc = roleSelect.value === "doctor";
            approvedSelect.disabled = !isDoc;
            if (!isDoc) approvedSelect.value = "";
        });

        row.querySelector("button[data-action='cancel']").addEventListener("click", () => {
            editingUserId = null;
            renderUsersManagement(users);
        });

        row.querySelector("button[data-action='save']").addEventListener("click", async () => {
            const nameInput = row.querySelector(`#edit-name-${CSS.escape(String(user.id))}`);
            const emailInput = row.querySelector(`#edit-email-${CSS.escape(String(user.id))}`);
            const newRole = roleSelect.value;
            const approved = approvedSelect.value;

            const payload = {
                fullName: (nameInput.value || "").trim(),
                email: (emailInput.value || "").trim(),
                role: newRole
            };

            if (newRole === "doctor") {
                if (approved === "approved") payload.approved = "approved";
                else if (approved === "pending") payload.approved = "pending";
            } else {
                payload.approved = undefined;
            }

            try {
                await fetchJson(`${API_BASE}/users/${encodeURIComponent(user.id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                editingUserId = null;
                await refreshData();
            } catch (e) {
                console.error(e);
                alert("Failed to save changes. Make sure json-server is running and supports PATCH.");
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
    filteredUsers = allUsers.filter(user => {
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

    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            let column = header.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }

            // Update arrow indicators
            document.querySelectorAll('.sortable-header').forEach(h => {
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
}

async function bootstrap() {
    try {
        const auth = await getAuthedEmailAndPassword();
        if (!auth) {
            redirectTo("../../auth/login/login.html");
            return;
        }

        const user = await getUserByEmail(auth.email);
        if (!user) {
            clearSessionAndCookies();
            redirectTo("../../auth/login/login.html");
            return;
        }

        if (user.role !== "admin") {
            alert("Access denied: admin only.");
            redirectTo("../../../../index.html");
            return;
        }

        setText("admin-subtitle", `Signed in as ${user.email}`);
        setText("profile-email", user.email || "—");
        setText("profile-name", user.fullName || "—");
        setText("profile-role", user.role || "—");

        currentAdminUser = user;

        setupUserManagementControls();
        await refreshData();
    } catch (e) {
        console.error(e);
        alert("Admin dashboard failed to load. Is the API running on http://localhost:3000?");
    }
}

document.getElementById("logout-btn").addEventListener("click", () => {
    clearSessionAndCookies();
    redirectTo("../../auth/login/login.html");
});

document.getElementById("refresh-btn").addEventListener("click", () => {
    refreshData();
});

bootstrap();
