const express = require('express');
const bookRepository = require('../repository/bookRepository');
const asyncHandler = require('../facade/asyncHandler');
const authorizer = require('../facade/authorizer');
const { parseIdParam, validateBookCreate, validateBookUpdate } = require('../utils/validator');

const router = express.Router();

// List all books
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const books = await bookRepository.getAllBooks();
    res.json(books);
  }),
);

// Retrieve a book by id 
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

// Create a new book 
router.post(
  '/',
  authorizer,
  validateBookCreate,
  asyncHandler(async (req, res) => {
    const book = await bookRepository.createBook(req.body);
    res.status(201).json(book);
  }),
);

// Update a book
router.put(
  '/:id',
  authorizer,
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

// Delete a book
router.delete(
  '/:id',
  authorizer,
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
