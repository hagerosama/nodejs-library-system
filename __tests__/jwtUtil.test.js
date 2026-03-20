const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, extractTokenFromHeader } = require('../src/utils/jwtUtil');
const { HttpError } = require('../src/models/errors');

const TEST_SECRET = 'secret-key';
process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_EXPIRY = '7d';

describe('JWT Utility Functions', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const borrowerId = 1;
      const email = 'test@example.com';

      const token = generateToken(borrowerId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts separated by dots
    });

    it('should contain correct claims in the token', () => {
      const borrowerId = 42;
      const email = 'john@example.com';

      const token = generateToken(borrowerId, email);
      const decoded = jwt.verify(token, TEST_SECRET);

      expect(decoded.id).toBe(borrowerId);
      expect(decoded.email).toBe(email);
    });

    it('should have correct expiry time in token', () => {
      const token = generateToken(1, 'test@example.com');
      const decoded = jwt.verify(token, TEST_SECRET);

      const now = Math.floor(Date.now() / 1000);
      const expiryInSeconds = 7 * 24 * 60 * 60; // 7 days

      // Token should expire in approximately 7 days (allow 5 second variance)
      expect(decoded.exp - now).toBeGreaterThan(expiryInSeconds - 5);
      expect(decoded.exp - now).toBeLessThanOrEqual(expiryInSeconds);
    });

    it('should generate different tokens for different inputs', () => {
      const token1 = generateToken(1, 'user1@example.com');
      const token2 = generateToken(2, 'user2@example.com');

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return claims', () => {
      const borrowerId = 5;
      const email = 'alice@example.com';
      const token = generateToken(borrowerId, email);

      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(borrowerId);
      expect(decoded.email).toBe(email);
    });

    it('should throw HttpError (401) for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow(HttpError);
      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw HttpError (401) for malformed token', () => {
      const malformedToken = 'not-a-valid-jwt';

      expect(() => verifyToken(malformedToken)).toThrow(HttpError);
    });

    it('should throw HttpError (401) for token signed with different secret', () => {
      const differentSecret = 'different-secret';
      const token = jwt.sign(
        { id: 1, email: 'test@example.com' },
        differentSecret,
        { expiresIn: '7d' }
      );

      expect(() => verifyToken(token)).toThrow(HttpError);
      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });

    it('should throw HttpError (401) for expired token', (done) => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com' },
        TEST_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow(HttpError);
        expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
        done();
      }, 100);
    });

    it('should return token with iat (issued at) claim', () => {
      const token = generateToken(1, 'test@example.com');
      const decoded = verifyToken(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract valid Bearer token from authorization header', () => {
      const token = 'test.jwt.token';
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const extracted = extractTokenFromHeader(req);

      expect(extracted).toBe(token);
    });

    it('should handle token with special characters', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.';
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const extracted = extractTokenFromHeader(req);

      expect(extracted).toBe(token);
    });

    it('should throw HttpError (401) when authorization header is missing', () => {
      const req = {
        headers: {},
      };

      expect(() => extractTokenFromHeader(req)).toThrow(HttpError);
      expect(() => extractTokenFromHeader(req)).toThrow('Missing or invalid authorization header');
    });

    it('should throw HttpError (401) when authorization header is null', () => {
      const req = {
        headers: {
          authorization: null,
        },
      };

      expect(() => extractTokenFromHeader(req)).toThrow(HttpError);
      expect(() => extractTokenFromHeader(req)).toThrow('Missing or invalid authorization header');
    });

    it('should throw HttpError (401) when authorization header does not start with Bearer', () => {
      const req = {
        headers: {
          authorization: 'Basic user:password',
        },
      };

      expect(() => extractTokenFromHeader(req)).toThrow(HttpError);
      expect(() => extractTokenFromHeader(req)).toThrow('Missing or invalid authorization header');
    });

    it('should be case-sensitive for Bearer prefix', () => {
      const req = {
        headers: {
          authorization: 'bearer token123', // lowercase 'bearer'
        },
      };

      expect(() => extractTokenFromHeader(req)).toThrow(HttpError);
    });

    it('should handle extra whitespace correctly', () => {
      const token = 'valid.token.here';
      const req = {
        headers: {
          authorization: `Bearer  ${token}`, // Extra space
        },
      };

      const extracted = extractTokenFromHeader(req);

      // Should extract with the extra space included
      expect(extracted).toBe(` ${token}`);
    });
  });

  describe('Integration tests', () => {
    it('should complete full JWT flow: generate -> verify -> extract', () => {
      const borrowerId = 99;
      const email = 'integration@example.com';

      // Generate token
      const token = generateToken(borrowerId, email);

      // Verify token
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(borrowerId);
      expect(decoded.email).toBe(email);

      // Extract from header-like object
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const extracted = extractTokenFromHeader(req);
      expect(extracted).toBe(token);

      // Verify extracted token
      const decoded2 = verifyToken(extracted);
      expect(decoded2.id).toBe(borrowerId);
      expect(decoded2.email).toBe(email);
    });

    it('should handle complete request-response cycle', () => {
      // Simulate user login: generate token
      const loginResponse = {
        token: generateToken(10, 'user10@example.com'),
        user: { id: 10, email: 'user10@example.com' },
      };

      // Simulate middleware: extract and verify token from request
      const req = {
        headers: {
          authorization: `Bearer ${loginResponse.token}`,
        },
      };

      const extractedToken = extractTokenFromHeader(req);
      const claims = verifyToken(extractedToken);

      // Verify middleware set correct user context
      expect(claims.id).toBe(10);
      expect(claims.email).toBe('user10@example.com');
    });
  });
});
