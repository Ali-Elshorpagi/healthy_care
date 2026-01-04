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

  appointments.forEach(apt => {
    const date = new Date(apt.date);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });

    const status = getAppointmentStatus(apt);
    const badgeClass = getStatusBadgeClass(status);

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
        ${apt.notes ? `<p class="appointment-notes">${apt.notes}</p>` : ''}
        <span class="badge ${badgeClass}">${status}</span>
      </div>
      <div class="actions-col">
        ${status === 'Upcoming' ? `
          <button class="btn btn-secondary btn-sm" onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
          <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>
        ` : ''}
        ${status === 'Completed' ? `
          <button class="btn btn-secondary btn-sm" onclick="viewDetails('${apt.id}')">View Details</button>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
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

function viewDetails(appointmentId) {
  alert('View details functionality - to be implemented');
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
