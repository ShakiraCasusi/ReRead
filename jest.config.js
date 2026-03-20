module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.js"],
    collectCoverageFrom: [
        "**/*.js",
        "!**/node_modules/**",
        "!**/coverage/**",
        "!jest.config.js"
    ]
};