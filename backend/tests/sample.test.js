describe('Smoke Test', () => {
    test('sanity check - environment is ready', () => {
        expect(true).toBe(true);
        expect(process.env.NODE_ENV).not.toBeUndefined();
    });
});