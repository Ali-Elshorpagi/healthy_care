class Appointment {
    constructor({ id, patientId, doctorId, date, time, status = "pending", notes = "" }) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.date = date;
        this.time = time;
        this.status = status;
        this.notes = notes;
        this.createdAt = new Date();
    }
}

export default Appointment;
