document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('dashboard');
  loadPatientInfo();
  setupSearch();
});

const allDoctors = [
  {
    id: 'doc1',
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    clinic: 'City Medical Center',
    rating: 4.9,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'
  },
  {
    id: 'doc2',
    name: 'Dr. Michael Chen',
    specialization: 'General Practice',
    clinic: 'General Hospital',
    rating: 4.8,
    experience: '12 years',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200'
  },
  {
    id: 'doc3',
    name: 'Dr. Emily Brown',
    specialization: 'Dermatology',
    clinic: 'City Medical Center',
    rating: 4.7,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200'
  },
  {
    id: 'doc4',
    name: 'Dr. James Wilson',
    specialization: 'Orthopedics',
    clinic: 'Health Plus Clinic',
    rating: 4.9,
    experience: '18 years',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200'
  },
  {
    id: 'doc5',
    name: 'Dr. Lisa Anderson',
    specialization: 'Pediatrics',
    clinic: 'General Hospital',
    rating: 4.8,
    experience: '14 years',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=200'
  },
  {
    id: 'doc6',
    name: 'Dr. Robert Taylor',
    specialization: 'Neurology',
    clinic: 'Family Care Center',
    rating: 4.9,
    experience: '20 years',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200'
  },
  {
    id: 'doc7',
    name: 'Dr. Maria Garcia',
    specialization: 'Internal Medicine',
    clinic: 'Health Plus Clinic',
    rating: 4.7,
    experience: '11 years',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=200'
  },
  {
    id: 'doc8',
    name: 'Dr. David Lee',
    specialization: 'Psychiatry',
    clinic: 'Family Care Center',
    rating: 4.8,
    experience: '16 years',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200'
  }
];

let selectedSuggestionIndex = -1;

function loadPatientInfo() {
  let name = sessionStorage.getItem('patientName') || 'Sarah';
  let firstName = name.split(' ')[0];
  let welcome = document.getElementById('welcomeText');
  if (welcome) {
    welcome.textContent = 'Welcome Back, ' + firstName;
  }
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsContainer = document.getElementById('searchSuggestions');
  const clearSearchBtn = document.getElementById('clearSearch');

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();

    if (query.length === 0) {
      suggestionsContainer.classList.remove('show');
      return;
    }

    const matches = allDoctors.filter(doctor =>
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
    const suggestions = suggestionsContainer.querySelectorAll('.search-suggestion-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
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
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove('show');
    }
  });
}

function displaySearchSuggestions(doctors) {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  suggestionsContainer.innerHTML = '';
  selectedSuggestionIndex = -1;

  if (doctors.length === 0) {
    suggestionsContainer.innerHTML = '<div class="no-suggestions">No doctors found</div>';
    suggestionsContainer.classList.add('show');
    return;
  }

  doctors.slice(0, 5).forEach((doctor, index) => {
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
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const clinicType = document.getElementById('clinicTypeSelect').value;

  if (!query) {
    return;
  }

  document.getElementById('searchSuggestions').classList.remove('show');

  let results = allDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(query) ||
    doctor.specialization.toLowerCase().includes(query) ||
    doctor.clinic.toLowerCase().includes(query)
  );

  if (clinicType) {
    results = results.filter(doctor =>
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

  resultsContent.innerHTML = results.map(doctor => `
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
        <button class="btn btn-secondary" onclick="viewProfile('${doctor.id}')">
          View Profile
        </button>
      </div>
    </div>
  `).join('');
}

function bookAppointment(doctorId) {
  window.location.href = `../appointments/book-appointment.html?doctorId=${doctorId}`;
}

function viewProfile(doctorId) {
  console.log('View profile for doctor:', doctorId);
  alert('Doctor profile feature coming soon!');
}
