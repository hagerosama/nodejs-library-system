const express = require('express');
const storage = require('../repository/libraryRepository');
const asyncHandler = require('../facade/asyncHandler');
const { parseIdParam, validateBookCreate, validateBookUpdate } = require('../facade/validator');

const router = express.Router();

// List all books
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const books = await storage.getAllBooks();
    res.json(books);
  }),
);

// Retrieve a book by id
router.get(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const book = await storage.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  }),
);

// Create a new book
router.post(
  '/',
  validateBookCreate,
  asyncHandler(async (req, res) => {
    const book = await storage.createBook(req.body);
    res.status(201).json(book);
  }),
);

// Update a book
router.put(
  '/:id',
  parseIdParam('id'),
  validateBookUpdate,
  asyncHandler(async (req, res) => {
    const book = await storage.updateBook(req.params.id, req.body);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  }),
);

// Delete a book
router.delete(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const book = await storage.deleteBook(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(204).end();
  }),
);

module.exports = router;
