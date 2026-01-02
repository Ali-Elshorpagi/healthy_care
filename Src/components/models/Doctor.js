import User from "./User.js";

class Doctor extends User {
    constructor({ id, fullName, email, password, specialization, medicalLicenseNo, clinicId, country, profileImage }) {
        super({ id, fullName, email, password, role: "doctor", isActive: false /* inactive until admin approval*/, profileImage });
        this.specialization = specialization;
        this.medicalLicenseNo = medicalLicenseNo;
        this.clinicId = clinicId;
        this.country = country;
        this.approved = approved;

        this.schedule = []; // Array<Schedule>
        this.appointments = []; // Array<Appointment>
        this.patients = []; // Array<Patient>
    }
}

export default Doctor;
