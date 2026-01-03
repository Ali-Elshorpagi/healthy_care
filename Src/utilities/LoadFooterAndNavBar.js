function loadNavbar({ path, targetId } = {}) {
  const resolvedPath = path || "../../navbar-unauth.html";
  const resolvedTargetId = targetId || "navbar-slot";

  return fetch(resolvedPath)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load navbar: HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const target = document.getElementById(resolvedTargetId);
      if (!target) throw new Error(`Navbar target not found: #${resolvedTargetId}`);
      target.innerHTML = html;

      applyNavbarAuthUI(arguments[0]);
    })
    .catch((err) => {
      console.error(err);
    });
}

function loadFooter({ path, targetId } = {}) {
  const resolvedPath = path || "../../footer.html";
  const resolvedTargetId = targetId || "footer-slot";

  return fetch(resolvedPath)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load footer: HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const target = document.getElementById(resolvedTargetId);
      if (!target) throw new Error(`Footer target not found: #${resolvedTargetId}`);
      target.innerHTML = html;
      
      // Initialize footer after loading
      initializeFooter();
    })
    .catch((err) => {
      console.error(err);
    });
}

// Auto-initialize footer on DOMContentLoaded for pages with embedded footer
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Check if footer exists and hasn't been initialized by loadFooter
    var footer = document.getElementById('footer');
    if (footer && !footer.hasAttribute('data-initialized')) {
      initializeFooter();
    }
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
    // Count folder depth after /src/components/
    var afterComponents = currentPath.split('/src/components/')[1] || '';
    var slashCount = (afterComponents.match(/\//g) || []).length;

    // Build path back to root
    for (var i = 0; i <= slashCount; i++) {
      pathToRoot += '../';
    }
    pathToRoot += '../'; // Extra for src folder
    pathToComponents = '../';
  } else {
    // At root
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
    navLinks[i].addEventListener('click', function (e) {
      e.preventDefault();
      var page = this.getAttribute('data-page');
      if (routes[page]) {
        window.location.href = routes[page];
      }
    });
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

function getCookieValue(name) {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (let i = 0; i < cookies.length; i++) {
    const part = cookies[i].trim();
    if (part.startsWith(name + "=")) {
      return decodeURIComponent(part.substring(name.length + 1));
    }
  }
  return "";
}

async function getValidAuth() {
  const sessionEmail = sessionStorage.getItem("email");
  const sessionPassword = sessionStorage.getItem("password");
  if (sessionEmail && sessionPassword) {
    if (typeof checkPassword === "function") {
      const valid = await checkPassword(sessionEmail, sessionPassword);
      if (valid) return { email: sessionEmail };
      if (typeof clearSession === "function") clearSession();
    } else {
      return { email: sessionEmail };
    }
  }

  const cookieEmail = (typeof getCookie === "function") ? getCookie("email") : getCookieValue("email");
  const cookiePassword = (typeof getCookie === "function") ? getCookie("password") : getCookieValue("password");
  if (cookieEmail && cookiePassword) {
    if (typeof checkPassword === "function") {
      const valid = await checkPassword(cookieEmail, cookiePassword);
      if (valid) return { email: cookieEmail };
      if (typeof clearCookies === "function") clearCookies();
    } else {
      return { email: cookieEmail };
    }
  }

  return null;
}

function wireAuthButtons({ loginPath, registerPath } = {}) {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (loginPath) {
        window.location.href = loginPath;
      }
    });
  }

  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      if (registerPath) {
        window.location.href = registerPath;
      }
    });
  }
}

async function applyNavbarAuthUI(options) {
  try {
    const navRight = document.querySelector("#navbar .navbar-right") || document.querySelector("#navbar .nav-right");
    if (!navRight) return;

    wireAuthButtons(options);

    const auth = await getValidAuth();
    if (!auth) return;

    navRight.innerHTML = `<button id="navbar-logout-btn" class="btn btn-outline">Logout</button>`;

    const logoutBtn = document.getElementById("navbar-logout-btn");
    logoutBtn.addEventListener("click", () => {
      if (typeof clearSessionAndCookies === "function") {
        clearSessionAndCookies();
      } else {
        try {
          sessionStorage.removeItem("email");
          sessionStorage.removeItem("password");
          document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        } catch {}
      }

      if (options && options.logoutRedirectPath) {
        window.location.href = options.logoutRedirectPath;
      }
    });
  } catch (err) {
    console.error(err);
  }
}
