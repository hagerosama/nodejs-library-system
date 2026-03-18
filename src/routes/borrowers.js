const express = require('express');
const libraryRepo = require('../repository/libraryRepository');
const asyncHandler = require('../facade/asyncHandler');
const {
  parseIdParam,
  validateBorrowerCreate,
  validateBorrowerUpdate,
  validateCheckout,
  validateReturn,
} = require('../facade/validator');

const router = express.Router();

// List all borrowers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const borrowers = await libraryRepo.getAllBorrowers();
    res.json(borrowers);
  }),
);

// Retrieve a borrower by id
router.get(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const borrower = await libraryRepo.getBorrowerById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    res.json(borrower);
  }),
);

// Add borrower
router.post(
  '/',
  validateBorrowerCreate,
  asyncHandler(async (req, res) => {
    const borrower = await libraryRepo.createBorrower(req.body);
    res.status(201).json(borrower);
  }),
);

// Update a borrower
router.put(
  '/:id',
  parseIdParam('id'),
  validateBorrowerUpdate,
  asyncHandler(async (req, res) => {
    const borrower = await libraryRepo.updateBorrower(req.params.id, req.body);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    res.json(borrower);
  }),
);

// Delete a borrower
router.delete(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const borrower = await libraryRepo.deleteBorrower(req.params.id);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    res.status(204).end();
  }),
);

// Checkout a book
router.post(
  '/:id/checkout',
  parseIdParam('id'),
  validateCheckout,
  asyncHandler(async (req, res) => {
    const result = await libraryRepo.checkoutBook({
      borrowerId: req.params.id,
      bookId: req.body.bookId,
      dueDate: req.body.dueDate,
    });
    res.status(201).json(result);
  }),
);

// Return a book
router.post(
  '/:id/return',
  parseIdParam('id'),
  validateReturn,
  asyncHandler(async (req, res) => {
    const result = await libraryRepo.returnBook({
      borrowerId: req.params.id,
      bookId: req.body.bookId,
    });
    res.json(result);
  }),
);

// List all checkouts for a borrower
router.get(
  '/:id/checkouts',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const borrower = await libraryRepo.getBorrowerById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }

    const activeOnly = req.query.active === 'true';
    const overdueOnly = req.query.overdue === 'true';

    const checkouts = await libraryRepo.getCheckoutsByBorrower(req.params.id, { activeOnly, overdueOnly });
    res.json(checkouts);
  }),
);

module.exports = router;
