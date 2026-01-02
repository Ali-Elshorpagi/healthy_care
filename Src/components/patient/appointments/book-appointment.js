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

    // Filter only doctors
    doctorsData = allUsers.filter(user => user.role === 'doctor').map(doctor => ({
      id: doctor.id,
      name: doctor.fullName,
      specialization: doctor.specialization || 'General Practice',
      clinicId: doctor.clinicId || 'clinic1',
      clinicName: doctor.clinicName || 'City Medical Center'
    }));

    filteredDoctors = doctorsData;
  } catch (error) {
    console.error('Error loading doctors:', error);
    doctorsData = [
      {
        id: 'doc1',
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        clinicId: 'clinic1',
        clinicName: 'City Medical Center'
      },
      {
        id: 'doc2',
        name: 'Dr. Michael Chen',
        specialization: 'General Practice',
        clinicId: 'clinic2',
        clinicName: 'General Hospital'
      }
    ];
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

  doctorInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase().trim();

    if (searchTerm.length === 0) {
      suggestionsContainer.classList.remove('show');
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) {
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

function validateForm() {
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

  return true;
}

async function saveAppointment(appointmentData) {
  try {
    appointmentData.id = 'apt_' + Date.now();
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
