const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    // Simple regex for demonstration
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    // Min 8 characters
    return password.length >= 8;
};

module.exports = { isValidEmail, isValidPassword };