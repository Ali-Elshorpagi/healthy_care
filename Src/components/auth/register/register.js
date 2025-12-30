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

    const password = document.getElementById("patientPassword").value;
    const confirmPassword = document.getElementById("patientConfirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const patient = {
        id: `p_${Date.now()}`,
        role: "patient",
        fullName: document.getElementById("patientName").value,
        email: document.getElementById("patientEmail").value,
        password: hashedPassword,
        appointments: [],
        medicalRecords: [],
        createdAt: new Date()
    };

    // saveUser(patient);
    alert("Patient registered successfully!");
    patientForm.reset();
});

// Doctor Register
doctorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("doctorPassword").value;
    const confirmPassword = document.getElementById("doctorConfirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const doctor = {
        id: `d_${Date.now()}`,
        role: "doctor",
        fullName: document.getElementById("doctorName").value,
        email: document.getElementById("doctorEmail").value,
        password: hashedPassword,
        medicalLicenseNo: document.getElementById("licenseNo").value,
        specialization: document.getElementById("specialization").value,
        isApproved: false,
        schedule: [],
        appointments: [],
        patients: [],
        createdAt: new Date()
    };

    // saveUser(doctor);
    alert("Doctor registered! Waiting for admin approval.");
    doctorForm.reset();
});