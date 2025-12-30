
const loginForm = document.getElementById("loginform");

// login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("remember").checked;

    if (email === "" || password === "") {
        alert("All fields are required!");
        return;
    }

    let isExist = await isUserExist(email);
    if (!isExist) {
        alert("Email address or Password is not correct!");
        return;
    }

    const hashedPassword = await hashPassword(password);
    let isPasswordCorrect = await checkPassword(email, hashedPassword);
    if (!isPasswordCorrect) {
        alert("Email address or Password is not correct!");
        return;
    }

    saveUserInSession(email, hashedPassword);
    let noDays = 1;
    if (rememberMe)
        noDays = 7;

    saveUserInCookies(email, hashedPassword, noDays);

    alert("Login successful!");
    redirectTo("../../../../index.html");
});
