// Patient sidebar menu items
var patientMenuItems = [
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
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  var html = '<div class="sidebar-menu">';
  html += '<p class="sidebar-label">Patient Menu</p>';
  html += '<ul class="sidebar-nav">';

  for (var i = 0; i < patientMenuItems.length; i++) {
    var item = patientMenuItems[i];
    var isActive = item.id === activePage;
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

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        if (typeof clearSessionAndCookies === 'function') {
          clearSessionAndCookies();
        } else {
          sessionStorage.clear();
        }
        window.location.href = '../../auth/login/login.html';
      }
    };
  }
}

function buildHeader() {
  var header = document.getElementById('header');
  if (!header) return;

  var name = sessionStorage.getItem('patientName') || 'User';

  var html = '<div class="header-inner">';
  html += '<div class="header-left">';
  html += '<a href="../dashboard/dashboard.html" class="logo">';
  html += '<span class="material-symbols-outlined logo-icon">add</span>';
  html += '<span class="logo-text">BelShefaa ISA</span></a></div>';
  html += '<div class="header-center">';
  html += '<div class="nav-links">';
  html += '<a href="../../../../index.html">Home</a>';
  html += '<a href="../../About_us/About_Us.html">About Us</a>';
  html += '<a href="../../FAQs/FAQs.html">FAQs</a>';
  html += '<a href="../../Contact/Contact.html">Contact Us</a></div>';
  html += '</div>';
  html += '<div class="header-right">';
  html += '<a href="../profile/profile.html" class="header-avatar">';

  var userId = sessionStorage.getItem('userId');
  var imageSrc = '/Src/assets/images/default-avatar.svg';

  if (userId) {
    var tempImage = localStorage.getItem('imageFile_' + userId);
    if (tempImage) {
      imageSrc = tempImage;
    } else {
      var cookieImage = getProfileImageCookie();
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
  var name = 'profileImage=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');

  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
