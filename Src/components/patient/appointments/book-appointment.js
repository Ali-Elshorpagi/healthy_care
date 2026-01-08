let isRescheduling = false;
let rescheduleAppointmentId = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('appointments');
  loadClinics();
  loadDoctors().then(() => {
    checkForReschedule();
    checkForPreselectedDoctor();
  });
  setupDoctorAutocomplete();
  setupDateRestrictions();
  setupFormSubmit();
});

const clinicsData = [
  {
    id: 'clinic1',
    name: 'City Medical Center',
    address: '123 Main Street, Downtown'
  },
  {
    id: 'clinic2',
    name: 'General Hospital',
    address: '456 Park Avenue, North District'
  },
  {
    id: 'clinic3',
    name: 'Health Plus Clinic',
    address: '789 Oak Road, South Area'
  },
  {
    id: 'clinic4',
    name: 'Family Care Center',
    address: '321 Elm Street, East Side'
  }
];

let doctorsData = [];
let filteredDoctors = [];
let selectedDoctorIndex = -1;

async function loadDoctors() {
  try {
    const response = await fetch('http://localhost:8877/users');
    if (!response.ok) throw new Error('Failed to fetch doctors');

    const allUsers = await response.json();

    // Filter only approved doctors
    doctorsData = allUsers
      .filter(user => user.role === 'doctor' && user.approved === 'approved')
      .map(doctor => ({
        id: doctor.id,
        name: doctor.fullName,
        specialization: doctor.specialization || 'General Practice',
        clinicId: doctor.clinicId || 'clinic1',
        clinicName: doctor.clinicName || 'City Medical Center'
      }));

    filteredDoctors = doctorsData;
  } catch (error) {
    console.error('Error loading doctors:', error);
    doctorsData = [];
    filteredDoctors = doctorsData;
  }
}

function loadClinics() {
  const clinicSelect = document.getElementById('clinicSelect');

  clinicsData.forEach(clinic => {
    const option = document.createElement('option');
    option.value = clinic.id;
    option.textContent = `${clinic.name} - ${clinic.address}`;
    clinicSelect.appendChild(option);
  });

  clinicSelect.addEventListener('change', function () {
    const doctorInput = document.getElementById('doctorInput');
    const doctorInfo = document.getElementById('doctorInfo');
    const selectedDoctorId = document.getElementById('selectedDoctorId');

    doctorInput.value = '';
    selectedDoctorId.value = '';
    doctorInfo.classList.add('hidden');

    if (this.value) {
      filteredDoctors = doctorsData.filter(doc => doc.clinicId === this.value);
    } else {
      filteredDoctors = doctorsData;
    }
  });
}

function setupDoctorAutocomplete() {
  const doctorInput = document.getElementById('doctorInput');
  const suggestionsContainer = document.getElementById('doctorSuggestions');

  // Show all doctors when input is focused
  doctorInput.addEventListener('focus', function () {
    const searchTerm = this.value.toLowerCase().trim();
    if (searchTerm.length === 0) {
      displaySuggestions(filteredDoctors);
    } else {
      const matches = filteredDoctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm) ||
        doctor.specialization.toLowerCase().includes(searchTerm)
      );
      displaySuggestions(matches);
    }
  });

  doctorInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase().trim();

    // Show all doctors if input is empty, otherwise filter
    if (searchTerm.length === 0) {
      displaySuggestions(filteredDoctors);
      return;
    }

    const matches = filteredDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm) ||
      doctor.specialization.toLowerCase().includes(searchTerm)
    );

    displaySuggestions(matches);
  });

  document.addEventListener('click', function (e) {
    if (!doctorInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove('show');
    }
  });

  doctorInput.addEventListener('keydown', function (e) {
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedDoctorIndex = Math.min(selectedDoctorIndex + 1, suggestions.length - 1);
      updateActiveSuggestion(suggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedDoctorIndex = Math.max(selectedDoctorIndex - 1, -1);
      updateActiveSuggestion(suggestions);
    } else if (e.key === 'Enter' && selectedDoctorIndex >= 0) {
      e.preventDefault();
      suggestions[selectedDoctorIndex].click();
    } else if (e.key === 'Escape') {
      suggestionsContainer.classList.remove('show');
    }
  });
}

