
class User {
    constructor({ id, fullName, email, password, role, isActive = true }) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role; // "patient" | "doctor" | "admin"
        this.isActive = isActive;
        this.createdAt = new Date();
    }
}

export default User;
