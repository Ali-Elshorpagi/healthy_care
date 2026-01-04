// ============================================
// HEADER / NAVBAR FUNCTIONS
// ============================================

function loadHeader({ path, targetId } = {}) {
  var resolvedPath = path || '../shared/header.html';
  var resolvedTargetId = targetId || 'header-slot';

  return fetch(resolvedPath)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load header: HTTP ' + res.status);
      return res.text();
    })
    .then(function (html) {
      var target = document.getElementById(resolvedTargetId);
      if (!target)
        throw new Error('Header target not found: #' + resolvedTargetId);
      target.innerHTML = html;

      // Initialize header after loading
      initializeHeader();
    })
    .catch(function (err) {
      console.error(err);
    });
}

function initializeHeader() {
  // Get current page path
  var currentPath = window.location.pathname.toLowerCase();

  // Determine the base path to root
  var pathToRoot = '';
  var pathToComponents = '';
  var pathToAuth = '';

  if (currentPath.indexOf('/src/components/') !== -1) {
    var afterComponents = currentPath.split('/src/components/')[1] || '';
    var slashCount = (afterComponents.match(/\//g) || []).length;

    // Calculate path to root (need to go up through components AND src)
    for (var i = 0; i <= slashCount; i++) {
      pathToRoot += '../';
    }
    pathToRoot += '../';

    // Calculate path back to components folder
    // slashCount tells us how many folders deep we are within components
    pathToComponents = '';
    for (var j = 0; j < slashCount; j++) {
      pathToComponents += '../';
    }

    // Path to auth folder from components
    pathToAuth = pathToComponents + 'auth/';
  } else if (currentPath.indexOf('/src/shared/') !== -1) {
    pathToRoot = '../../';
    pathToComponents = '../components/';
    pathToAuth = '../components/auth/';
  } else {
    pathToRoot = './';
    pathToComponents = './Src/components/';
    pathToAuth = './Src/components/auth/';
  }

  // Page routes
  var routes = {
    home: pathToRoot + 'index.html',
    about: pathToComponents + 'About_us/About_Us.html',
    faqs: pathToComponents + 'FAQs/FAQs.html',
    contact: pathToComponents + 'Contact/Contact.html',
    login: pathToAuth + 'login/login.html',
    register: pathToAuth + 'register/register.html',
    profile: pathToComponents + 'patient/profile/profile.html',
    dashboard: pathToComponents + 'patient/dashboard/dashboard.html',
    doctorProfile: pathToComponents + 'doctor/profile/profile.html',
    doctorDashboard: pathToComponents + 'doctor/dashboard/dashboard.html',
    pathToComponents: pathToComponents,
  };

  // Handle logo click
  var logoLink = document.querySelector('.logo[data-page="home"]');
  if (logoLink) {
    logoLink.href = routes.home;
  }

  // Handle navigation links
  var navLinks = document.querySelectorAll('.nav-links a[data-nav]');
  for (var i = 0; i < navLinks.length; i++) {
    (function (link) {
      var page = link.getAttribute('data-nav');
      if (routes[page]) {
        link.href = routes[page];
      }
    })(navLinks[i]);
  }

  // Handle auth state
  applyHeaderAuthState(routes);
}

function applyHeaderAuthState(routes) {
  var navRight = document.getElementById('navbarRight');
  if (!navRight) return;

  // Check if user is authenticated
  var email = sessionStorage.getItem('email');
  var password = sessionStorage.getItem('password');
  var userId = sessionStorage.getItem('userId');
  var isAuthenticated = !!(email && password && userId);

  // Get user role
  var userRole =
    sessionStorage.getItem('role') ||
    sessionStorage.getItem('userRole') ||
    'patient';
  userRole = userRole.toLowerCase();

  if (isAuthenticated) {
    // User is logged in - show profile icon
    var profileImage = '/Src/assets/images/default-avatar.svg';

    // Try to get profile image from localStorage or cookie
    if (userId) {
      var tempImage = localStorage.getItem('imageFile_' + userId);
      if (tempImage) {
        profileImage = tempImage;
      } else {
        var cookieImage = getProfileImageFromCookie();
        if (cookieImage) {
          profileImage = cookieImage;
        }
      }
    }

    // Determine profile link based on role
    var profileLink = '';

    if (userRole === 'admin') {
      // Admin: go to admin dashboard
      profileLink =
        routes.pathToComponents + 'admin/dashboard/admin-dashboard.html';
    } else if (userRole === 'doctor') {
      // Doctor: go to doctor profile
      profileLink =
        routes.doctorProfile ||
        routes.pathToComponents + 'doctor/profile/profile.html';
    } else {
      // Patient (default): go to patient profile
      profileLink = routes.profile;
    }

    navRight.innerHTML =
      '<a href="' +
      profileLink +
      '" class="header-avatar" id="profileAvatarLink" title="My Profile">' +
      '<img src="' +
      profileImage +
      '" alt="Profile">' +
      '</a>' +
      '<button id="navbar-logout-btn" class="btn btn-outline">Logout</button>';

    // Handle logout
    var logoutBtn = document.getElementById('navbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        // Clear session and cookies
        sessionStorage.clear();
        document.cookie =
          'email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'profileImage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Redirect to home
        window.location.href = routes.home;
      });
    }
  } else {
    // User is not logged in - show login/register buttons
    navRight.innerHTML =
      '<button id="loginBtn" class="btn btn-outline">Login</button>' +
      '<button id="registerBtn" class="btn btn-primary">Register</button>';

    // Handle login button
    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        window.location.href = routes.login;
      });
    }

    // Handle register button
    var registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', function () {
        window.location.href = routes.register;
      });
    }
  }
}

