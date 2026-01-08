document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('appointments');
  loadAppointments();
  setupBookBtn();
  setupSortSelect();
});

function setupFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  const empty = document.getElementById('emptyState');
  const list = document.getElementById('appointmentsList');

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      const cards = document.querySelectorAll('.appointment-card');
      let visible = 0;

      cards.forEach(card => {
        const status = card.getAttribute('data-status');
        if (filter === 'all' || status === filter) {
          card.style.display = 'table';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      if (visible === 0) {
        list.style.display = 'none';
        empty.classList.remove('hidden');
      } else {
        list.style.display = 'block';
        empty.classList.add('hidden');
      }
    });
  });
}

function setupBookBtn() {
  let btn = document.getElementById('bookBtn');
  if (btn) {
    btn.onclick = function (e) {
      e.preventDefault();
      window.location.href = 'book-appointment.html';
    };
  }
}

async function loadAppointments() {
  try {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      showEmptyState();
      return;
    }

    const [appointmentsResponse, usersResponse] = await Promise.all([
      fetch('http://localhost:8876/appointments'),
      fetch('http://localhost:8877/users')
    ]);

    if (!appointmentsResponse.ok) {
      throw new Error('Failed to fetch appointments');
    }

    const allAppointments = await appointmentsResponse.json();
    const allUsers = await usersResponse.json();

    // Get list of existing approved doctor IDs
    const existingDoctorIds = allUsers
      .filter(user => user.role === 'doctor' && user.approved === 'approved')
      .map(doc => doc.id);

    // Filter appointments: user's appointments, not deleted, and doctor still exists
    const userAppointments = allAppointments.filter(apt =>
      apt.patientId === userId &&
      !apt.isDeleted &&
      existingDoctorIds.includes(apt.doctorId)
    );

    if (userAppointments.length === 0) {
      showEmptyState();
      return;
    }

    const appointmentsWithDetails = userAppointments.map(apt => {
      const doctor = allUsers.find(u => u.id === apt.doctorId);
      return {
        ...apt,
        doctorName: doctor ? doctor.fullName : 'Unknown Doctor',
        doctorSpecialization: doctor ? (doctor.specialization || 'General Practice') : 'N/A'
      };
    });

    renderAppointments(appointmentsWithDetails);
    setupFilters();
  } catch (error) {
    console.error('Error loading appointments:', error);
    showError('Failed to load appointments. Please make sure JSON Server is running.');
  }
}

function renderAppointments(appointments) {
  const container = document.getElementById('appointmentsList');
  container.innerHTML = '';

  appointments.forEach(async apt => {
    const date = new Date(apt.date);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });

    const status = getAppointmentStatus(apt);
    const badgeClass = getStatusBadgeClass(status);

    // Check if already rated
    const userId = sessionStorage.getItem('userId');
    let alreadyRated = false;
    
    if (status === 'Completed' && userId) {
      try {
        const ratingsResponse = await fetch('http://localhost:8876/ratings');
        const ratings = await ratingsResponse.json();
        alreadyRated = ratings.some(r => 
          r.appointmentId === apt.id && 
          r.patientId === parseInt(userId)
        );
      } catch (error) {
        console.error('Error checking rating status:', error);
      }
    }

    const card = document.createElement('div');
    card.className = 'appointment-card';
    card.setAttribute('data-status', status.toLowerCase());
    card.innerHTML = `
      <div class="date-col">
        <div class="date-box">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
      </div>
      <div class="info-col">
        <p class="list-title">${apt.doctorName}</p>
        <p class="list-meta">
          <span><span class="material-symbols-outlined meta-icon">schedule</span>${apt.time}</span>
          <span><span class="material-symbols-outlined meta-icon">medical_services</span>${apt.doctorSpecialization}</span>
        </p>
        ${apt.notes ? `<p class="appointment-notes">${truncateText(apt.notes, 80)}</p>` : ''}
        <span class="badge ${badgeClass}">${status}</span>
      </div>
      <div class="actions-col">
        ${status === 'Upcoming' ? `
          <button class="btn btn-secondary btn-sm" onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
          <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>
        ` : ''}
        ${status === 'Completed' ? `
          <button class="btn btn-secondary btn-sm" onclick="viewDetails('${apt.id}')">View Details</button>
          ${!alreadyRated ? `
            <button class="btn btn-primary btn-sm" onclick="openRatingModal('${apt.id}', '${apt.doctorName}', '${apt.doctorId}')">
              <span class="material-symbols-outlined" style="font-size: 16px;">star</span>
              Rate Doctor
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.6;">
              <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span>
              Rated
            </button>
          `}
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

function truncateText(text, maxLength = 80) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getAppointmentStatus(appointment) {
  if (appointment.status === 'cancelled') return 'Cancelled';
  if (appointment.status === 'completed') return 'Completed';

  const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
  const now = new Date();

  if (appointmentDate < now) {
    return 'Completed';
  }

  return 'Upcoming';
}

function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case 'upcoming':
      return 'badge-blue';
    case 'completed':
      return 'badge-green';
    case 'cancelled':
      return 'badge-red';
    default:
      return 'badge-gray';
  }
}

