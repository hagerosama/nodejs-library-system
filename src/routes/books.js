const express = require('express');
const bookRepository = require('../repository/bookRepository');
const asyncHandler = require('../facade/asyncHandler');
const authMiddleware = require('../facade/authorizer');
const { parseIdParam, validateBookCreate, validateBookUpdate } = require('../utils/validator');

const router = express.Router();

// List all books (public)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const books = await bookRepository.getAllBooks();
    res.json(books);
  }),
);

// Retrieve a book by id (public)
router.get(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const book = await bookRepository.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  }),
);

// Create a new book (protected)
router.post(
  '/',
  authMiddleware,
  validateBookCreate,
  asyncHandler(async (req, res) => {
    const book = await bookRepository.createBook(req.body);
    res.status(201).json(book);
  }),
);

// Update a book (protected)
router.put(
  '/:id',
  authMiddleware,
  parseIdParam('id'),
  validateBookUpdate,
  asyncHandler(async (req, res) => {
    const book = await bookRepository.updateBook(req.params.id, req.body);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  }),
);

// Delete a book (protected)
router.delete(
  '/:id',
  authMiddleware,
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const book = await bookRepository.deleteBook(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(204).end();
  }),
);

module.exports = router;