function displaySuggestions(doctors) {
  const suggestionsContainer = document.getElementById('doctorSuggestions');
  suggestionsContainer.innerHTML = '';
  selectedDoctorIndex = -1;

  if (doctors.length === 0) {
    suggestionsContainer.innerHTML = '<div class="no-suggestions">No doctors found</div>';
    suggestionsContainer.classList.add('show');
    return;
  }

  doctors.forEach((doctor, index) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <div class="suggestion-name">${doctor.name}</div>
      <div class="suggestion-specialization">${doctor.specialization}</div>
      <div class="suggestion-clinic">${doctor.clinicName}</div>
    `;

    item.addEventListener('click', function () {
      selectDoctor(doctor);
    });

    suggestionsContainer.appendChild(item);
  });

  suggestionsContainer.classList.add('show');
}

function updateActiveSuggestion(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedDoctorIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function selectDoctor(doctor) {
  const doctorInput = document.getElementById('doctorInput');
  const selectedDoctorId = document.getElementById('selectedDoctorId');
  const suggestionsContainer = document.getElementById('doctorSuggestions');
  const doctorInfo = document.getElementById('doctorInfo');

  doctorInput.value = doctor.name;
  selectedDoctorId.value = doctor.id;

  suggestionsContainer.classList.remove('show');

  document.getElementById('doctorName').textContent = doctor.name;
  document.getElementById('doctorSpecialization').textContent = doctor.specialization;
  document.getElementById('doctorClinic').textContent = doctor.clinicName;
  doctorInfo.classList.remove('hidden');

  const clinicSelect = document.getElementById('clinicSelect');
  if (!clinicSelect.value) {
    clinicSelect.value = doctor.clinicId;
  }
  
  // Setup date change listener to validate against doctor's schedule
  setupDateChangeListener();
  
  // Setup view schedule button
  setupViewScheduleButton(doctor);
}

function setupDateChangeListener() {
  const dateInput = document.getElementById('appointmentDate');
  const timeInput = document.getElementById('appointmentTime');
  
  // Remove existing listener if any
  const newDateInput = dateInput.cloneNode(true);
  dateInput.parentNode.replaceChild(newDateInput, dateInput);
  
  newDateInput.addEventListener('change', async function() {
    const selectedDoctorId = document.getElementById('selectedDoctorId').value;
    if (selectedDoctorId && this.value) {
      await validateDateAgainstSchedule(this.value, selectedDoctorId);
    }
  });
  
  // Also add listener to time input
  const newTimeInput = timeInput.cloneNode(true);
  timeInput.parentNode.replaceChild(newTimeInput, timeInput);
  
  newTimeInput.addEventListener('blur', async function() {
    const selectedDoctorId = document.getElementById('selectedDoctorId').value;
    const selectedDate = document.getElementById('appointmentDate').value;
    if (selectedDoctorId && selectedDate && this.value) {
      await validateTimeAgainstSchedule(selectedDate, this.value, selectedDoctorId);
    }
  });
}

async function validateDateAgainstSchedule(date, doctorId) {
  try {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const response = await fetch(`http://localhost:8873/schedules?doctorId=${doctorId}&dayOfWeek=${dayOfWeek}&isAvailable=true`);
    
    if (!response.ok) {
      console.error('Failed to fetch doctor schedule');
      return;
    }
    
    const schedules = await response.json();
    
    if (schedules.length === 0) {
      showMessage(`Doctor is not available on ${dayOfWeek}s. Please select another date.`, 'error');
      document.getElementById('appointmentDate').value = '';
      hideAvailableTimes();
    } else {
      // Show available time slots
      displayAvailableTimes(schedules, dayOfWeek);
    }
  } catch (error) {
    console.error('Error validating date:', error);
    hideAvailableTimes();
  }
}

