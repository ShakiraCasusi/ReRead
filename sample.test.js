// Sample unit test for a pure function
const sum = (a, b) => a + b;

describe('Math Utils', () => {
    test('calculates sum correctly', () => {
        const result = sum(1, 2);
        expect(result).toBe(3);
    });
});