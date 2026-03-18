const knex = require('../db/knex');
const ValidationError = require('../models/errors/ValidationError');

const TABLES = {
  books: 'books',
  borrowers: 'borrowers',
  checkouts: 'checkouts',
};

function mapBook(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    quantity: row.quantity,
    shelfLocation: row.shelf_location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBorrower(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    registeredAt: row.registered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCheckout(row) {
  if (!row) return null;
  return {
    id: row.id,
    borrowerId: row.borrower_id,
    bookId: row.book_id,
    borrowedAt: row.borrowed_at,
    dueAt: row.due_at,
    returnedAt: row.returned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAllBooks() {
  const rows = await knex(TABLES.books).select('*');
  return rows.map(mapBook);
}

async function getBookById(id) {
  const row = await knex(TABLES.books).where({ id }).first();
  return mapBook(row);
}

async function createBook(payload) {
  const [id] = await knex(TABLES.books).insert({
    title: payload.title,
    author: payload.author,
    isbn: payload.isbn,
    quantity: payload.quantity || 0,
    shelf_location: payload.shelfLocation || '',
  });

  return getBookById(id);
}

async function updateBook(id, payload) {
  const update = {};
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.author !== undefined) update.author = payload.author;
  if (payload.isbn !== undefined) update.isbn = payload.isbn;
  if (payload.quantity !== undefined) update.quantity = Number(payload.quantity);
  if (payload.shelfLocation !== undefined) update.shelf_location = payload.shelfLocation;
  if (!Object.keys(update).length) return getBookById(id);

  await knex(TABLES.books).where({ id }).update({ ...update, updated_at: knex.fn.now() });
  return getBookById(id);
}

async function deleteBook(id) {
  const book = await getBookById(id);
  if (!book) return null;
  await knex(TABLES.books).where({ id }).del();
  return book;
}

async function getAllBorrowers() {
  const rows = await knex(TABLES.borrowers).select('*');
  return rows.map(mapBorrower);
}

async function getBorrowerById(id) {
  const row = await knex(TABLES.borrowers).where({ id }).first();
  return mapBorrower(row);
}

async function createBorrower(payload) {
  const [id] = await knex(TABLES.borrowers).insert({
    name: payload.name,
    email: payload.email,
    registered_at: knex.fn.now(),
  });
  return getBorrowerById(id);
}

async function updateBorrower(id, payload) {
  const update = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.email !== undefined) update.email = payload.email;
  if (!Object.keys(update).length) return getBorrowerById(id);

  await knex(TABLES.borrowers).where({ id }).update({ ...update, updated_at: knex.fn.now() });
  return getBorrowerById(id);
}

async function deleteBorrower(id) {
  const borrower = await getBorrowerById(id);
  if (!borrower) return null;
  await knex(TABLES.borrowers).where({ id }).del();
  return borrower;
}

async function getCheckoutsByBorrower(borrowerId, { activeOnly = false, overdueOnly = false } = {}) {
  const now = new Date().toISOString();

  let query = knex(TABLES.checkouts).where({ borrower_id: borrowerId });

  if (activeOnly) {
    query = query.whereNull('returned_at');
  }

  if (overdueOnly) {
    query = query.whereNull('returned_at').andWhere('due_at', '<', now);
  }

  const rows = await query.select('*');
  return rows.map(mapCheckout);
}

async function checkoutBook({ borrowerId, bookId, dueDate }) {
  return knex.transaction(async (trx) => {
    const borrower = await trx(TABLES.borrowers).where({ id: borrowerId }).first();
    if (!borrower) throw new ValidationError('Borrower not found');

    const book = await trx(TABLES.books).where({ id: bookId }).first();
    if (!book) throw new ValidationError('Book not found');

    if (book.quantity <= 0) {
      throw new ValidationError('No available copies to checkout');
    }

    const activeCheckout = await trx(TABLES.checkouts)
      .where({ book_id: bookId })
      .whereNull('returned_at')
      .first();

    if (activeCheckout) {
      throw new ValidationError('This book is already checked out');
    }

    const now = new Date();
    const due = dueDate ? new Date(dueDate) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [checkoutId] = await trx(TABLES.checkouts).insert({
      borrower_id: borrowerId,
      book_id: bookId,
      borrowed_at: now.toISOString(),
      due_at: due.toISOString(),
    });

    await trx(TABLES.books)
      .where({ id: bookId })
      .update({ quantity: book.quantity - 1, updated_at: knex.fn.now() });

    const checkoutRow = await trx(TABLES.checkouts).where({ id: checkoutId }).first();
    return mapCheckout(checkoutRow);
  });
}

async function returnBook({ borrowerId, bookId }) {
  return knex.transaction(async (trx) => {
    const checkout = await trx(TABLES.checkouts)
      .where({ borrower_id: borrowerId, book_id: bookId })
      .whereNull('returned_at')
      .first();

    if (!checkout) {
      throw new ValidationError('Active checkout not found for this borrower and book');
    }

    await trx(TABLES.checkouts)
      .where({ id: checkout.id })
      .update({ returned_at: new Date().toISOString(), updated_at: knex.fn.now() });

    const checkoutRow = await trx(TABLES.checkouts).where({ id: checkout.id }).first();

    await trx(TABLES.books)
      .where({ id: bookId })
      .increment('quantity', 1)
      .update({ updated_at: knex.fn.now() });

    return mapCheckout(checkoutRow);
  });
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getAllBorrowers,
  getBorrowerById,
  createBorrower,
  updateBorrower,
  deleteBorrower,
  getCheckoutsByBorrower,
  checkoutBook,
  returnBook,
};