function showEmptyState() {
  const container = document.getElementById('appointmentsList');
  container.style.display = 'none';

  const emptyState = document.getElementById('emptyState');
  if (emptyState) {
    emptyState.classList.remove('hidden');
  }
}

function showError(message) {
  const container = document.getElementById('appointmentsList');
  container.innerHTML = `
    <div style="padding: 2rem; text-align: center; color: #ef4444;">
      <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
      <p style="margin-top: 1rem; font-size: 1.1rem;">${message}</p>
    </div>
  `;
}

async function cancelAppointment(appointmentId) {
  if (!confirm('Are you sure you want to cancel this appointment?')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:8876/appointments/${appointmentId}`);
    if (!response.ok) throw new Error('Failed to fetch appointment');

    const appointment = await response.json();
    appointment.status = 'cancelled';

    const updateResponse = await fetch(`http://localhost:8876/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointment)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to cancel appointment');
    }

    alert('Appointment cancelled successfully');
    loadAppointments();
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    alert('Failed to cancel appointment. Please try again.');
  }
}

async function rescheduleAppointment(appointmentId) {
  window.location.href = `book-appointment.html?reschedule=${appointmentId}`;
}

async function viewDetails(appointmentId) {
  try {
    const aptResponse = await fetch(`http://localhost:8876/appointments/${appointmentId}`);
    if (!aptResponse.ok) throw new Error('Failed to fetch appointment');
    const appointment = await aptResponse.json();

    const doctorResponse = await fetch(`http://localhost:8877/users/${appointment.doctorId}`);
    if (!doctorResponse.ok) throw new Error('Failed to fetch doctor');
    const doctor = await doctorResponse.json();

    const date = new Date(appointment.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    document.getElementById('detailsAppointmentId').textContent = `#${appointment.id}`;
    document.getElementById('detailsDoctorName').textContent = doctor.fullName;
    document.getElementById('detailsSpecialization').textContent = doctor.specialization || 'General Practice';
    document.getElementById('detailsDate').textContent = formattedDate;
    document.getElementById('detailsTime').textContent = appointment.time;
    document.getElementById('detailsClinic').textContent = doctor.clinic || 'BelShefaa ISA';
    
    const statusBadge = document.getElementById('detailsStatusBadge');
    statusBadge.textContent = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
    statusBadge.className = 'badge ' + getStatusBadgeClass(getAppointmentStatus(appointment));
    
    document.getElementById('detailsNotes').textContent = appointment.notes || 'No notes provided';
    document.getElementById('detailsEmail').textContent = doctor.email || 'N/A';
    document.getElementById('detailsPhone').textContent = doctor.phoneNumber || 'N/A';

    document.getElementById('detailsModal').classList.add('show');
  } catch (error) {
    console.error('Error loading appointment details:', error);
    alert('Failed to load appointment details. Please try again.');
  }
}

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('show');
}

function setupSortSelect() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', function () {
    const sortBy = this.value;
    sortAppointments(sortBy);
  });
}

function sortAppointments(sortBy) {
  const container = document.getElementById('appointmentsList');
  const cards = Array.from(container.querySelectorAll('.appointment-card'));

  cards.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const dateA = a.querySelector('.day').textContent;
        const monthA = a.querySelector('.month').textContent;
        const dateB = b.querySelector('.day').textContent;
        const monthB = b.querySelector('.month').textContent;

        const fullDateA = new Date(`${monthA} ${dateA}, 2026`);
        const fullDateB = new Date(`${monthB} ${dateB}, 2026`);

        return fullDateA - fullDateB;

      case 'doctor':
        const doctorA = a.querySelector('.list-title').textContent.toLowerCase();
        const doctorB = b.querySelector('.list-title').textContent.toLowerCase();
        return doctorA.localeCompare(doctorB);

      case 'status':
        // Upcoming > Completed > Cancelled
        const statusOrder = { 'upcoming': 1, 'completed': 2, 'cancelled': 3 };
        const statusA = a.getAttribute('data-status');
        const statusB = b.getAttribute('data-status');
        return statusOrder[statusA] - statusOrder[statusB];

      default:
        return 0;
    }
  });

  cards.forEach(card => container.appendChild(card));
}
// Rating functionality
let currentRatingData = {
  appointmentId: null,
  doctorName: '',
  doctorId: null,
  rating: 0
};

