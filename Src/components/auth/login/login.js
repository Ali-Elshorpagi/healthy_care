
const loginForm = document.getElementById("loginform");

// login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    alert("Login successful!");
});


