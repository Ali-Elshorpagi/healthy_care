import User from "./User.js";

class Doctor extends User {
    constructor({ id, fullName, email, password, specialization, medicalLicenseDocument, licenseFileName, clinicId, country, profileImage, approved }) {
        super({ id, fullName, email, password, role: "doctor", isActive: false /* inactive until admin approval*/, profileImage });
        this.specialization = specialization;
        this.medicalLicenseDocument = medicalLicenseDocument; // base64 encoded document
        this.licenseFileName = licenseFileName; // original filename
        this.clinicId = clinicId;
        this.country = country;
        this.approved = approved;

        this.schedule = []; // Array<Schedule>
        this.appointments = []; // Array<Appointment>
        this.patients = []; // Array<Patient>
        this.ratings = []; // Array<Rating> - patient ratings
        this.averageRating = 0; // Calculated average rating
    }

    // Calculate average rating from all ratings
    calculateAverageRating() {
        if (this.ratings.length === 0) {
            this.averageRating = 0;
            return 0;
        }
        const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
        this.averageRating = (sum / this.ratings.length).toFixed(1);
        return this.averageRating;
    }

    // Add a new rating
    addRating(rating) {
        this.ratings.push(rating);
        this.calculateAverageRating();
    }
}

export default Doctor;
