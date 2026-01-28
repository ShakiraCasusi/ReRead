/**
 * Consolidated API Service
 * Handles all API requests with JWT token support and error handling
 */

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.maxRetries = 3;
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (window.authManager && window.authManager.isLoggedIn()) {
            const token = window.authManager.getAccessToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: { ...this.getAuthHeaders(), ...options.headers },
            credentials: 'include'
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401 && window.authManager) {
                if (await window.authManager.refreshAccessToken()) {
                    config.headers = this.getAuthHeaders();
                    return await fetch(url, config).then(r => r.json());
                } else {
                    window.location.href = '../pages/signin.html';
                    throw new Error('Session expired. Please login again.');
                }
            }

            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.message || 'API request failed');
                error.status = response.status;
                error.errorType = data.errorType;
                error.data = data;
                throw error;
            }
            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    // ========== AUTH ENDPOINTS ========== 
    async register(username, email, password, firstName = '', lastName = '') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, firstName, lastName })
        });
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    async getCurrentProfile() {
        return this.request('/auth/profile');
    }

    async getProfile(userId) {
        return this.request(`/auth/profile/${userId}`);
    }

    async updateProfile(data) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async refreshToken(refreshToken) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }

    // ========== BOOKS ENDPOINTS ==========
    async getBooks(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/books?${params}`);
    }

    async getAllBooks() {
        return this.request('/books');
    }

    async getBook(bookId) {
        return this.request(`/books/${bookId}`);
    }

    async createBook(bookData) {
        return this.request('/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    async updateBook(bookId, bookData) {
        return this.request(`/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    async deleteBook(bookId) {
        return this.request(`/books/${bookId}`, { method: 'DELETE' });
    }

    async searchBooks(query) {
        return this.request(`/books/search?query=${query}`);
    }

    async searchExternal(query) {
        return this.request(`/books/external/search?query=${query}`);
    }

    // ========== CART ENDPOINTS ==========
    async getCart() {
        return this.request('/cart');
    }

    async getCartCount() {
        return this.request('/cart/count');
    }

    async addToCart(bookId, quantity = 1) {
        return this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ bookId, quantity })
        });
    }

    async updateCartItem(itemIndex, quantity) {
        return this.request(`/cart/update/${itemIndex}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(itemIndex) {
        return this.request(`/cart/remove/${itemIndex}`, { method: 'DELETE' });
    }

    async clearCart() {
        return this.request('/cart/clear', { method: 'DELETE' });
    }

    // ========== ORDER ENDPOINTS ==========
    async createOrder(shippingAddress, totalAmount, paymentIntentId = null) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify({ shippingAddress, totalAmount, paymentIntentId })
        });
    }

    async getBuyerOrders() {
        return this.request('/orders/buyer');
    }

    async getSellerOrders() {
        return this.request('/orders/seller');
    }

    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status, trackingNumber = null) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, trackingNumber })
        });
    }

    async updatePaymentStatus(orderId, paymentStatus, paymentIntentId = null) {
        return this.request(`/orders/${orderId}/payment`, {
            method: 'PUT',
            body: JSON.stringify({ paymentStatus, paymentIntentId })
        });
    }

    // ========== REVIEW ENDPOINTS ==========
    async createReview(bookId, orderId, rating, title, comment) {
        return this.request('/reviews', {
            method: 'POST',
            body: JSON.stringify({ bookId, orderId, rating, title, comment })
        });
    }

    async getBookReviews(bookId, sortBy = 'recent', filterRating = null) {
        const params = new URLSearchParams({ sortBy });
        if (filterRating) params.append('filterRating', filterRating);
        return this.request(`/reviews/book/${bookId}?${params}`);
    }

    async getReview(reviewId) {
        return this.request(`/reviews/${reviewId}`);
    }

    async updateReview(reviewId, rating, title, comment) {
        return this.request(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify({ rating, title, comment })
        });
    }

    async deleteReview(reviewId) {
        return this.request(`/reviews/${reviewId}`, { method: 'DELETE' });
    }

    async markReviewHelpful(reviewId) {
        return this.request(`/reviews/${reviewId}/helpful`, { method: 'POST' });
    }

    // ========== SELLER ENDPOINTS ==========
    async becomeSeller(storeName, description, bankAccount = '') {
        return this.request('/seller/register', {
            method: 'POST',
            body: JSON.stringify({ storeName, description, bankAccount })
        });
    }

    async uploadBook(bookData) {
        return this.request('/seller/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    async getSellerBooks() {
        return this.request('/seller/books');
    }

    async getSellerBook(bookId) {
        return this.request(`/seller/books/${bookId}`);
    }

    async updateBookListing(bookId, bookData) {
        return this.request(`/seller/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    async deleteBookListing(bookId) {
        return this.request(`/seller/books/${bookId}`, { method: 'DELETE' });
    }

    async getSellerProfile(sellerId) {
        return this.request(`/seller/profile/${sellerId}`);
    }

    async getAllSellers() {
        return this.request('/seller');
    }
}

window.apiService = new APIService();
export default window.apiService;