function getProfileImageFromCookie() {
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

// ============================================
// FOOTER FUNCTIONS
// ============================================

function loadFooter({ path, targetId } = {}) {
  var resolvedPath = path || '../footer.html';
  var resolvedTargetId = targetId || 'footer-slot';

  return fetch(resolvedPath)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load footer: HTTP ' + res.status);
      return res.text();
    })
    .then(function (html) {
      var target = document.getElementById(resolvedTargetId);
      if (!target)
        throw new Error('Footer target not found: #' + resolvedTargetId);
      target.innerHTML = html;

      // Initialize footer after loading
      initializeFooter();
    })
    .catch(function (err) {
      console.error(err);
    });
}

function initializeFooter() {
  // Mark footer as initialized
  var footer = document.getElementById('footer');
  if (footer) {
    footer.setAttribute('data-initialized', 'true');
  }

  // Get current page path
  var currentPath = window.location.pathname.toLowerCase();

  // Determine the base path to root
  var pathToRoot = '';
  var pathToComponents = '';

  if (currentPath.indexOf('/src/components/') !== -1) {
    var afterComponents = currentPath.split('/src/components/')[1] || '';
    var slashCount = (afterComponents.match(/\//g) || []).length;

    // Calculate path to root
    for (var i = 0; i <= slashCount; i++) {
      pathToRoot += '../';
    }
    pathToRoot += '../';

    // Calculate path back to components folder
    pathToComponents = '';
    for (var j = 0; j < slashCount; j++) {
      pathToComponents += '../';
    }
  } else {
    pathToRoot = './';
    pathToComponents = './Src/components/';
  }

  // Page routes
  var routes = {
    home: pathToRoot + 'index.html',
    about: pathToComponents + 'About_us/About_Us.html',
    faqs: pathToComponents + 'FAQs/FAQs.html',
    contact: pathToComponents + 'Contact/Contact.html',
  };

  // Handle navigation links
  var navLinks = document.querySelectorAll('.footer-nav-link[data-page]');
  for (var i = 0; i < navLinks.length; i++) {
    (function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        if (routes[page]) {
          window.location.href = routes[page];
        }
      });
    })(navLinks[i]);
  }

  // Handle coming soon links
  var comingSoonLinks = document.querySelectorAll('.coming-soon-link');
  for (var j = 0; j < comingSoonLinks.length; j++) {
    comingSoonLinks[j].addEventListener('click', function (e) {
      e.preventDefault();
      var modal = document.getElementById('comingSoonModal');
      if (modal) {
        modal.style.display = 'block';
      }
    });
  }

  // Close modal button
  var closeBtn = document.getElementById('modalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      var modal = document.getElementById('comingSoonModal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Close modal when clicking overlay
  var modal = document.getElementById('comingSoonModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  }
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    // Auto-initialize header if it exists and hasn't been initialized
    var navbar = document.getElementById('navbar');
    if (navbar && !navbar.hasAttribute('data-initialized')) {
      navbar.setAttribute('data-initialized', 'true');
      initializeHeader();
    }

    // Auto-initialize footer if it exists and hasn't been initialized
    var footer = document.getElementById('footer');
    if (footer && !footer.hasAttribute('data-initialized')) {
      initializeFooter();
    }
  });
}

// ============================================
// LEGACY SUPPORT (for existing code)
// ============================================

function loadNavbar(options) {
  return loadHeader(options);
}
