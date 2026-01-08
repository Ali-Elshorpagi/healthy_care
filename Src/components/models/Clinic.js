class Clinic {
    constructor({ id, name, address, contactNumber, email, doctors = [] }) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.contactNumber = contactNumber;
        this.email = email;
        this.doctors = doctors; // Array<DoctorId>
        this.createdAt = new Date();
    }
}
export default Clinic;

