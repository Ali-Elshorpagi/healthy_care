class MedicalRecord {
    constructor({ id, patientId, doctorId, diagnosis, prescription, notes = "", date }) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.diagnosis = diagnosis;
        this.prescription = prescription;
        this.notes = notes;
        this.date = date || new Date();
    }
}

export default MedicalRecord;