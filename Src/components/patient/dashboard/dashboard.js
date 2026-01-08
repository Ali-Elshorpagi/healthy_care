document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('dashboard');
  loadPatientInfo();
  loadDoctors();
  loadUpcomingAppointments();
  loadStats();
  loadDoctorsSlider();
});

let allDoctors = [];
let selectedSuggestionIndex = -1;

async function loadDoctors() {
  try {
    const response = await fetch('http://localhost:8877/users');
    if (!response.ok) throw new Error('Failed to fetch doctors');

    const allUsers = await response.json();

    allDoctors = allUsers
      .filter((user) => user.role === 'doctor' && user.approved === 'approved')
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.fullName,
        specialization: doctor.specialization || 'General Practice',
        clinic: doctor.clinicName || 'City Medical Center',
        rating: doctor.averageRating ? doctor.averageRating.toFixed(1) : 'New',
        totalRatings: doctor.totalRatings || 0,
        experience: doctor.experience || '5+ years',
        image:
          doctor.profileImage ||
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
      }));

    setupSearch();
  } catch (error) {
    console.error('Error loading doctors:', error);
    allDoctors = [];
    setupSearch();
  }
}

function loadPatientInfo() {
  const name =
    sessionStorage.getItem('patientName') ||
    sessionStorage.getItem('userName') ||
    'Sarah';
  let firstName = name.split(' ')[0];
  let welcome = document.getElementById('welcomeText');
  if (welcome) {
    welcome.textContent = 'Welcome Back, ' + firstName;
  }
}

async function loadStats() {
  try {
    const response = await fetch('../../../database/users.json');
    const data = await response.json();

    const patients = data.users.filter((user) => user.role === 'patient');
    const doctors = data.users.filter(
      (user) => user.role === 'doctor' && user.approved === 'approved'
    );

    const patientsCountEl = document.getElementById('patientsCount');
    const doctorsCountEl = document.getElementById('doctorsCount');

    if (patientsCountEl)
      patientsCountEl.textContent = patients.length.toLocaleString();
    if (doctorsCountEl)
      doctorsCountEl.textContent = doctors.length.toLocaleString();
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsContainer = document.getElementById('searchSuggestions');
  const clearSearchBtn = document.getElementById('clearSearch');

  // Show all doctors when input is focused
  searchInput.addEventListener('focus', function () {
    const query = this.value.toLowerCase().trim();
    if (query.length === 0) {
      displaySearchSuggestions(allDoctors);
    } else {
      const matches = allDoctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(query) ||
          doctor.specialization.toLowerCase().includes(query) ||
          doctor.clinic.toLowerCase().includes(query)
      );
      displaySearchSuggestions(matches);
    }
  });

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();

    // Show all doctors if input is empty, otherwise filter
    if (query.length === 0) {
      displaySearchSuggestions(allDoctors);
      return;
    }

    const matches = allDoctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query) ||
        doctor.clinic.toLowerCase().includes(query)
    );

    displaySearchSuggestions(matches);
  });

  if (searchBtn) {
    searchBtn.onclick = function () {
      performSearch();
    };
  }

  searchInput.addEventListener('keydown', function (e) {
    const suggestions = suggestionsContainer.querySelectorAll(
      '.search-suggestion-item'
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        suggestions.length - 1
      );
      updateActiveSuggestion(suggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
      updateActiveSuggestion(suggestions);
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
        e.preventDefault();
        suggestions[selectedSuggestionIndex].click();
      } else {
        e.preventDefault();
        performSearch();
      }
    } else if (e.key === 'Escape') {
      suggestionsContainer.classList.remove('show');
    }
  });

  if (clearSearchBtn) {
    clearSearchBtn.onclick = function () {
      searchInput.value = '';
      document.getElementById('searchResults').classList.add('hidden');
      document.querySelector('.content-grid').classList.remove('hidden');
    };
  }

  document.addEventListener('click', function (e) {
    if (
      !searchInput.contains(e.target) &&
      !suggestionsContainer.contains(e.target)
    ) {
      suggestionsContainer.classList.remove('show');
    }
  });
}

