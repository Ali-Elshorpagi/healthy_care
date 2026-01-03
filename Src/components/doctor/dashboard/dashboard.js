document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  checkAuthentication();
  
  // Build UI
  buildHeader();
  buildSidebar('dashboard');
  
  // Load data
  loadDoctorInfo();
  setGreeting();
  setCurrentDate();
  loadTodayAppointments();
  
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

function loadDoctorInfo() {
  const doctorName = sessionStorage.getItem('doctorName') || 'Doctor';
  const doctorSpecialization = sessionStorage.getItem('doctorSpecialization') || 'Specialist';
  
  // Update greeting with doctor name
  const greetingText = document.getElementById('greetingText');
  if (greetingText) {
    const firstName = doctorName.replace('Dr. ', '');
    greetingText.textContent = getGreeting() + ', Dr. ' + firstName;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function setGreeting() {
  const greetingText = document.getElementById('greetingText');
  if (greetingText) {
    const doctorName = sessionStorage.getItem('doctorName') || 'Doctor';
    const firstName = doctorName.replace('Dr. ', '');
    greetingText.textContent = getGreeting() + ', Dr. ' + firstName;
  }
}

function setCurrentDate() {
  const currentDateEl = document.getElementById('currentDate');
  if (!currentDateEl) return;
  
  const today = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);
  
  // Get day with suffix
  const day = today.getDate();
  const suffix = getDaySuffix(day);
  const formattedDate = dateStr.replace(day.toString(), day + suffix);
  
  currentDateEl.textContent = formattedDate + ' • Loading appointments...';
}

function getDaySuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

async function loadTodayAppointments() {
  try {
    const doctorId = sessionStorage.getItem('doctorId');
    
    // Fetch all appointments
    const response = await fetch('http://localhost:8876/appointments');
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const allAppointments = await response.json();
    
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    console.log('Today date string:', todayStr);
    console.log('All appointments:', allAppointments);
    console.log('Doctor ID:', doctorId);
    
    // Filter appointments for this doctor, today, and accepted status
    const todayAccepted = allAppointments.filter(apt => {
      const matches = apt.doctorId === doctorId && 
                      apt.date === todayStr && 
                      apt.status === 'accepted';
      console.log('Appointment:', apt.id, 'Date:', apt.date, 'Status:', apt.status, 'Matches:', matches);
      return matches;
    });
    
    // Sort by time
    todayAccepted.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    // Count appointments by status
    const todayAll = allAppointments.filter(apt => 
      apt.doctorId === doctorId && apt.date === todayStr
    );
    
    const pendingCount = allAppointments.filter(apt => 
      apt.doctorId === doctorId && apt.status === 'pending'
    ).length;
    
    const acceptedCount = todayAccepted.length;
    
    // Update stats
    updateStats(todayAll.length, acceptedCount, pendingCount);
    
    // Update date text
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
      const today = new Date();
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      const dateStr = today.toLocaleDateString('en-US', options);
      const day = today.getDate();
      const suffix = getDaySuffix(day);
      const formattedDate = dateStr.replace(day.toString(), day + suffix);
      
      currentDateEl.textContent = formattedDate + ' • You have ' + todayAccepted.length + ' appointment' + (todayAccepted.length !== 1 ? 's' : '') + ' today.';
    }
    
    // Fetch patient details and display appointments
    if (todayAccepted.length > 0) {
      await displayAppointments(todayAccepted);
    } else {
      showEmptyState();
    }
    
  } catch (error) {
    console.error('Error loading appointments:', error);
    showEmptyState();
  }
}

function updateStats(todayCount, completedCount, pendingCount) {
  const todayEl = document.getElementById('todayCount');
  const completedEl = document.getElementById('completedCount');
  const pendingEl = document.getElementById('pendingCount');
  
  if (todayEl) todayEl.textContent = todayCount;
  if (completedEl) completedEl.textContent = completedCount;
  if (pendingEl) pendingEl.textContent = pendingCount;
}

async function displayAppointments(appointments) {
  const tbody = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('appointmentsTableContainer');
  
  if (!tbody) return;
  
  // Show table, hide empty state
  tableContainer.style.display = 'block';
  emptyState.style.display = 'none';
  
  tbody.innerHTML = '';
  
  // Fetch all patients
  const patientsResponse = await fetch('http://localhost:8877/users');
  const users = await patientsResponse.json();
  const patients = users.filter(u => u.role === 'patient');
  
  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    const patient = patients.find(p => p.id === apt.patientId);
    
    if (!patient) continue;
    
    const tr = document.createElement('tr');
    
    // Patient Cell
    const patientTd = document.createElement('td');
    patientTd.innerHTML = createPatientCell(patient);
    tr.appendChild(patientTd);
    
    // Time Cell
    const timeTd = document.createElement('td');
    timeTd.innerHTML = '<div class="time-cell"><span class="material-symbols-outlined">schedule</span>' + formatTime(apt.time) + '</div>';
    tr.appendChild(timeTd);
    
    // Type Cell
    const typeTd = document.createElement('td');
    typeTd.innerHTML = '<div class="type-cell">' + (apt.type || apt.notes || 'General Consultation') + '</div>';
    tr.appendChild(typeTd);
    
    // Status Cell
    const statusTd = document.createElement('td');
    statusTd.innerHTML = '<span class="badge badge-green">Accepted</span>';
    tr.appendChild(statusTd);
    
    tbody.appendChild(tr);
  }
}

function createPatientCell(patient) {
  const initials = getInitials(patient.fullName);
  const bgClass = 'bg-' + ((patient.id.charCodeAt(patient.id.length - 1) % 6) + 1);
  
  return `
    <div class="patient-cell">
      <div class="patient-avatar ${bgClass}">${initials}</div>
      <div class="patient-info">
        <div class="patient-name">${patient.fullName}</div>
        <div class="patient-id">${patient.id}</div>
      </div>
    </div>
  `;
}

function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTime(time) {
  // Convert 24h to 12h format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return displayHour + ':' + minutes + ' ' + ampm;
}

function showEmptyState() {
  const tbody = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('appointmentsTableContainer');
  
  if (tbody) tbody.innerHTML = '';
  if (tableContainer) tableContainer.style.display = 'none';
  if (emptyState) emptyState.style.display = 'block';
}

function setupEventListeners() {
  // View All Button
  const viewAllBtn = document.getElementById('viewAllBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', function() {
      window.location.href = '../appointments/appointments.html';
    });
  }
  
  // Refresh Button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      loadTodayAppointments();
    });
  }
  
  // Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterAppointments(this.value);
    });
  }
}

function filterAppointments(searchTerm) {
  const rows = document.querySelectorAll('#appointmentsTableBody tr');
  const term = searchTerm.toLowerCase();
  
  let visibleCount = 0;
  
  rows.forEach(row => {
    const patientCell = row.querySelector('.patient-cell');
    const patientName = patientCell.querySelector('.patient-name').textContent.toLowerCase();
    const patientId = patientCell.querySelector('.patient-id').textContent.toLowerCase();
    
    if (patientName.includes(term) || patientId.includes(term)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });
  
  // Show/hide empty state based on visible rows
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('appointmentsTableContainer');
  
  if (visibleCount === 0 && searchTerm !== '') {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'No Results Found';
    emptyState.querySelector('p').textContent = 'No appointments match your search criteria.';
  } else if (visibleCount === 0) {
    showEmptyState();
  } else {
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
  }
}
