import User from "./User.js";

class Patient extends User {
    constructor({ id, fullName, email, password, phoneNumber, dateOfBirth = null, gender = null, profileImage }) {
        super({ id, fullName, email, password, role: "patient", profileImage });
        this.phoneNumber = phoneNumber;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.medicalRecords = []; // Array<MedicalRecord>
        this.appointments = []; // Array<Appointment>
    }
}

export default Patient;
