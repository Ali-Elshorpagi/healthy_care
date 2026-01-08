let allAppointments = [];
let filteredAppointments = [];
let currentAction = null;

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  checkAuthentication();

  // Build UI
  buildHeader();
  buildSidebar('appointments');

  // Load appointments
  loadAppointments();

  // Setup event listeners
  setupEventListeners();
});

function checkAuthentication() {
  const doctorId = sessionStorage.getItem('doctorId');
  const doctorRole = sessionStorage.getItem('role');

  if (!doctorId || doctorRole !== 'doctor') {
    window.location.href = '../../auth/login/login.html';
  }
}

async function loadAppointments() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const appointmentsList = document.getElementById('appointmentsList');

  // Show loading
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  appointmentsList.innerHTML = '';

  try {
    const doctorId = sessionStorage.getItem('doctorId');

    // Fetch appointments
    const appointmentsResponse = await fetch('http://localhost:8876/appointments');
    if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');

    const allAppts = await appointmentsResponse.json();

    // Fetch all users to get patient info
    const usersResponse = await fetch('http://localhost:8877/users');
    const users = await usersResponse.json();

    // Get list of existing patient IDs
    const existingPatientIds = users
      .filter(user => user.role === 'patient')
      .map(p => p.id);

    // Filter for this doctor, exclude deleted, and only show appointments with existing patients
    allAppointments = allAppts
      .filter(apt =>
        apt.doctorId === doctorId &&
        !apt.isDeleted &&
        existingPatientIds.includes(apt.patientId)
      )
      .map(apt => {
        const patient = users.find(u => u.id === apt.patientId);
        return {
          ...apt,
          patientName: patient ? patient.fullName : 'Unknown Patient',
          patientEmail: patient ? patient.email : ''
        };
      });

    // Sort by date (newest first)
    sortAppointments('date');

    // Display appointments
    displayAppointments(filteredAppointments);

  } catch (error) {
    console.error('Error loading appointments:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'Error Loading Appointments';
    emptyState.querySelector('p').textContent = 'Failed to load appointments. Please try again.';
  }
}

