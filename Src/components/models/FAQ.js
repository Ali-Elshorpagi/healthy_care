class FAQ {
    constructor({ id, userId = 'anonymous', category = 'General', question, answer = '', status = 'pending', createdAt }) {
        this.id = id;
        this.userId = userId;
        this.category = category;
        this.question = question;
        this.answer = answer;
        this.status = status;
        this.createdAt = createdAt || new Date().toISOString();
    }
}

export default FAQ;

