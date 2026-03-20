const { isValidEmail, isValidPassword } = require('../utils/validationHelpers');

describe('Validation Helpers', () => {
    describe('isValidEmail', () => {
        test('should return true for a valid email address', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        test('should return false for invalid strings', () => {
            expect(isValidEmail('not-an-email')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPassword', () => {
        test('should return true for passwords with 8+ characters', () => {
            expect(isValidPassword('superSecret123')).toBe(true);
        });

        test('should return false for short passwords', () => {
            expect(isValidPassword('short')).toBe(false);
        });
    });
});