function openRatingModal(appointmentId, doctorName, doctorId) {
  currentRatingData = {
    appointmentId,
    doctorName,
    doctorId: typeof doctorId === 'string' ? doctorId : String(doctorId),
    rating: 0
  };

  document.getElementById('modalDoctorName').textContent = doctorName;
  document.getElementById('ratingComment').value = '';
  document.getElementById('ratingText').textContent = 'Click a star to rate';
  
  // Reset stars
  document.querySelectorAll('.star').forEach(star => {
    star.classList.remove('active');
  });

  const modal = document.getElementById('ratingModal');
  modal.classList.add('show');
}

function closeRatingModal() {
  const modal = document.getElementById('ratingModal');
  modal.classList.remove('show');
  currentRatingData = {
    appointmentId: null,
    doctorName: '',
    doctorId: null,
    rating: 0
  };
}

function selectRating(rating) {
  currentRatingData.rating = rating;
  
  const ratingTexts = {
    1: 'Poor - Not satisfied',
    2: 'Fair - Could be better',
    3: 'Good - Satisfied',
    4: 'Very Good - Highly satisfied',
    5: 'Excellent - Extremely satisfied'
  };
  
  document.getElementById('ratingText').textContent = ratingTexts[rating];
  
  // Update star visuals
  document.querySelectorAll('.star').forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

async function submitRating() {
  if (currentRatingData.rating === 0) {
    alert('Please select a rating before submitting.');
    return;
  }

  const comment = document.getElementById('ratingComment').value.trim();
  const userId = sessionStorage.getItem('userId');

  if (!userId) {
    alert('User not logged in.');
    return;
  }

  try {
    // Check if already rated
    const existingRatingsResponse = await fetch('http://localhost:8876/ratings');
    const existingRatings = await existingRatingsResponse.json();
    
    const alreadyRated = existingRatings.find(r => 
      r.appointmentId === currentRatingData.appointmentId && 
      r.patientId === parseInt(userId)
    );

    if (alreadyRated) {
      alert('You have already rated this appointment.');
      closeRatingModal();
      return;
    }

    // Create new rating
    const newRating = {
      patientId: parseInt(userId),
      doctorId: currentRatingData.doctorId,
      appointmentId: currentRatingData.appointmentId,
      rating: currentRatingData.rating,
      comment: comment,
      createdAt: new Date().toISOString()
    };

    const ratingResponse = await fetch('http://localhost:8876/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRating)
    });

    if (!ratingResponse.ok) {
      throw new Error('Failed to submit rating');
    }

    // Update doctor's average rating
    await updateDoctorRating(currentRatingData.doctorId);

    alert('Thank you for your feedback!');
    closeRatingModal();
    loadAppointments(); // Refresh to hide the rate button

  } catch (error) {
    console.error('Error submitting rating:', error);
    alert('Failed to submit rating. Please try again.');
  }
}

async function updateDoctorRating(doctorId) {
  try {
    // Get all ratings for this doctor
    const ratingsResponse = await fetch('http://localhost:8876/ratings');
    const allRatings = await ratingsResponse.json();
    const doctorRatings = allRatings.filter(r => r.doctorId === doctorId);

    if (doctorRatings.length === 0) return;

    // Calculate average
    const sum = doctorRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / doctorRatings.length;

    // Update doctor record
    const doctorResponse = await fetch(`http://localhost:8877/users/${doctorId}`);
    const doctor = await doctorResponse.json();
    
    doctor.averageRating = parseFloat(average.toFixed(1));
    doctor.totalRatings = doctorRatings.length;

    await fetch(`http://localhost:8877/users/${doctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(doctor)
    });

  } catch (error) {
    console.error('Error updating doctor rating:', error);
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const ratingModal = document.getElementById('ratingModal');
  const detailsModal = document.getElementById('detailsModal');
  
  if (event.target === ratingModal) {
    closeRatingModal();
  }
  
  if (event.target === detailsModal) {
    closeDetailsModal();
  }
});
