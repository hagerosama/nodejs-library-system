exports.up = function (knex) {
  return knex.schema
    .createTable('books', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('author').notNullable();
      table.string('isbn').notNullable().unique();
      table.integer('quantity').notNullable().defaultTo(0);
      table.string('shelf_location').notNullable().defaultTo('');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('borrowers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.timestamp('registered_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('checkouts', (table) => {
      table.increments('id').primary();
      table
        .integer('borrower_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('borrowers')
        .onDelete('CASCADE');
      table
        .integer('book_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('books')
        .onDelete('CASCADE');
      table.timestamp('borrowed_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('due_at').notNullable();
      table.timestamp('returned_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['borrower_id', 'book_id', 'returned_at']);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('loans').dropTableIfExists('borrowers').dropTableIfExists('books');
};