function displayAvailableTimes(schedules, dayOfWeek) {
  const container = document.getElementById('availableTimesContainer');
  const list = document.getElementById('availableTimesList');
  const dayDisplay = document.getElementById('selectedDayDisplay');
  
  if (schedules.length === 0) {
    hideAvailableTimes();
    return;
  }
  
  list.innerHTML = '';
  dayDisplay.textContent = `Click a time slot to select it`;
  
  // Generate 30-minute time slots for each schedule
  schedules.forEach(schedule => {
    const slots = generate30MinuteSlots(schedule.startTime, schedule.endTime);
    
    slots.forEach(slot => {
      const badge = document.createElement('div');
      badge.className = 'time-slot-badge clickable';
      badge.innerHTML = `
        <span class="material-symbols-outlined">schedule</span>
        ${slot}
      `;
      
      // Make slots clickable to auto-fill time input
      badge.onclick = function() {
        selectTimeSlot(slot);
      };
      
      list.appendChild(badge);
    });
  });
  
  container.style.display = 'block';
}

function generate30MinuteSlots(startTime, endTime) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  // Handle overnight schedules
  const isOvernight = startTime > endTime;
  const maxHour = isOvernight ? 24 + endHour : endHour;
  
  while (currentHour < maxHour || (currentHour === maxHour && currentMinute <= endMinute)) {
    const displayHour = currentHour >= 24 ? currentHour - 24 : currentHour;
    const timeString = `${String(displayHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    slots.push(formatTime(timeString));
    
    // Add 30 minutes
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
    
    // Safety limit - max 48 slots (24 hours)
    if (slots.length > 48) break;
  }
  
  return slots;
}

function selectTimeSlot(timeSlot) {
  // Convert 12-hour format back to 24-hour for input
  const time24 = convertTo24Hour(timeSlot);
  document.getElementById('appointmentTime').value = time24;
  
  // Remove previous selection highlight
  document.querySelectorAll('.time-slot-badge').forEach(badge => {
    badge.classList.remove('selected');
  });
  
  // Highlight selected slot
  event.target.closest('.time-slot-badge').classList.add('selected');
  
  showMessage('Time slot selected: ' + timeSlot, 'success');
}

function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function hideAvailableTimes() {
  const container = document.getElementById('availableTimesContainer');
  container.style.display = 'none';
}

function setupViewScheduleButton(doctor) {
  const viewScheduleBtn = document.getElementById('viewScheduleBtn');
  
  viewScheduleBtn.onclick = async function() {
    await showWeeklySchedule(doctor);
  };
}

async function showWeeklySchedule(doctor) {
  const modal = document.getElementById('scheduleModal');
  const modalBody = document.getElementById('scheduleModalBody');
  const modalDoctorName = document.getElementById('modalDoctorName');
  
  modalDoctorName.textContent = `${doctor.name}'s Weekly Schedule`;
  modalBody.innerHTML = '<div style="text-align: center; padding: 20px;">Loading schedule...</div>';
  
  modal.classList.add('show');
  
  try {
    const response = await fetch(`http://localhost:8873/schedules?doctorId=${doctor.id}&isAvailable=true`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }
    
    const schedules = await response.json();
    
    displayWeeklySchedule(schedules);
  } catch (error) {
    console.error('Error loading schedule:', error);
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
        <p style="margin-top: 16px;">Failed to load schedule. Make sure servers are running.</p>
      </div>
    `;
  }
}

function displayWeeklySchedule(schedules) {
  const modalBody = document.getElementById('scheduleModalBody');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  if (schedules.length === 0) {
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <span class="material-symbols-outlined" style="font-size: 48px;">event_busy</span>
        <p style="margin-top: 16px;">No schedule set yet. This doctor hasn't added their availability.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  days.forEach(day => {
    const daySchedules = schedules.filter(s => s.dayOfWeek === day);
    
    html += `<div class="schedule-day-section">`;
    html += `<div class="schedule-day-header">${day}</div>`;
    html += `<div class="schedule-day-slots">`;
    
    if (daySchedules.length === 0) {
      html += `<div class="no-schedule">Not available</div>`;
    } else {
      daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
      daySchedules.forEach(schedule => {
        html += `
          <div class="schedule-slot">
            <span class="material-symbols-outlined">schedule</span>
            <span>${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</span>
          </div>
        `;
      });
    }
    
    html += `</div></div>`;
  });
  
  modalBody.innerHTML = html;
}

// Setup close modal functionality
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.getElementById('closeScheduleModal');
  const modal = document.getElementById('scheduleModal');
  
  if (closeBtn) {
    closeBtn.onclick = function() {
      modal.classList.remove('show');
    };
  }
  
  if (modal) {
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    };
  }
});

async function validateTimeAgainstSchedule(date, time, doctorId) {
  try {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const response = await fetch(`http://localhost:8873/schedules?doctorId=${doctorId}&dayOfWeek=${dayOfWeek}&isAvailable=true`);
    
    if (!response.ok) {
      console.error('Failed to fetch doctor schedule');
      return false;
    }
    
    const schedules = await response.json();
    
    if (schedules.length === 0) {
      showMessage(`Doctor is not available on ${dayOfWeek}s.`, 'error');
      return false;
    }
    
    // Check if the selected time falls within any available schedule
    // Handle overnight schedules (e.g., 17:00 to 00:00)
    const isWithinSchedule = schedules.some(schedule => {
      if (schedule.startTime <= schedule.endTime) {
        // Normal schedule (e.g., 09:00 to 17:00)
        return time >= schedule.startTime && time <= schedule.endTime;
      } else {
        // Overnight schedule (e.g., 17:00 to 00:00)
        return time >= schedule.startTime || time <= schedule.endTime;
      }
    });
    
    if (!isWithinSchedule) {
      const availableTimes = schedules.map(s => `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`).join(', ');
      showMessage(`Selected time is outside doctor's availability. Available times: ${availableTimes}`, 'error');
      document.getElementById('appointmentTime').value = '';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating time:', error);
    return false;
  }
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function setupDateRestrictions() {
  const dateInput = document.getElementById('appointmentDate');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const minDate = tomorrow.toISOString().split('T')[0];
  dateInput.min = minDate;

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 3);
  dateInput.max = maxDate.toISOString().split('T')[0];
}

function setupFormSubmit() {
  const form = document.getElementById('bookingForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    const formData = {
      clinicId: document.getElementById('clinicSelect').value,
      doctorId: document.getElementById('selectedDoctorId').value,
      date: document.getElementById('appointmentDate').value,
      time: document.getElementById('appointmentTime').value,
      notes: document.getElementById('appointmentNotes').value,
      patientId: sessionStorage.getItem('userId'),
      status: 'pending'
    };

    if (isRescheduling) {
      updateAppointment(rescheduleAppointmentId, formData);
    } else {
      formData.createdAt = new Date().toISOString();
      saveAppointment(formData);
    }
  });
}

