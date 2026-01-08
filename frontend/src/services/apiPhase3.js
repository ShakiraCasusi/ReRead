/**
 * Phase 3 - Enhanced API Service with JWT Support
 * Handles all API requests with automatic JWT token injection and refresh
 */

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.maxRetries = 3;
    }

    /**
     * Get authorization headers
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (window.authManager && window.authManager.isLoggedIn()) {
            const token = window.authManager.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Retry logic for failed requests
     */
    async retry(fn, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                if (error.status === 401) {
                    // Try to refresh token
                    if (window.authManager && await window.authManager.refreshAccessToken()) {
                        continue;
                    } else {
                        throw error;
                    }
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 (token expired)
            if (response.status === 401 && window.authManager) {
                if (await window.authManager.refreshAccessToken()) {
                    // Retry with new token
                    config.headers = this.getAuthHeaders();
                    return await fetch(url, config).then(r => r.json());
                } else {
                    // Redirect to login
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

    /**
     * Authentication Endpoints
     */

    // Register new user
    async register(username, email, password, firstName = '', lastName = '') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username,
                email,
                password,
                firstName,
                lastName
            })
        });
    }

    // Login user
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Refresh token
    async refreshToken(refreshToken) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }

    // Logout user
    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    // Get current profile
    async getCurrentProfile() {
        return this.request('/auth/profile');
    }

    // Update profile
    async updateProfile(data) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Books Endpoints
     */

    // Get all books
    async getBooks(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/books?${params}`);
    }

    // Get book by ID
    async getBook(bookId) {
        return this.request(`/books/${bookId}`);
    }

    /**
     * Cart Endpoints
     */

    // Get user's cart
    async getCart() {
        return this.request('/cart');
    }

    // Add item to cart
    async addToCart(bookId, quantity = 1) {
        return this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ bookId, quantity })
        });
    }

    // Update cart item quantity
    async updateCartItem(itemIndex, quantity) {
        return this.request(`/cart/update/${itemIndex}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    // Remove item from cart
    async removeFromCart(itemIndex) {
        return this.request(`/cart/remove/${itemIndex}`, {
            method: 'DELETE'
        });
    }

    // Clear cart
    async clearCart() {
        return this.request('/cart/clear', {
            method: 'DELETE'
        });
    }

    // Get cart count
    async getCartCount() {
        return this.request('/cart/count');
    }

    /**
     * Order Endpoints
     */

    // Create order
    async createOrder(shippingAddress, totalAmount, paymentIntentId = null) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify({
                shippingAddress,
                totalAmount,
                paymentIntentId
            })
        });
    }

    // Get buyer's orders
    async getBuyerOrders() {
        return this.request('/orders/buyer');
    }

    // Get seller's orders
    async getSellerOrders() {
        return this.request('/orders/seller');
    }

    // Get order by ID
    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    // Update order status
    async updateOrderStatus(orderId, status, trackingNumber = null) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, trackingNumber })
        });
    }

    // Update payment status
    async updatePaymentStatus(orderId, paymentStatus, paymentIntentId = null) {
        return this.request(`/orders/${orderId}/payment`, {
            method: 'PUT',
            body: JSON.stringify({ paymentStatus, paymentIntentId })
        });
    }

    /**
     * Review Endpoints
     */

    // Create review
    async createReview(bookId, orderId, rating, title, comment) {
        return this.request('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                bookId,
                orderId,
                rating,
                title,
                comment
            })
        });
    }

    // Get book reviews
    async getBookReviews(bookId, sortBy = 'recent', filterRating = null) {
        const params = new URLSearchParams({ sortBy });
        if (filterRating) params.append('filterRating', filterRating);
        return this.request(`/reviews/book/${bookId}?${params}`);
    }

    // Get review by ID
    async getReview(reviewId) {
        return this.request(`/reviews/${reviewId}`);
    }

    // Update review
    async updateReview(reviewId, rating, title, comment) {
        return this.request(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify({ rating, title, comment })
        });
    }

    // Delete review
    async deleteReview(reviewId) {
        return this.request(`/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    }

    // Mark review as helpful
    async markReviewHelpful(reviewId) {
        return this.request(`/reviews/${reviewId}/helpful`, {
            method: 'POST'
        });
    }

    /**
     * Seller Endpoints
     */

    // Become a seller
    async becomeSeller(storeName, description, bankAccount = '') {
        return this.request('/seller/register', {
            method: 'POST',
            body: JSON.stringify({
                storeName,
                description,
                bankAccount
            })
        });
    }

    // Upload book (create listing)
    async uploadBook(bookData) {
        return this.request('/seller/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    // Get seller's books
    async getSellerBooks() {
        return this.request('/seller/books');
    }

    // Get specific seller book
    async getSellerBook(bookId) {
        return this.request(`/seller/books/${bookId}`);
    }

    // Update book listing
    async updateBookListing(bookId, bookData) {
        return this.request(`/seller/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    // Delete book listing
    async deleteBookListing(bookId) {
        return this.request(`/seller/books/${bookId}`, {
            method: 'DELETE'
        });
    }

    // Get seller profile
    async getSellerProfile(sellerId) {
        return this.request(`/seller/profile/${sellerId}`);
    }

    // Get all sellers
    async getAllSellers() {
        return this.request('/seller');
    }
}

// Create global API service instance
window.apiService = new APIService();
