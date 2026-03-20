module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.js"],
    collectCoverageFrom: [
        "**/*.js",
        "!**/tests/**",
        "!**/node_modules/**",
        "!**/coverage/**",
        "!jest.config.js"
    ],
    coverageThreshold: {
        global: {
            // TODO: Raise to 80% once more tests are added
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 30
        }
    }
};