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

  let name = sessionStorage.getItem('doctorName') || 'Doctor';

  let html = '<div class="header-inner">';
  html += '<div class="header-left">';
  html += '<a href="../dashboard/dashboard.html" class="logo">';
  html += '<span class="material-symbols-outlined logo-icon">add</span>';
  html += '<span class="logo-text">Healthy</span></a></div>';
  html += '<div class="header-center">';
  html += '<div class="nav-links">';
  html += '<a href="#">About Us</a>';
  html += '<a href="../../FAQs/FAQs.html">FAQs</a>';
  html += '<a href="#">Contact Us</a></div>';
  html += '</div>';
  html += '<div class="header-right">';
  html += '<a href="../profile/profile.html" class="header-avatar">';

  let userId = sessionStorage.getItem('userId');
  let imageSrc = '/Src/assets/images/default-avatar.svg';

  if (userId) {
    let tempImage = localStorage.getItem(`imageFile_${userId}`);
    if (tempImage) {
      imageSrc = tempImage;
    } else {
      let cookieImage = getProfileImageCookie();
      if (cookieImage) {
        imageSrc = cookieImage;
      }
    }
  }

  html += '<img src="' + imageSrc + '" alt="' + name + '">';
  html += '</a></div></div>';

  header.innerHTML = html;
}

function getProfileImageCookie() {
  let name = "profileImage=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; ++i) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