async function validateForm() {
  const clinicId = document.getElementById('clinicSelect').value;
  const doctorId = document.getElementById('selectedDoctorId').value;
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('appointmentTime').value;

  if (!clinicId) {
    showMessage('Please select a clinic', 'error');
    return false;
  }

  if (!doctorId) {
    showMessage('Please select a doctor from the suggestions', 'error');
    return false;
  }

  if (!date) {
    showMessage('Please select an appointment date', 'error');
    return false;
  }

  if (!time) {
    showMessage('Please select an appointment time', 'error');
    return false;
  }

  // Check doctor's availability for the selected date and time
  const isAvailable = await checkDoctorAvailability(doctorId, date, time);
  if (!isAvailable) {
    showMessage('The selected time is not within the doctor\'s available hours. Please choose another time.', 'error');
    return false;
  }

  // Check if patient already has appointment with same doctor on same day
  const patientId = sessionStorage.getItem('userId');
  const hasSameDoctorSameDay = await checkSameDoctorSameDay(patientId, doctorId, date);
  if (hasSameDoctorSameDay) {
    showMessage('You already have an appointment with this doctor on this date. Please choose a different date.', 'error');
    return false;
  }

  // Check for time conflicts with any doctor
  const hasTimeConflict = await checkTimeConflict(patientId, date, time);
  if (hasTimeConflict) {
    showMessage('You already have an appointment at this time with another doctor. Please choose a different time.', 'error');
    return false;
  }

  return true;
}

