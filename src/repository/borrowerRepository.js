const knex = require('../db/knex');

const TABLES = {
  borrowers: 'borrowers',
};

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

async function getAllBorrowers() {
  const rows = await knex(TABLES.borrowers).select('*');
  return rows.map(mapBorrower);
}

async function getBorrowerById(id) {
  const row = await knex(TABLES.borrowers).where({ id }).first();
  return mapBorrower(row);
}

async function getBorrowerByEmail(email) {
  const row = await knex(TABLES.borrowers).where({ email }).first();
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

module.exports = {
  getAllBorrowers,
  getBorrowerById,
  getBorrowerByEmail,
  createBorrower,
  updateBorrower,
  deleteBorrower,
};
