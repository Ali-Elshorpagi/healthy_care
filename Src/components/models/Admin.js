import User from "./User.js";

class Admin extends User {
    constructor({ id, fullName, email, password }) {
        super({ id, fullName, email, password, role: "admin" });
    }
}

export default Admin;
