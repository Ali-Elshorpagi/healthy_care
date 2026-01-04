class MedicalRecord {
    constructor({ id, patientId, doctorId, diagnosis, prescription, notes = "", date, isDeleted = false }) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.diagnosis = diagnosis;
        this.prescription = prescription;
        this.notes = notes;
        this.date = date || new Date();
        this.isDeleted = isDeleted;
    }

    // Soft delete the medical record
    softDelete() {
        this.isDeleted = true;
        this.deletedAt = new Date();
    }

    // Restore the medical record
    restore() {
        this.isDeleted = false;
        this.deletedAt = null;
    }
}

export default MedicalRecord;