function displaySearchSuggestions(doctors) {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  suggestionsContainer.innerHTML = '';
  selectedSuggestionIndex = -1;

  if (doctors.length === 0) {
    suggestionsContainer.innerHTML =
      '<div class="no-suggestions">No doctors found</div>';
    suggestionsContainer.classList.add('show');
    return;
  }

  // Show all doctors (not limited to 5)
  doctors.forEach((doctor, index) => {
    const item = document.createElement('div');
    item.className = 'search-suggestion-item';
    item.innerHTML = `
      <div class="suggestion-avatar">
        <img src="${doctor.image}" alt="${doctor.name}" />
      </div>
      <div class="suggestion-info">
        <div class="suggestion-name">${doctor.name}</div>
        <div class="suggestion-details">${doctor.specialization} • ${doctor.clinic}</div>
      </div>
      <div class="suggestion-rating">
        <span class="star">★</span> ${doctor.rating}
      </div>
    `;

    item.addEventListener('click', function () {
      document.getElementById('searchInput').value = doctor.name;
      suggestionsContainer.classList.remove('show');
      performSearch();
    });

    suggestionsContainer.appendChild(item);
  });

  suggestionsContainer.classList.add('show');
}

function updateActiveSuggestion(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function performSearch() {
  const query = document
    .getElementById('searchInput')
    .value.toLowerCase()
    .trim();
  const clinicType = document.getElementById('clinicTypeSelect').value;

  if (!query) {
    return;
  }

  document.getElementById('searchSuggestions').classList.remove('show');

  let results = allDoctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.clinic.toLowerCase().includes(query)
  );

  if (clinicType) {
    results = results.filter((doctor) =>
      doctor.specialization.toLowerCase().includes(clinicType.toLowerCase())
    );
  }

  displaySearchResults(results);
}

function displaySearchResults(results) {
  const resultsSection = document.getElementById('searchResults');
  const resultsContent = document.getElementById('searchResultsContent');
  const contentGrid = document.querySelector('.content-grid');

  resultsSection.classList.remove('hidden');
  contentGrid.classList.add('hidden');

  if (results.length === 0) {
    resultsContent.innerHTML = `
      <div class="no-results">
        <span class="material-symbols-outlined icon">search_off</span>
        <h3>No Results Found</h3>
        <p>Try adjusting your search terms</p>
      </div>
    `;
    return;
  }

  resultsContent.innerHTML = results
    .map(
      (doctor) => `
    <div class="doctor-result-card">
      <div class="doctor-image">
        <img src="${doctor.image}" alt="${doctor.name}" />
        <span class="rating"><span class="star">★</span> ${doctor.rating}</span>
      </div>
      <div class="doctor-info">
        <h3>${doctor.name}</h3>
        <p class="specialization">${doctor.specialization}</p>
        <p class="clinic">
          <span class="material-symbols-outlined">local_hospital</span>
          ${doctor.clinic}
        </p>
        <p class="experience">
          <span class="material-symbols-outlined">work</span>
          ${doctor.experience} experience
        </p>
      </div>
      <div class="doctor-actions">
        <button class="btn btn-primary" onclick="bookAppointment('${doctor.id}')">
          <span class="material-symbols-outlined">calendar_add_on</span>
          Book Appointment
        </button>

      </div>
    </div>
  `
    )
    .join('');
}

function bookAppointment(doctorId) {
  window.location.href = `../appointments/book-appointment.html?doctorId=${doctorId}`;
}

