class Book {
  constructor({ id, title, author, isbn, quantity = 0, shelfLocation = '' }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.quantity = quantity;
    this.shelfLocation = shelfLocation;
  }
}

module.exports = Book;
