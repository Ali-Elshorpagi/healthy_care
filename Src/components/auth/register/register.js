const patientBtn = document.getElementById("patientBtn");
const doctorBtn = document.getElementById("doctorBtn");
const patientForm = document.getElementById("patientForm");
const doctorForm = document.getElementById("doctorForm");

let selectedRole = "patient";

patientBtn.addEventListener("click", () => {
    selectedRole = "patient";
    patientBtn.classList.add("active");
    doctorBtn.classList.remove("active");
    patientForm.style.display = "block";
    doctorForm.style.display = "none";
});

doctorBtn.addEventListener("click", () => {
    selectedRole = "doctor";
    doctorBtn.classList.add("active");
    patientBtn.classList.remove("active");
    patientForm.style.display = "none";
    doctorForm.style.display = "block";
});

// Patient Register
patientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("patientPassword").value.trim();
    const confirmPassword = document.getElementById("patientConfirmPassword").value.trim();
    const email = document.getElementById("patientEmail").value.trim();
    const fullName = document.getElementById("patientName").value.trim();

    if (fullName === "" || email === "" || password === "" || confirmPassword === "") {
        alert("All fields are required!");
        return;
    }

    let isExist = await isUserExist(email);
    if (isExist) {
        alert("User already exists!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const patient = {
        id: `p_${Date.now()}`,
        role: "patient",
        fullName: fullName,
        email: email,
        password: hashedPassword,
        appointments: [],
        medicalRecords: [],
        createdAt: new Date()
    };

    await saveUserInJson(patient);
    alert("Patient registered successfully!");
    patientForm.reset();

});

// Doctor Register
doctorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("doctorPassword").value.trim();
    const confirmPassword = document.getElementById("doctorConfirmPassword").value.trim();
    const email = document.getElementById("doctorEmail").value.trim();
    const licenseNo = document.getElementById("licenseNo").value.trim();
    const specialization = document.getElementById("specialization").value.trim();
    const fullName = document.getElementById("doctorName").value.trim();

    if (fullName === "" || email === "" || password === "" || confirmPassword === "" || licenseNo === "" || specialization === "") {
        alert("All fields are required!");
        return;
    }

    let isExist = await isUserExist(email);
    if (isExist) {
        alert("User already exists!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const doctor = {
        id: `d_${Date.now()}`,
        role: "doctor",
        fullName: fullName,
        email: email,
        password: hashedPassword,
        medicalLicenseNo: licenseNo,
        specialization: specialization,
        approved: "pending",
        schedule: [],
        appointments: [],
        patients: [],
        createdAt: new Date()
    };

    await saveUserInJson(doctor);
    alert("Doctor registered! Waiting for admin approval.");
    doctorForm.reset();
});