async function loadUpcomingAppointments() {
  try {
    const userId =
      sessionStorage.getItem('userId') || sessionStorage.getItem('patientId');

    if (!userId) {
      displayNoAppointments();
      return;
    }

    const [appointmentsResponse, usersResponse] = await Promise.all([
      fetch('../../../database/appointments.json'),
      fetch('../../../database/users.json'),
    ]);

    const appointmentsData = await appointmentsResponse.json();
    const usersData = await usersResponse.json();

    // Get list of existing approved doctor IDs
    const existingDoctorIds = usersData.users
      .filter((user) => user.role === 'doctor' && user.approved === 'approved')
      .map((doc) => doc.id);

    const patientAppointments = appointmentsData.appointments
      .filter(
        (apt) =>
          apt.patientId === userId &&
          apt.status !== 'cancelled' &&
          !apt.isDeleted &&
          existingDoctorIds.includes(apt.doctorId)
      )
      .map((apt) => {
        const doctor = usersData.users.find((u) => u.id === apt.doctorId);
        return {
          ...apt,
          doctor: doctor || {
            id: apt.doctorId,
            fullName: 'Doctor',
            specialization: 'General Practice',
            profileImage:
              'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
          },
        };
      });

    const now = new Date();

    const upcomingAppointments = patientAppointments
      .filter((apt) => {
        const appointmentDate = new Date(apt.date + 'T' + apt.time);
        return appointmentDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
      });

    const pastAppointments = patientAppointments
      .filter((apt) => {
        const appointmentDate = new Date(apt.date + 'T' + apt.time);
        return appointmentDate < now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
      });

    if (upcomingAppointments.length > 0) {
      displayUpcomingAppointments(upcomingAppointments);
    } else if (pastAppointments.length > 0) {
      displayUpcomingAppointments([pastAppointments[0]]);
    } else {
      displayNoAppointments();
    }
  } catch (error) {
    console.error('Error loading appointments:', error);
    displayNoAppointments();
  }
}

function displayUpcomingAppointments(appointments) {
  const featuredAppt = document.querySelector('.featured-appt');
  if (!featuredAppt) return;

  const firstAppointment = appointments[0];
  const doctor = firstAppointment.doctor;

  // Format date and time
  const appointmentDate = new Date(
    firstAppointment.date + 'T' + firstAppointment.time
  );
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateString;
  if (appointmentDate.toDateString() === today.toDateString()) {
    dateString = 'Today';
  } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
    dateString = 'Tomorrow';
  } else {
    dateString = appointmentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const timeString = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Determine badge class based on status
  let statusBadgeClass = 'badge-green';
  let statusText = 'Confirmed';
  if (firstAppointment.status === 'pending') {
    statusBadgeClass = 'badge-yellow';
    statusText = 'Pending';
  } else if (firstAppointment.status === 'accepted') {
    statusBadgeClass = 'badge-green';
    statusText = 'Confirmed';
  }

  featuredAppt.innerHTML = `
    <div class="top" style="cursor: pointer;" onclick="window.location.href='../appointments/appointments.html'">
      <div class="img-col">
        <img
          src="${
            doctor.profileImage ||
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
          }"
          alt="${doctor.fullName}"
        />
      </div>
      <div class="info-col">
        <div class="badges">
          <span class="badge ${statusBadgeClass}">${statusText}</span>
          ${
            firstAppointment.type
              ? `<span class="badge badge-purple">${firstAppointment.type}</span>`
              : ''
          }
        </div>
        <h3>Appointment with ${doctor.fullName}</h3>
        <p class="desc">${
          firstAppointment.notes ||
          doctor.specialization ||
          'Medical consultation'
        }</p>
        <div class="meta-row">
          <span class="material-symbols-outlined icon">schedule</span>
          ${dateString}, ${timeString}
        </div>
        <div class="meta-row">
          <span class="material-symbols-outlined icon">local_hospital</span>
          ${doctor.specialization || 'General Practice'}
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='../appointments/appointments.html'">View Details</button>
          <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='../appointments/appointments.html'">Reschedule</button>
        </div>
      </div>
    </div>
    ${
      appointments.length > 1
        ? appointments
            .slice(1, 2)
            .map((apt) => {
              const aptDate = new Date(apt.date + 'T' + apt.time);
              return `
        <div class="simple-list-item" style="cursor: pointer;" onclick="window.location.href='../appointments/appointments.html'">
          <div class="icon-col">
            <span class="list-icon purple">
              <span class="material-symbols-outlined">calendar_month</span>
            </span>
          </div>
          <div class="content-col">
            <h4>Appointment with ${apt.doctor.fullName}</h4>
            <p>${aptDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} • ${apt.doctor.specialization || 'General Practice'}</p>
          </div>
          <div class="arrow-col">
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
      `;
            })
            .join('')
        : ''
    }
  `;
}