async function checkDoctorAvailability(doctorId, date, time) {
  try {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const response = await fetch(`http://localhost:8873/schedules?doctorId=${doctorId}&dayOfWeek=${dayOfWeek}&isAvailable=true`);
    
    if (!response.ok) {
      console.error('Failed to fetch doctor schedule');
      return false;
    }
    
    const schedules = await response.json();
    
    if (schedules.length === 0) {
      return false;
    }
    
    // Check if the selected time falls within any available schedule
    // Handle overnight schedules (e.g., 17:00 to 00:00)
    const isWithinSchedule = schedules.some(schedule => {
      if (schedule.startTime <= schedule.endTime) {
        // Normal schedule (e.g., 09:00 to 17:00)
        return time >= schedule.startTime && time <= schedule.endTime;
      } else {
        // Overnight schedule (e.g., 17:00 to 00:00)
        return time >= schedule.startTime || time <= schedule.endTime;
      }
    });
    
    return isWithinSchedule;
  } catch (error) {
    console.error('Error checking doctor availability:', error);
    return false;
  }
}

async function checkTimeConflict(patientId, date, time) {
  try {
    // Fetch all appointments for the patient
    const response = await fetch(`http://localhost:8876/appointments?patientId=${patientId}&isDeleted=false`);
    if (!response.ok) {
      console.error('Failed to fetch appointments');
      return false;
    }

    const appointments = await response.json();

    // Check if patient has any appointment at this exact time (regardless of doctor)
    const conflictingAppointment = appointments.find(apt => {
      const isSameDateTime = apt.date === date && apt.time === time;
      const isActiveAppointment = apt.status !== 'cancelled' && apt.status !== 'rejected';
      const isNotCurrentReschedule = !isRescheduling || apt.id !== rescheduleAppointmentId;
      
      return isSameDateTime && isActiveAppointment && isNotCurrentReschedule;
    });

    return !!conflictingAppointment;
  } catch (error) {
    console.error('Error checking time conflict:', error);
    return false;
  }
}

async function checkSameDoctorSameDay(patientId, doctorId, date) {
  try {
    // Fetch all appointments for the patient
    const response = await fetch(`http://localhost:8876/appointments?patientId=${patientId}&isDeleted=false`);
    if (!response.ok) {
      console.error('Failed to fetch appointments');
      return false;
    }

    const appointments = await response.json();

    // Check if patient has any appointment with same doctor on same date
    const sameDoctorSameDay = appointments.find(apt => {
      const isSameDoctor = apt.doctorId === doctorId;
      const isSameDate = apt.date === date;
      const isActiveAppointment = apt.status !== 'cancelled' && apt.status !== 'rejected';
      const isNotCurrentReschedule = !isRescheduling || apt.id !== rescheduleAppointmentId;
      
      return isSameDoctor && isSameDate && isActiveAppointment && isNotCurrentReschedule;
    });

    return !!sameDoctorSameDay;
  } catch (error) {
    console.error('Error checking same doctor same day:', error);
    return false;
  }
}

