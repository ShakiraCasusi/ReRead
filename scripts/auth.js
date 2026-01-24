// Frontend Authentication Manager
// Manages user session, login/logout, and UI updates :)))

class AuthManager {
    constructor() {
        this.user = this.loadUser();
        this.initAuthUI();
    }

    // Load user from localStorage
    loadUser() {
        try {
            const userData = localStorage.getItem('rereadUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error loading user:', error);
            return null;
        }
    }

    // Save user to localStorage
    saveUser(userData) {
        localStorage.setItem('rereadUser', JSON.stringify(userData));
        this.user = userData;
        this.initAuthUI();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user && this.user.id;
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Logout user
    logout() {
        localStorage.removeItem('rereadUser');
        this.user = null;
        this.initAuthUI();
        window.location.href = '../pages/signin.html';
    }

    // Initialize authentication UI (show/hide buttons based on login state)
    initAuthUI() {
        // Update all sign-in buttons/links
        const signinButtons = document.querySelectorAll('a[href="signin.html"], a[href="../pages/signin.html"]');

        if (this.isLoggedIn()) {
            // User is logged in - hide signin, show profile/logout
            signinButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            // Added a user menu/logout button if not already present
            this.createUserMenu();
        } else {
            // User is not logged in = show signin
            signinButtons.forEach(btn => {
                btn.style.display = 'inline-block';
            });

            // Remove user menu
            this.removeUserMenu();
        }

        // Update header visibility for authentication state
        this.updateHeaderVisibility();
    }

    // Create user profile menu
    createUserMenu() {
        // Check if menu already exists
        if (document.getElementById('userProfileMenu')) {
            return;
        }

        // Find the navbar to add the menu
        const nav = document.querySelector('nav.col-auto.d-none.d-lg-flex');
        if (!nav) return;

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.id = 'userProfileMenu';
        dropdown.innerHTML = `
      <button class="btn btn-link text-dark text-decoration-none dropdown-toggle" type="button" id="userMenuBtn" data-bs-toggle="dropdown">
        <i class="fas fa-user-circle me-1"></i>${this.user.username}
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuBtn">
        <li><a class="dropdown-item" href="../pages/profile.html"><i class="fas fa-user me-2"></i>Profile</a></li>
        <li><a class="dropdown-item" href="../pages/orders.html"><i class="fas fa-history me-2"></i>Orders</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
      </ul>
    `;

        // Insert before the sign-in button
        const signinLink = nav.querySelector('a[href="signin.html"], a[href="../pages/signin.html"]');
        if (signinLink) {
            signinLink.parentElement.insertBefore(dropdown, signinLink);
        } else {
            nav.appendChild(dropdown);
        }

        // Add logout handler
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    // Remove user profile menu
    removeUserMenu() {
        const menu = document.getElementById('userProfileMenu');
        if (menu) {
            menu.remove();
        }
    }

    // Update header visibility based on authentication state
    updateHeaderVisibility() {
        const user = localStorage.getItem('rereadUser');

        // Hide Sign In link (Desktop)
        const desktopSignIn = document.querySelector('nav a[href="pages/signin.html"]');
        if (desktopSignIn) {
            desktopSignIn.style.display = user ? 'none' : 'block';
        }

        // Hide Sign In link (Mobile)
        const mobileSignIn = document.querySelector('#mobileMenu a[href="pages/signin.html"]');
        if (mobileSignIn) {
            mobileSignIn.style.display = user ? 'none' : 'block';
        }
    }
}

// Initialize AuthManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
