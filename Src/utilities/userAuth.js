async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function isUserExist(email) {
    const response = await fetch('http://localhost:8877/users');
    const users = await response.json();
    return users.some(user => user.email === email);
}

async function checkPassword(email, hashedPassword) {
    const response = await fetch('http://localhost:8877/users');
    const users = await response.json();
    const user = users.find(user => user.email === email);
    if (!user) {
        return false;
    }
    return user.password === hashedPassword;
}

async function getUserByEmail(email) {
    const response = await fetch('http://localhost:8877/users');
    const users = await response.json();
    return users.find(user => user.email === email);
}

async function saveUserInJson(user) {
    try {
        const response = await fetch('http://localhost:8877/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

function saveUserInCookies(email, hashedPassword, noDays) {
    const d = new Date();
    d.setTime(d.getTime() + (noDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();

    document.cookie = "email=" + email + ";" + expires + ";path=/";
    document.cookie = "password=" + hashedPassword + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; ++i) {
        let c = ca[i];

        while (c.charAt(0) == ' ')
            c = c.substring(1);

        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }
    return "";
}

function saveUserInSession(email, hashedPassword, user = null) {
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("password", hashedPassword);

    if (user) {
        sessionStorage.setItem("userId", user.id);
        sessionStorage.setItem("patientName", user.fullName);
        sessionStorage.setItem("userRole", user.role);

        if (user.profileImage) {
            setProfileImageCookie(user.profileImage);
        }
    }
}

function setProfileImageCookie(imageData) {
    let d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    let expires = "expires=" + d.toUTCString();
    document.cookie = "profileImage=" + encodeURIComponent(imageData) + ";" + expires + ";path=/";
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

function getUserFromSession() {
    const email = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    return { email, password };
}

function clearSession() {
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("password");
}

function clearCookies() {
    document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "profileImage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function clearSessionAndCookies() {
    clearSession();
    clearCookies();
}

function isUserAuthenticated() {
    const email = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    const userId = sessionStorage.getItem("userId");

    return !!(email && password && userId);
}

function checkAuthenticationAndRedirect(redirectPath = '../../auth/login/login.html') {
    if (!isUserAuthenticated()) {
        sessionStorage.setItem('intendedPage', window.location.href);
        window.location.href = redirectPath;
        return false;
    }
    return true;
}

function redirectToIntendedPage(defaultPage = '../patient/dashboard/dashboard.html') {
    const intendedPage = sessionStorage.getItem('intendedPage');
    sessionStorage.removeItem('intendedPage');

    if (intendedPage) {
        window.location.href = intendedPage;
    } else {
        window.location.href = defaultPage;
    }
}
