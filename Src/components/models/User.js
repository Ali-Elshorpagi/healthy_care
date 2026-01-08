
class User {
    constructor({ id, fullName, email, password, role, isActive = true, profileImage = '/Src/assets/images/default-avatar.svg' }) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role; // "patient" | "doctor" | "admin"
        this.isActive = isActive;
        this.profileImage = profileImage;
        this.createdAt = new Date();
    }
}

export default User;
