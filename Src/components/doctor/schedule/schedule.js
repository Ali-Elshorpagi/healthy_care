let allSchedules = [];
let editingScheduleId = null;

document.addEventListener('DOMContentLoaded', function () {
  checkAuthentication();
  buildHeader();
  buildSidebar('schedule');
  checkServerConnection();
  loadSchedules();
  setupEventListeners();
});

function checkAuthentication() {
  const doctorId = sessionStorage.getItem('doctorId');
  const doctorRole = sessionStorage.getItem('role');

  if (!doctorId || doctorRole !== 'doctor') {
    window.location.href = '../../auth/login/login.html';
  }
}

async function checkServerConnection() {
  try {
    const response = await fetch('http://localhost:8873/schedules?_limit=1');
    if (!response.ok) {
      showMessage('Warning: Schedule server may not be running properly', 'error');
    }
  } catch (error) {
    showMessage('Server not running! Please start: start-json-servers.bat', 'error');
    console.error('Server connection failed:', error);
  }
}

function setupEventListeners() {
  const addScheduleBtn = document.getElementById('addScheduleBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const scheduleForm = document.getElementById('scheduleForm');

  addScheduleBtn.addEventListener('click', openAddModal);
  closeModal.addEventListener('click', closeScheduleModal);
  cancelBtn.addEventListener('click', closeScheduleModal);
  scheduleForm.addEventListener('submit', handleSubmit);

  // Close modal on outside click
  const modal = document.getElementById('scheduleModal');
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeScheduleModal();
    }
  });
}

async function loadSchedules() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const scheduleGrid = document.querySelector('.schedule-grid');

  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  scheduleGrid.style.display = 'grid';

  try {
    const doctorId = sessionStorage.getItem('doctorId');
    const response = await fetch(`http://localhost:8873/schedules?doctorId=${doctorId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }

    allSchedules = await response.json();
    displaySchedules();
    
    loadingState.style.display = 'none';
    
    if (allSchedules.length === 0) {
      emptyState.style.display = 'block';
      scheduleGrid.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading schedules:', error);
    loadingState.style.display = 'none';
    showMessage('Failed to load schedules', 'error');
  }
}

function displaySchedules() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    const container = document.getElementById(`slots-${day}`);
    container.innerHTML = '';
    
    const daySchedules = allSchedules.filter(s => s.dayOfWeek === day);
    
    // Sort by start time
    daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    daySchedules.forEach(schedule => {
      const slotElement = createTimeSlotElement(schedule);
      container.appendChild(slotElement);
    });
    
    if (daySchedules.length === 0) {
      container.innerHTML = '<p style="color: #9ca3af; font-size: 14px; text-align: center; padding: 20px;">No availability set</p>';
    }
  });
}

function createTimeSlotElement(schedule) {
  const slot = document.createElement('div');
  slot.className = 'time-slot';
  
  slot.innerHTML = `
    <div class="time-slot-info">
      <div class="time-slot-time">
        <span class="material-symbols-outlined">schedule</span>
        ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}
      </div>
    </div>
    <div class="time-slot-actions">
      <button class="icon-btn edit" data-id="${schedule.id}" title="Edit">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button class="icon-btn delete" data-id="${schedule.id}" title="Delete">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  
  // Add event listeners
  const editBtn = slot.querySelector('.edit');
  const deleteBtn = slot.querySelector('.delete');
  
  editBtn.addEventListener('click', () => openEditModal(schedule.id));
  deleteBtn.addEventListener('click', () => deleteSchedule(schedule.id));
  
  return slot;
}

function formatTime(time) {
  // Convert 24h to 12h format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function openAddModal() {
  editingScheduleId = null;
  document.getElementById('modalTitle').textContent = 'Add Availability';
  document.getElementById('scheduleForm').reset();
  document.getElementById('scheduleModal').classList.add('show');
}

function openEditModal(scheduleId) {
  editingScheduleId = scheduleId;
  const schedule = allSchedules.find(s => s.id === scheduleId);
  
  if (!schedule) return;
  
  document.getElementById('modalTitle').textContent = 'Edit Availability';
  document.getElementById('dayOfWeek').value = schedule.dayOfWeek;
  document.getElementById('startTime').value = schedule.startTime;
  document.getElementById('endTime').value = schedule.endTime;
  document.getElementById('scheduleModal').classList.add('show');
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').classList.remove('show');
  editingScheduleId = null;
  document.getElementById('scheduleForm').reset();
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const dayOfWeek = document.getElementById('dayOfWeek').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  
  // Validate times - allow overnight schedules (e.g., 17:00 to 00:00)
  // Only check if both times are the same
  if (startTime === endTime) {
    showMessage('Start time and end time cannot be the same', 'error');
    return;
  }
  
  const doctorId = sessionStorage.getItem('doctorId');
  
  const scheduleData = {
    doctorId,
    dayOfWeek,
    startTime,
    endTime,
    isAvailable: true
  };
  
  try {
    if (editingScheduleId) {
      await updateSchedule(editingScheduleId, scheduleData);
    } else {
      await createSchedule(scheduleData);
    }
    
    closeScheduleModal();
    loadSchedules();
  } catch (error) {
    console.error('Error saving schedule:', error);
    const errorMessage = error.message || 'Failed to save schedule. Please check if servers are running.';
    showMessage(errorMessage, 'error');
  }
}

async function createSchedule(scheduleData) {
  scheduleData.id = 'sch_' + Date.now();
  
  try {
    const response = await fetch('http://localhost:8873/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scheduleData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      throw new Error('Server error: ' + response.status);
    }
    
    showMessage('Availability added successfully', 'success');
  } catch (error) {
    console.error('Failed to create schedule:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Make sure start-json-servers.bat is running.');
    }
    throw error;
  }
}

async function updateSchedule(scheduleId, scheduleData) {
  const response = await fetch(`http://localhost:8873/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(scheduleData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update schedule');
  }
  
  showMessage('Availability updated successfully', 'success');
}

async function deleteSchedule(scheduleId) {
  if (!confirm('Are you sure you want to delete this availability slot?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:8873/schedules/${scheduleId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete schedule');
    }
    
    showMessage('Availability deleted successfully', 'success');
    loadSchedules();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    showMessage('Failed to delete availability', 'error');
  }
}

function showMessage(text, type) {
  const container = document.getElementById('messageContainer');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  
  const icon = type === 'success' ? 'check_circle' : 'error';
  
  message.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span class="message-text">${text}</span>
  `;
  
  container.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}