function displayAppointments(appointments) {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const appointmentsList = document.getElementById('appointmentsList');

  loadingState.style.display = 'none';

  if (appointments.length === 0) {
    appointmentsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  appointmentsList.innerHTML = '';

  appointments.forEach(apt => {
    const item = createAppointmentItem(apt);
    appointmentsList.appendChild(item);
  });
}

function createAppointmentItem(apt) {
  const div = document.createElement('div');
  div.className = 'appointment-item';
  div.dataset.appointmentId = apt.id;

  // Date Column
  const dateDiv = document.createElement('div');
  dateDiv.className = 'appointment-date';
  const date = new Date(apt.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  dateDiv.innerHTML = `
    <span class="date-day">${day}</span>
    <span class="date-month">${month}</span>
  `;

  // Info Column
  const infoDiv = document.createElement('div');
  infoDiv.className = 'appointment-info';

  const initials = getInitials(apt.patientName);
  const bgClass = 'bg-' + ((apt.patientId.charCodeAt(apt.patientId.length - 1) % 6) + 1);

  infoDiv.innerHTML = `
    <div class="appointment-header">
      <div class="patient-info-row">
        <div class="patient-avatar-sm ${bgClass}">${initials}</div>
        <div>
          <div class="patient-name-lg">${apt.patientName}</div>
        </div>
      </div>
    </div>
    <div class="appointment-meta">
      <div class="meta-item">
        <span class="material-symbols-outlined">schedule</span>
        ${formatTime(apt.time)}
      </div>
      <div class="meta-item">
        <span class="material-symbols-outlined">calendar_month</span>
        ${formatDate(apt.date)}
      </div>
      <div class="appointment-type">
        <span class="material-symbols-outlined">medical_services</span>
        ${apt.type || apt.notes || 'General Consultation'}
      </div>
    </div>
  `;

  // Actions Column
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'appointment-actions';

  const statusBadge = document.createElement('div');
  statusBadge.className = `status-badge-lg ${apt.status}`;
  statusBadge.textContent = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
  actionsDiv.appendChild(statusBadge);

  // Action buttons based on status
  if (apt.status === 'pending') {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'action-buttons';
    
    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn btn-success btn-sm';
    acceptBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">check</span>Accept';
    acceptBtn.onclick = () => changeStatus(apt, 'accepted');
    
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-danger btn-sm';
    rejectBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">close</span>Reject';
    rejectBtn.onclick = () => changeStatus(apt, 'cancelled');
    
    buttonsDiv.appendChild(acceptBtn);
    buttonsDiv.appendChild(rejectBtn);
    actionsDiv.appendChild(buttonsDiv);
  } else if (apt.status === 'accepted') {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'action-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-danger btn-sm';
    cancelBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">cancel</span>Cancel';
    cancelBtn.onclick = () => changeStatus(apt, 'cancelled');
    
    buttonsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(buttonsDiv);
  }

  div.appendChild(dateDiv);
  div.appendChild(infoDiv);
  div.appendChild(actionsDiv);

  return div;
}

function changeStatus(appointment, newStatus) {
  currentAction = { appointment, newStatus };
  
  const modal = document.getElementById('statusModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalDetails = document.getElementById('modalAppointmentDetails');
  const confirmBtn = document.getElementById('confirmBtn');
  
  if (!modal) {
    alert('Error: Modal not found. Please refresh the page.');
    return;
  }
  
  modalTitle.textContent = 'Change Appointment Status';
  modalMessage.textContent = `Are you sure you want to change this appointment status to "${newStatus.toUpperCase()}"?`;
  
  modalDetails.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">Patient:</span>
      <span class="detail-value">${appointment.patientName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date:</span>
      <span class="detail-value">${formatDate(appointment.date)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Time:</span>
      <span class="detail-value">${formatTime(appointment.time)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Current Status:</span>
      <span class="detail-value">${appointment.status.toUpperCase()}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">New Status:</span>
      <span class="detail-value" style="color: #2563eb; font-weight: 700;">${newStatus.toUpperCase()}</span>
    </div>
  `;
  
  confirmBtn.className = 'btn ';
  if (newStatus === 'accepted' || newStatus === 'completed') {
    confirmBtn.className += 'btn-success';
  } else if (newStatus === 'cancelled') {
    confirmBtn.className += 'btn-danger';
  } else {
    confirmBtn.className += 'btn-primary';
  }
  
  modal.classList.add('active');
}

async function confirmStatusChange() {
  if (!currentAction) return;

  const { appointment, newStatus } = currentAction;
  const modal = document.getElementById('statusModal');

  try {
    const response = await fetch(`http://localhost:8876/appointments/${appointment.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update appointment');
    }

    modal.classList.remove('active');
    currentAction = null;
    await loadAppointments();

  } catch (error) {
    console.error('Error updating appointment:', error);
    alert('Failed to update appointment. Error: ' + error.message);
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');
  const sortFilter = document.getElementById('sortFilter');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const modal = document.getElementById('statusModal');
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
  if (refreshBtn) refreshBtn.addEventListener('click', loadAppointments);
  
  if (sortFilter) {
    sortFilter.addEventListener('change', function() {
      sortAppointments(this.value);
      displayAppointments(filteredAppointments);
    });
  }
  
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.classList.remove('active');
      currentAction = null;
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      currentAction = null;
    });
  }
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmStatusChange);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        currentAction = null;
      }
    });
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusValue = document.getElementById('statusFilter').value;
  const dateValue = document.getElementById('dateFilter').value;

  filteredAppointments = allAppointments.filter(apt => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      apt.patientName.toLowerCase().includes(searchTerm) ||
      apt.patientId.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus = statusValue === 'all' || apt.status === statusValue;

    // Date filter
    const matchesDate = dateValue === '' || apt.date === dateValue;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Re-apply current sort
  const sortValue = document.getElementById('sortFilter').value;
  sortAppointments(sortValue);

  displayAppointments(filteredAppointments);
}

function sortAppointments(sortBy) {
  if (filteredAppointments.length === 0) {
    filteredAppointments = [...allAppointments];
  }

  switch (sortBy) {
    case 'date':
      filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'date-asc':
      filteredAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'name':
      filteredAppointments.sort((a, b) => a.patientName.localeCompare(b.patientName));
      break;
    case 'status':
      const statusOrder = { pending: 1, accepted: 2, completed: 3, cancelled: 4 };
      filteredAppointments.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      break;
    case 'time':
      filteredAppointments.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;

        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
      break;
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('dateFilter').value = '';
  document.getElementById('sortFilter').value = 'date';

  filteredAppointments = [...allAppointments];
  sortAppointments('date');
  displayAppointments(filteredAppointments);
}

// Helper Functions
function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return displayHour + ':' + minutes + ' ' + ampm;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