async function saveAppointment(appointmentData) {
  try {
    appointmentData.id = 'apt_' + Date.now();
    appointmentData.isDeleted = false;
    const appointmentResponse = await fetch('http://localhost:8876/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });

    if (!appointmentResponse.ok) {
      throw new Error('Failed to save appointment');
    }

    const savedAppointment = await appointmentResponse.json();

    await updateUserAppointments(appointmentData.patientId, savedAppointment.id);
    await updateUserAppointments(appointmentData.doctorId, savedAppointment.id);
    showMessage('Appointment booked successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'appointments.html';
    }, 1500);
  } catch (error) {
    console.error('Error saving appointment:', error);
    showMessage('Failed to book appointment. Please try again.', 'error');
  }
}

async function updateUserAppointments(userId, appointmentId) {
  try {
    const userResponse = await fetch(`http://localhost:8877/users/${userId}`);
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user');
    }

    const user = await userResponse.json();

    if (!user.appointments) {
      user.appointments = [];
    }
    user.appointments.push(appointmentId);

    const updateResponse = await fetch(`http://localhost:8877/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update user appointments');
    }
  } catch (error) {
    console.error(`Error updating user ${userId} appointments:`, error);
  }
}

function showMessage(message, type) {
  const existingMessages = document.querySelectorAll('.form-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = message;

  const form = document.getElementById('bookingForm');
  form.insertBefore(messageDiv, form.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

async function checkForReschedule() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('reschedule');

  if (appointmentId) {
    isRescheduling = true;
    rescheduleAppointmentId = appointmentId;
    await loadAppointmentData(appointmentId);

    const pageTitle = document.querySelector('.page-header h1');
    if (pageTitle) {
      pageTitle.textContent = 'Reschedule Appointment';
    }

    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Update Appointment';
    }
  }
}

async function checkForPreselectedDoctor() {
  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get('doctorId');

  if (doctorId && !isRescheduling) {
    const doctor = doctorsData.find(doc => doc.id === doctorId);
    if (doctor) {
      // Set clinic if doctor has one
      if (doctor.clinicId) {
        const clinicSelect = document.getElementById('clinicSelect');
        if (clinicSelect) {
          clinicSelect.value = doctor.clinicId;
          clinicSelect.dispatchEvent(new Event('change'));
        }
      }
      
      // Select the doctor
      selectDoctor(doctor);
      
      // Show info message
      showMessage(`Booking appointment with ${doctor.name}`, 'info');
    }
  }
}

async function loadAppointmentData(appointmentId) {
  try {
    const response = await fetch(`http://localhost:8876/appointments/${appointmentId}`);
    if (!response.ok) throw new Error('Failed to fetch appointment');

    const appointment = await response.json();

    document.getElementById('clinicSelect').value = appointment.clinicId;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('appointmentNotes').value = appointment.notes || '';

    const doctor = doctorsData.find(doc => doc.id === appointment.doctorId);
    if (doctor) {
      const clinicSelect = document.getElementById('clinicSelect');
      clinicSelect.dispatchEvent(new Event('change'));

      selectDoctor(doctor);
    }

    showMessage('You are rescheduling an existing appointment. Update the details below.', 'info');
  } catch (error) {
    console.error('Error loading appointment data:', error);
    showMessage('Failed to load appointment data. Please try again.', 'error');
  }
}

async function updateAppointment(appointmentId, appointmentData) {
  try {
    const existingResponse = await fetch(`http://localhost:8876/appointments/${appointmentId}`);
    if (!existingResponse.ok) throw new Error('Failed to fetch existing appointment');

    const existingAppointment = await existingResponse.json();

    const updatedAppointment = {
      ...existingAppointment,
      ...appointmentData,
      updatedAt: new Date().toISOString()
    };

    const updateResponse = await fetch(`http://localhost:8876/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedAppointment)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update appointment');
    }

    showMessage('Appointment rescheduled successfully!', 'success');

    setTimeout(() => {
      window.location.href = 'appointments.html';
    }, 1500);
  } catch (error) {
    console.error('Error updating appointment:', error);
    showMessage('Failed to reschedule appointment. Please try again.', 'error');
  }
}
