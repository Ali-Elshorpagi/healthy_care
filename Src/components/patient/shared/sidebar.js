let menuItems = [
  {
    id: 'dashboard',
    label: 'Home',
    href: '../dashboard/dashboard.html',
    icon: 'home',
  },
  {
    id: 'appointments',
    label: 'My Appointments',
    href: '../appointments/appointments.html',
    icon: 'calendar_month',
  },
  {
    id: 'medical-records',
    label: 'Medical Records',
    href: '../medical-records/medical-records.html',
    icon: 'description',
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
  html += '<p class="sidebar-label">Patient Menu</p>';
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

  let name = sessionStorage.getItem('patientName') || 'User';

  let html = '<div class="header-inner">';
  html += '<div class="header-left">';
  html += '<a href="../dashboard/dashboard.html" class="logo">';
  html += '<span class="material-symbols-outlined logo-icon">add</span>';
  html += '<span class="logo-text">Healthy</span></a></div>';
  html += '<div class="header-right">';
  html += '<div class="nav-links">';
  html += '<a href="#">About Us</a>';
  html += '<a href="../../FAQs/FAQs.html">FAQs</a>';
  html += '<a href="#">Contact Us</a></div>';
  html += '<div class="header-avatar">';
  html +=
    '<img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400" alt="' +
    name +
    '">';
  html += '</div></div></div>';

  header.innerHTML = html;
}
