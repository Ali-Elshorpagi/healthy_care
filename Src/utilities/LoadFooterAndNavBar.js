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
    })
    .catch((err) => {
      console.error(err);
    });
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
    const navRight = document.querySelector("#navbar .nav-right");
    if (!navRight) return;

    wireAuthButtons(options);

    const auth = await getValidAuth();
    if (!auth) return;

    navRight.innerHTML = `<button id="navbar-logout-btn">Logout</button>`;

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
