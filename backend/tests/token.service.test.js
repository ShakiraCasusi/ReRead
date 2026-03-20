const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyToken,
    decodeToken,
    authenticateToken,
    authenticateRefreshToken
} = require('../utils/tokenManager');

// Mock the external dependency
jest.mock('jsonwebtoken');

describe('Token Manager', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('generateAccessToken should sign token with correct payload and expiry', () => {
        const userId = '12345';
        const email = 'test@example.com';
        const username = 'testuser';
        const role = 'user';
        const mockToken = 'mocked_jwt_token';

        // Setup the mock return value
        jwt.sign.mockReturnValue(mockToken);

        const result = generateAccessToken(userId, email, username, role);

        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ userId, email, username, role }),
            expect.any(String), // Matches the JWT_SECRET (env or default)
            { expiresIn: '15m' }
        );
        expect(result).toBe(mockToken);
    });

    test('generateRefreshToken should sign token with correct expiry', () => {
        const userId = '12345';
        const mockToken = 'mocked_refresh_token';
        jwt.sign.mockReturnValue(mockToken);

        const result = generateRefreshToken(userId);

        expect(jwt.sign).toHaveBeenCalledWith({ userId }, expect.any(String), { expiresIn: '7d' });
        expect(result).toBe(mockToken);
    });

    test('generateTokens should return both access and refresh tokens', () => {
        jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

        const result = generateTokens('123', 'test@test.com', 'user', 'user');

        expect(result).toHaveProperty('accessToken', 'access_token');
        expect(result).toHaveProperty('refreshToken', 'refresh_token');
        expect(result).toHaveProperty('expiresIn', '15m');
    });

    describe('Token Verification & Decoding', () => {
        test('verifyToken should return decoded payload on success', () => {
            const mockDecoded = { userId: '123' };
            jwt.verify.mockReturnValue(mockDecoded);

            const result = verifyToken('valid_token');
            expect(result).toBe(mockDecoded);
        });

        test('verifyToken should return null on error', () => {
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            const result = verifyToken('invalid_token');
            expect(result).toBeNull();
        });

        test('decodeToken should return decoded payload', () => {
            const mockDecoded = { userId: '123' };
            jwt.decode.mockReturnValue(mockDecoded);

            const result = decodeToken('token');
            expect(result).toBe(mockDecoded);
        });
    });

    describe('Middleware: authenticateToken', () => {
        let req, res, next;

        beforeEach(() => {
            req = { headers: {} };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        test('should return 401 if authorization header is missing', () => {
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Access token required' }));
        });

        test('should return 403 if token is invalid', () => {
            req.headers['authorization'] = 'Bearer invalid_token';
            jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });

            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should call next() and set req.user if token is valid', () => {
            req.headers['authorization'] = 'Bearer valid_token';
            const mockUser = { userId: '123' };
            jwt.verify.mockReturnValue(mockUser);

            authenticateToken(req, res, next);
            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('Middleware: authenticateRefreshToken', () => {
        let req, res, next;

        beforeEach(() => {
            req = { body: {} };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        test('should return 401 if refreshToken is missing', () => {
            authenticateRefreshToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('should return 403 if refreshToken is invalid', () => {
            req.body.refreshToken = 'invalid';
            jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });

            authenticateRefreshToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should call next() if refreshToken is valid', () => {
            req.body.refreshToken = 'valid';
            jwt.verify.mockReturnValue({ userId: '123' });

            authenticateRefreshToken(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});