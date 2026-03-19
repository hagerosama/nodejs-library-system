const express = require('express');
const borrowerRepository = require('../repository/borrowerRepository');
const checkoutRepository = require('../repository/checkoutRepository');
const asyncHandler = require('../facade/asyncHandler');
const authMiddleware = require('../facade/authorizer');
const { generateToken } = require('../utils/jwtUtil');
const { HttpError } = require('../models/errors');
const {
  parseIdParam,
  validateBorrowerCreate,
  validateBorrowerUpdate,
  validateCheckout,
  validateReturn,
} = require('../utils/validator');

const router = express.Router();

// LOGIN: Get JWT token (public endpoint)
router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email) {
      throw new HttpError('Email is required', 400);
    }
    
    // Simple authentication: just verify the borrower exists
    // In production, use bcrypt to hash and compare passwords
    const borrower = await borrowerRepository.getBorrowerByEmail(email);
    if (!borrower) {
      throw new HttpError('Invalid email or borrower not found', 401);
    }
    
    const token = generateToken(borrower.id, borrower.email);
    res.json({ token, borrower: { id: borrower.id, name: borrower.name, email: borrower.email } });
  }),
);

router.post(
  '/auth/signup',
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
      throw new HttpError('Name and email are required', 400);
    }
    
    const existingBorrower = await borrowerRepository.getBorrowerByEmail(email);
    if (existingBorrower) {
      throw new HttpError('Email already registered', 409);
    }
    
    const borrower = await borrowerRepository.createBorrower({ name, email });
    
    const token = generateToken(borrower.id, borrower.email);
    
    res.status(201).json({ 
      token, 
      borrower: { 
        id: borrower.id, 
        name: borrower.name, 
        email: borrower.email 
      } 
    });
  }),
);

// List all borrowers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const borrowers = await borrowerRepository.getAllBorrowers();
    res.json(borrowers);
  }),
);

// Retrieve a borrower by id 
router.get(
  '/:id',
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    const borrower = await borrowerRepository.getBorrowerById(req.params.id);
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
    const borrower = await borrowerRepository.createBorrower(req.body);
    res.status(201).json(borrower);
  }),
);

// Update a borrower 
router.put(
  '/:id',
  authMiddleware,
  parseIdParam('id'),
  validateBorrowerUpdate,
  asyncHandler(async (req, res) => {
    // Borrower can only update their own profile
    if (req.borrower.id !== req.params.id) {
      throw new HttpError('You can only update your own profile', 403);
    }
    
    const borrower = await borrowerRepository.updateBorrower(req.params.id, req.body);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    res.json(borrower);
  }),
);

// Delete a borrower 
router.delete(
  '/:id',
  authMiddleware,
  parseIdParam('id'),
  asyncHandler(async (req, res) => {
    // Borrower can only delete their own account
    if (req.borrower.id !== req.params.id) {
      throw new HttpError('You can only delete your own account', 403);
    }
    
    const borrower = await borrowerRepository.deleteBorrower(req.params.id);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    res.status(204).end();
  }),
);

// Checkout a book 
router.post(
  '/:id/checkout',
  authMiddleware,
  parseIdParam('id'),
  validateCheckout,
  asyncHandler(async (req, res) => {
    // Borrower can only checkout for themselves
    if (req.borrower.id !== req.params.id) {
      throw new HttpError('You can only checkout books for yourself', 403);
    }
    
    const result = await checkoutRepository.checkoutBook({
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
  authMiddleware,
  parseIdParam('id'),
  validateReturn,
  asyncHandler(async (req, res) => {
    // Borrower can only return books for themselves
    if (req.borrower.id !== req.params.id) {
      throw new HttpError('You can only return books for yourself', 403);
    }
    
    const result = await checkoutRepository.returnBook({
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
    const borrower = await borrowerRepository.getBorrowerById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower not found' });
    }

    const activeOnly = req.query.active === 'true';
    const overdueOnly = req.query.overdue === 'true';

    const checkouts = await checkoutRepository.getCheckoutsByBorrower(req.params.id, { activeOnly, overdueOnly });
    res.json(checkouts);
  }),
);

module.exports = router;
