class Appointment {
    constructor({ id, patientId, doctorId, date, time, status = "pending", notes = "", isDeleted = false }) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.date = date;
        this.time = time;
        this.status = status;
        this.notes = notes;
        this.isDeleted = isDeleted;
        this.createdAt = new Date();
    }

    // Soft delete the appointment
    softDelete() {
        this.isDeleted = true;
        this.deletedAt = new Date();
    }

    // Restore the appointment
    restore() {
        this.isDeleted = false;
        this.deletedAt = null;
    }
}

export default Appointment;
