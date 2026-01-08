const API_BASE_URL = 'http://localhost:5000/api';

// Books
export const bookAPI = {
    getAllBooks: async () => {
        const response = await fetch(`${API_BASE_URL}/books`);
        return response.json();
    },

    getBook: async (id) => {
        const response = await fetch(`${API_BASE_URL}/books/${id}`);
        return response.json();
    },

    createBook: async (bookData) => {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData),
        });
        return response.json();
    },

    updateBook: async (id, bookData) => {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData),
        });
        return response.json();
    },

    deleteBook: async (id) => {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    searchBooks: async (query) => {
        const response = await fetch(`${API_BASE_URL}/books/search?query=${query}`);
        return response.json();
    },

    searchExternal: async (query) => {
        const response = await fetch(`${API_BASE_URL}/books/external/search?query=${query}`);
        return response.json();
    },
};

// Auth
export const authAPI = {
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return response.json();
    },

    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return response.json();
    },

    getProfile: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
        return response.json();
    },
};

// Cart
export const cartAPI = {
    getCart: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`);
        return response.json();
    },

    addToCart: async (userId, bookId, quantity = 1) => {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, quantity }),
        });
        return response.json();
    },

    removeFromCart: async (userId, bookId) => {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId }),
        });
        return response.json();
    },
};
