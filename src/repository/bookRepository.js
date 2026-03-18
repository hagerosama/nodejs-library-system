const knex = require('../db/knex');

const TABLES = {
  books: 'books',
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

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
