class Rating {
    constructor({ id, patientId, doctorId, appointmentId, rating, comment = "", createdAt = new Date() }) {
        this.id = id; // Unique rating ID
        this.patientId = patientId; // ID of the patient who rated
        this.doctorId = doctorId; // ID of the doctor being rated
        this.appointmentId = appointmentId; // Related appointment ID
        this.rating = rating; // Rating value (1-5)
        this.comment = comment; // Optional review comment
        this.createdAt = createdAt; // Date when rating was created
    }

    // Validate rating value (1-5)
    static isValidRating(rating) {
        return rating >= 1 && rating <= 5 && Number.isInteger(rating);
    }
}

export default Rating;