function displayNoAppointments() {
  const featuredAppt = document.querySelector('.featured-appt');
  if (!featuredAppt) return;

  featuredAppt.innerHTML = `
    <div class="top" style="text-align: center; padding: 40px;">
      <div style="opacity: 0.5;">
        <span class="material-symbols-outlined" style="font-size: 64px; color: #6366f1;">event_busy</span>
        <h3 style="margin-top: 16px; color: #64748b;">No Upcoming Appointments</h3>
        <p style="color: #94a3b8; margin-bottom: 24px;">Book an appointment with a doctor to get started</p>
        <button class="btn btn-primary" onclick="window.location.href='../appointments/book-appointment.html'">
          <span class="material-symbols-outlined">add</span>
          Book Appointment
        </button>
      </div>
    </div>
  `;
}

let currentSlideIndex = 0;
let slidersPerView = 3;

async function loadDoctorsSlider() {
  try {
    const response = await fetch('http://localhost:8877/users');
    if (!response.ok) throw new Error('Failed to fetch doctors');

    const allUsers = await response.json();

    const doctors = allUsers
      .filter((user) => user.role === 'doctor' && user.approved === 'approved')
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.fullName,
        specialization: doctor.specialization || 'General Practice',
        clinic: doctor.clinicName || 'City Medical Center',
        rating: doctor.averageRating ? doctor.averageRating.toFixed(1) : 'New',
        totalRatings: doctor.totalRatings || 0,
        experience: doctor.experience || '5+ years',
        image: doctor.profileImage || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
      }));

    displayDoctorsSlider(doctors);
    setupSliderControls(doctors.length);
    updateSlidersPerView();
    window.addEventListener('resize', updateSlidersPerView);
  } catch (error) {
    console.error('Error loading doctors slider:', error);
  }
}

function displayDoctorsSlider(doctors) {
  const slider = document.getElementById('doctorsSlider');
  if (!slider) return;

  slider.innerHTML = doctors
    .map(
      (doctor) => `
    <div class="doctor-slider-card">
      <div class="doctor-slider-image">
        <img src="${doctor.image}" alt="${doctor.name}" />
        <span class="rating"><span class="star">★</span> ${doctor.rating}</span>
      </div>
      <div class="doctor-slider-info">
        <h3>${doctor.name}</h3>
        <p class="specialization">${doctor.specialization}</p>
        <p class="clinic">
          <span class="material-symbols-outlined">local_hospital</span>
          ${doctor.clinic}
        </p>
        <p class="experience">
          <span class="material-symbols-outlined">work</span>
          ${doctor.experience} experience
        </p>
      </div>
      <div class="doctor-slider-actions">
        <button class="btn btn-primary" onclick="bookAppointment('${doctor.id}')">
          <span class="material-symbols-outlined">calendar_add_on</span>
          Book Appointment
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

function setupSliderControls(totalDoctors) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const slider = document.getElementById('doctorsSlider');

  if (!prevBtn || !nextBtn || !slider) return;

  prevBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      updateSliderPosition(slider);
    }
  });

  nextBtn.addEventListener('click', () => {
    const maxIndex = Math.max(0, totalDoctors - slidersPerView);
    if (currentSlideIndex < maxIndex) {
      currentSlideIndex++;
      updateSliderPosition(slider);
    }
  });

  updateSliderButtons(totalDoctors);
}

function updateSliderPosition(slider) {
  const cardWidth = 320;
  const gap = 24;
  const offset = currentSlideIndex * (cardWidth + gap);
  slider.style.transform = `translateX(-${offset}px)`;
  
  const totalDoctors = slider.children.length;
  updateSliderButtons(totalDoctors);
}

function updateSliderButtons(totalDoctors) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) prevBtn.disabled = currentSlideIndex === 0;
  if (nextBtn) nextBtn.disabled = currentSlideIndex >= Math.max(0, totalDoctors - slidersPerView);
}

function updateSlidersPerView() {
  const width = window.innerWidth;
  if (width < 768) {
    slidersPerView = 1;
  } else if (width < 1200) {
    slidersPerView = 2;
  } else {
    slidersPerView = 3;
  }
  
  const slider = document.getElementById('doctorsSlider');
  if (slider) {
    const totalDoctors = slider.children.length;
    currentSlideIndex = Math.min(currentSlideIndex, Math.max(0, totalDoctors - slidersPerView));
    updateSliderPosition(slider);
  }
}
