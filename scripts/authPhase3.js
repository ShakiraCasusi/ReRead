/**
 * Phase 3 - Enhanced Authentication Manager with JWT Support
 * Manages JWT tokens, user session, and authentication state
 */

class AuthManager {
  constructor() {
    this.accessToken = sessionStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
    this.user = this.loadUser();
    this.tokenExpiryTime = sessionStorage.getItem("tokenExpiryTime");
    this.initAuthUI();
    this.setupTokenRefresh();
  }

  /**
   * Load user from sessionStorage
   */
  loadUser() {
    const userStr = sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Save user to sessionStorage
   */
  saveUser(user) {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
      this.user = user;
    }
  }

  /**
   * Save tokens
   */
  saveTokens(accessToken, refreshToken, expiresIn = 900000) {
    // 15 minutes default
    sessionStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    // Store token expiry time (15 minutes from now)
    const expiryTime = Date.now() + expiresIn;
    sessionStorage.setItem("tokenExpiryTime", expiryTime.toString());

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiryTime = expiryTime;
  }

  /**
   * Clear all tokens and user data
   */
  clearTokens() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("tokenExpiryTime");
    localStorage.removeItem("refreshToken");

    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.tokenExpiryTime = null;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiryTime) return true;
    return Date.now() > parseInt(this.tokenExpiryTime) - 60000; // Refresh 1 minute before expiry
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      this.logout();
      return false;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        this.saveTokens(
          data.data.accessToken,
          data.data.refreshToken,
          data.data.expiresIn,
        );
        console.log("Token refreshed successfully");
        return true;
      } else {
        console.error("Token refresh failed:", data.message);
        this.logout();
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.logout();
      return false;
    }
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    // Check token every 5 minutes
    setInterval(
      () => {
        if (this.isLoggedIn() && this.isTokenExpired()) {
          console.log("Token expiring soon, refreshing...");
          this.refreshAccessToken();
        }
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Get user's role(s)
   */
  getUserRoles() {
    return this.user?.role || [];
  }

  /**
   * Check if user is a seller
   */
  isSeller() {
    return this.user?.isSeller || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const roles = this.getUserRoles();
    return Array.isArray(roles) ? roles.includes(role) : roles === role;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint to invalidate on server (optional)
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      console.warn("Error calling logout endpoint:", error);
    }

    this.clearTokens();
    localStorage.removeItem("rereadUser");
    this.removeUserMenu();
    this.createAuthButtons();

    // Dispatch logout event for other components
    window.dispatchEvent(new CustomEvent("userLogout"));
  }

  /**
   * Initialize authentication UI on page load
   */
  initAuthUI() {
    const navbar = document.querySelector(".navbar");

    if (this.isLoggedIn()) {
      this.createUserMenu();
    } else {
      this.createAuthButtons();
    }
  }

  /**
   * Create user menu for logged-in users
   */
  createUserMenu() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    // Remove existing auth buttons if present
    const existingAuthNav = document.getElementById("auth-nav");
    if (existingAuthNav) {
      existingAuthNav.remove();
    }

    const navEnd =
      navbar.querySelector(".navbar-collapse .ms-auto") ||
      navbar.querySelector(".navbar-nav");
    if (!navEnd) return;

    // Create user menu
    const userMenuHtml = `
            <div id="auth-nav" class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" 
                       data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> 
                        <span class="ms-2">${this.user.username}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="../pages/profile.html">
                            <i class="fas fa-user"></i> My Profile
                        </a></li>
                        <li><a class="dropdown-item" href="../pages/orders.html">
                            <i class="fas fa-receipt"></i> Order History
                        </a></li>
                        ${
                          this.isSeller()
                            ? `
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="../pages/seller-dashboard.html">
                                <i class="fas fa-store"></i> Seller Dashboard
                            </a></li>
                            <li><a class="dropdown-item" href="../pages/upload-book.html">
                                <i class="fas fa-plus"></i> Upload Book
                            </a></li>
                        `
                            : `
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="../pages/become-seller.html">
                                <i class="fas fa-store"></i> Become a Seller
                            </a></li>
                        `
                        }
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Sign Out
                        </a></li>
                    </ul>
                </li>
            </div>
        `;

    // Insert before the last nav item (if there's a cart button)
    const cartNav = navbar.querySelector(".navbar-nav .nav-item:last-child");
    if (cartNav && cartNav.querySelector('[href*="cart"]')) {
      cartNav.insertAdjacentHTML("beforebegin", userMenuHtml);
    } else {
      navEnd.insertAdjacentHTML("beforeend", userMenuHtml);
    }

    // Add logout event listener
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.logout();
    });

    // Dispatch login event for other components
    window.dispatchEvent(new CustomEvent("userLogin", { detail: this.user }));
  }

  /**
   * Remove user menu
   */
  removeUserMenu() {
    const authNav = document.getElementById("auth-nav");
    if (authNav) {
      authNav.remove();
    }
  }

  /**
   * Create Sign In / Sign Up buttons
   */
  createAuthButtons() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    // Remove existing user menu if present
    this.removeUserMenu();

    const navEnd =
      navbar.querySelector(".navbar-collapse .ms-auto") ||
      navbar.querySelector(".navbar-nav");
    if (!navEnd) return;

    const authButtonsHtml = `
            <div id="auth-nav" class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="../pages/signin.html">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </a>
                </li>
            </div>
        `;

    navEnd.insertAdjacentHTML("beforeend", authButtonsHtml);
  }

  /**
   * Update cart badge with item count
   */
  async updateCartBadge() {
    if (!this.isLoggedIn()) return;

    try {
      const response = await fetch("http://localhost:5000/api/cart/count", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const badge = document.querySelector(".cart-badge");
        if (badge) {
          badge.textContent = data.data.itemCount;
          badge.style.display =
            data.data.itemCount > 0 ? "inline-block" : "none";
        }
      }
    } catch (error) {
      console.warn("Error updating cart badge:", error);
    }
  }
}

// Initialize auth manager when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.authManager = new AuthManager();
  });
} else {
  window.authManager = new AuthManager();
}
