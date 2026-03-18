const knex = require('../db/knex');
const ValidationError = require('../models/errors/ValidationError');

const TABLES = {
  books: 'books',
  borrowers: 'borrowers',
  checkouts: 'checkouts',
};

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
  getCheckoutsByBorrower,
  checkoutBook,
  returnBook,
};
