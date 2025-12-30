class Schedule {
    constructor({ id, doctorId, dayOfWeek, startTime, endTime, isAvailable = true }) {
        this.id = id;
        this.doctorId = doctorId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isAvailable = isAvailable;
    }
}

export default Schedule;
