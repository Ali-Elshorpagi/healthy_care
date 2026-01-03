let menuItems = [
  {
    id: 'dashboard',
    label: 'Home',
    href: '../dashboard/dashboard.html',
    icon: 'home',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    href: '../appointments/appointments.html',
    icon: 'calendar_month',
  },
  {
    id: 'patient-records',
    label: 'Patient Records',
    href: '../patient-records/patient-records.html',
    icon: 'folder_shared',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '../profile/profile.html',
    icon: 'person',
  },
];

function buildSidebar(activePage) {
  let sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = '<div class="sidebar-menu">';
  html += '<div class="sidebar-brand">';
  html += '<span class="material-symbols-outlined brand-icon">medical_services</span>';
  html += '<span class="brand-text">Doctor Portal</span>';
  html += '</div>';
  html += '<p class="sidebar-label">Doctor Menu</p>';
  html += '<ul class="sidebar-nav">';

  for (let i = 0; i < menuItems.length; i++) {
    let item = menuItems[i];
    let isActive = item.id === activePage;
    html += '<li>';
    html +=
      '<a href="' + item.href + '"' + (isActive ? ' class="active"' : '') + '>';
    html +=
      '<span class="material-symbols-outlined icon">' + item.icon + '</span>';
    html += item.label;
    html += '</a></li>';
  }

  html += '</ul></div>';
  html += '<div class="sidebar-footer">';
  html += '<a href="#" class="logout-btn" id="logoutBtn">';
  html += '<span class="material-symbols-outlined icon">logout</span>';
  html += 'Logout</a></div>';

  sidebar.innerHTML = html;

  let logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../../auth/login/login.html';
      }
    };
  }
}

function buildHeader() {
  let header = document.getElementById('header');
  if (!header) return;

  let doctorName = sessionStorage.getItem('doctorName') || 'Doctor';
  let doctorSpecialization = sessionStorage.getItem('doctorSpecialization') || 'Specialist';

  let html = '<div class="header-left">';
  html += '<h2 class="page-title">Healthy Care</h2>';
  html += '</div>';
  html += '<div class="header-right">';
  html += '<div class="user-info">';
  html += '<div class="user-details">';
  html += '<p class="user-name">' + doctorName + '</p>';
  html += '<p class="user-role">' + doctorSpecialization + '</p>';
  html += '</div>';
  html += '<div class="user-avatar">';
  html += '<span class="material-symbols-outlined">person</span>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  header.innerHTML = html;
}
