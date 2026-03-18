class Borrower {
  constructor({ id, name, email, registeredAt }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.registeredAt = registeredAt;
  }
}

module.exports = Borrower;
