// scripts/signin.js - JavaScript for the signin page

const authMessages = {
  signin: {
    title: "Welcome back!",
    subtitle: "Sign in to your account to continue shopping",
  },
  signup: {
    title: "Welcome to Re;Read!",
    subtitle: "Create your account to start selling & saving on books",
  },
};

document.addEventListener("DOMContentLoaded", function () {
  initSigninPage();
});

function initSigninPage() {
  initTabSwitching();
  initFormValidation();
  initSocialLogin();
  initPasswordToggle();

  // initialize panel based on which radio is checked (prevents mismatch)
  const signinRadio = document.getElementById("tab-signin");
  const signupRadio = document.getElementById("tab-signup");

  if (signupRadio && signupRadio.checked) {
    showPanel("signup");
  } else {
    showPanel("signin");
  }
}

function updateWelcomeText(panelType) {
  const message = authMessages[panelType];
  if (!message) {
    return;
  }

  const titleEl = document.querySelector(".welcome-title");
  const subtitleEl = document.querySelector(".welcome-subtitle");

  if (titleEl) {
    titleEl.textContent = message.title;
  }
  if (subtitleEl) {
    subtitleEl.textContent = message.subtitle;
  }
}

function initTabSwitching() {
  const signinTab = document.getElementById("tab-signin");
  const signupTab = document.getElementById("tab-signup");

  if (signinTab && signupTab) {
    // Handle tab switching via labels (since radio buttons are hidden)
    const signinLabel = document.querySelector('label[for="tab-signin"]');
    const signupLabel = document.querySelector('label[for="tab-signup"]');

    if (signinLabel) {
      signinLabel.addEventListener("click", function () {
        showPanel("signin");
      });
    }

    if (signupLabel) {
      signupLabel.addEventListener("click", function () {
        showPanel("signup");
      });
    }

    signinTab.addEventListener("change", function () {
      if (this.checked) {
        showPanel("signin");
      }
    });

    signupTab.addEventListener("change", function () {
      if (this.checked) {
        showPanel("signup");
      }
    });
  }
}

function showPanel(panelType) {
  const signinPanel = document.querySelector(".panel-signin");
  const signupPanel = document.querySelector(".panel-signup");

  if (panelType === "signin") {
    if (signinPanel) signinPanel.style.display = "block";
    if (signupPanel) signupPanel.style.display = "none";

    // Update radio button
    const signinRadio = document.getElementById("tab-signin");
    const signupRadio = document.getElementById("tab-signup");

    if (signinRadio) signinRadio.checked = true;
    if (signupRadio) signupRadio.checked = false;
  } else {
    if (signinPanel) signinPanel.style.display = "none";
    if (signupPanel) signupPanel.style.display = "block";

    // Update radio button
    const signinRadio = document.getElementById("tab-signin");
    const signupRadio = document.getElementById("tab-signup");

    if (signinRadio) signinRadio.checked = false;
    if (signupRadio) signupRadio.checked = true;
  }

  updateWelcomeText(panelType);
}

function initFormValidation() {
  const signinForm = document.getElementById("signin-form");
  if (signinForm) {
    signinForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailInput = signinForm.querySelector("#signin-email");
      const passwordInput = signinForm.querySelector("#signin-password");

      const isEmailValid = validateSigninField(emailInput);
      const isPasswordValid = validateSigninField(passwordInput);

      if (isEmailValid && isPasswordValid) {
        submitSignin(emailInput.value.trim(), passwordInput.value);
      }
    });

    signinForm.querySelectorAll("input").forEach((input) => {
      input.addEventListener("blur", function () {
        validateSigninField(this);
      });

      input.addEventListener("input", function () {
        clearFieldError(this);
      });
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    const passwordInput = signupForm.querySelector("#signup-password");
    const confirmInput = signupForm.querySelector("#signup-confirm");

    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameInput = signupForm.querySelector("#signup-name");
      const emailInput = signupForm.querySelector("#signup-email");

      const isNameValid = validateSignupField(nameInput);
      const isEmailValid = validateSignupField(emailInput);
      const isPasswordValid = validateSignupField(passwordInput);
      const isConfirmValid = validateSignupField(confirmInput);

      if (isNameValid && isEmailValid && isPasswordValid && isConfirmValid) {
        submitSignup(
          nameInput.value.trim(),
          emailInput.value.trim(),
          passwordInput.value,
          confirmInput.value
        );
      }
    });

    signupForm.querySelectorAll("input").forEach((input) => {
      input.addEventListener("blur", function () {
        validateSignupField(this);

        if (this.id === "signup-confirm" && passwordInput) {
          validatePasswordConfirmation(passwordInput.value, this.value, this);
        }
      });

      input.addEventListener("input", function () {
        clearFieldError(this);

        if (this.id === "signup-confirm" && passwordInput) {
          validatePasswordConfirmation(passwordInput.value, this.value, this);
        }
      });
    });
  }
}

function validateSigninField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = "";

  if (field.type === "email") {
    if (!value) {
      isValid = false;
      errorMessage = "Email is required";
    } else if (!isValidEmail(value)) {
      isValid = false;
      errorMessage = "Please enter a valid email address";
    }
  } else if (field.type === "password") {
    if (!value) {
      isValid = false;
      errorMessage = "Password is required";
    }
  }

  if (!isValid) {
    showFieldError(field, errorMessage);
  } else {
    clearFieldError(field);
  }

  return isValid;
}

function validateSignupField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = "";

  if (field.id === "signup-name") {
    if (!value) {
      isValid = false;
      errorMessage = "Full name is required";
    } else if (!isValidFullName(value)) {
      isValid = false;
      errorMessage = "Enter your first and last name (letters only)";
    }
  } else if (field.type === "email") {
    if (!value) {
      isValid = false;
      errorMessage = "Email is required";
    } else if (!isValidEmail(value)) {
      isValid = false;
      errorMessage = "Please enter a valid email address";
    }
  } else if (field.type === "password" && field.id !== "signup-confirm") {
    if (!value) {
      isValid = false;
      errorMessage = "Password is required";
    } else if (!isStrongPassword(value)) {
      isValid = false;
      errorMessage =
        "Password must be 8+ characters with uppercase, lowercase, number, and symbol";
    }
  } else if (field.id === "signup-confirm") {
    if (!value) {
      isValid = false;
      errorMessage = "Please confirm your password";
    } else {
      return validatePasswordConfirmation(
        document.getElementById("signup-password").value,
        value,
        field
      );
    }
  }

  if (!isValid) {
    showFieldError(field, errorMessage);
  } else {
    clearFieldError(field);
  }

  return isValid;
}

function validatePasswordConfirmation(password, confirmPassword, field) {
  if (!field) {
    return false;
  }

  if (!confirmPassword) {
    showFieldError(field, "Please confirm your password");
    return false;
  }

  if (password !== confirmPassword) {
    showFieldError(field, "Passwords do not match");
    return false;
  }

  clearFieldError(field);
  return true;
}

function validateSigninForm(email, password) {
  return isValidEmail(email) && isStrongPassword(password);
}

function validateSignupForm(name, email, password, confirmPassword) {
  return (
    isValidFullName(name) &&
    isValidEmail(email) &&
    isStrongPassword(password) &&
    validatePasswordConfirmation(
      password,
      confirmPassword,
      document.getElementById("signup-confirm")
    )
  );
}

function isValidEmail(email) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

function isStrongPassword(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    password.length >= 8 &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecial
  );
}

function isValidFullName(name) {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return false;
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 2) {
    return false;
  }

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+([\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
  return nameRegex.test(trimmed);
}

function showFieldError(field, message) {
  const inputGroup = field.closest(".input-group");
  if (!inputGroup) return;

  const errorDiv = inputGroup.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains("field-error-container")) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    inputGroup.classList.add("has-error");
  }
}

function clearFieldError(field) {
  const inputGroup = field.closest(".input-group");
  if (!inputGroup) return;

  const errorDiv = inputGroup.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains("field-error-container")) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
    inputGroup.classList.remove("has-error");
  }
}

function initPasswordToggle() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach((input) => {
    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    toggleBtn.className = "password-toggle"; // Style is now in signin.css

    // Position the input group relatively
    const inputGroup = input.parentNode;
    if (inputGroup && inputGroup.classList.contains("input-group")) {
      // inputGroup is already relative from CSS

      inputGroup.appendChild(toggleBtn);

      toggleBtn.addEventListener("click", function () {
        if (input.type === "password") {
          input.type = "text";
          this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
          input.type = "password";
          this.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
      });
    }
  });
}

function initSocialLogin() {
  const googleBtns = document.querySelectorAll(".social-btn.google");
  const facebookBtns = document.querySelectorAll(".social-btn.facebook");

  googleBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      // Placeholder for Google OAuth
      alert("Google login integration coming soon!");
    });
  });

  facebookBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      // Placeholder for Facebook OAuth
      alert("Facebook login integration coming soon!");
    });
  });
}

async function submitSignin(email, password) {
  // Show loading state
  const submitBtn = document.querySelector(".panel-signin .btn");
  const originalText = submitBtn.textContent;

  submitBtn.textContent = "Signing In...";
  submitBtn.disabled = true;

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success) {
      // Store user session in localStorage
      localStorage.setItem(
        "rereadUser",
        JSON.stringify({
          id: result.data.id,
          username: result.data.username,
          email: result.data.email,
          role: result.data.role,
          signinTime: new Date().toISOString(),
        })
      );

      showSuccessMessage("Sign in successful! Redirecting...");

      // Redirect to home page after brief delay
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } else {
      showErrorMessage(result.message || "Sign in failed. Please try again.");
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error("Sign in error:", error);
    showErrorMessage("Error connecting to server. Please try again.");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

async function submitSignup(name, email, password, confirmPassword) {
  // Show loading state
  const submitBtn = document.querySelector(".panel-signup .btn");
  const originalText = submitBtn.textContent;

  submitBtn.textContent = "Creating Account...";
  submitBtn.disabled = true;

  // Split name into first and last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email.split('@')[0],
        email,
        password,
        firstName,
        lastName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showSuccessMessage("Account created successfully! Switching to sign in...");

      // Switch to signin panel after brief delay
      setTimeout(() => {
        const signinRadio = document.getElementById("tab-signin");
        if (signinRadio) {
          signinRadio.checked = true;
          signinRadio.dispatchEvent(new Event('change', { bubbles: true }));
          showPanel("signin");

          // Pre-fill email
          const signinEmailInput = document.querySelector("#signin-email");
          if (signinEmailInput) {
            signinEmailInput.value = email;
          }
        }
      }, 1500);

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    } else {
      showErrorMessage(result.message || "Sign up failed. Please try again.");
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error("Sign up error:", error);
    showErrorMessage("Error connecting to server. Please try again.");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function showSuccessMessage(message) {
  // Create and show success message
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.querySelector('.auth-container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
  }
}

function showErrorMessage(message) {
  // Create and show error message
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.querySelector('.auth-container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
  }
}

// Check if user is already signed in
function checkAuthStatus() {
  const user = localStorage.getItem("rereadUser");
  if (user) {
    // User is signed in, could show different UI
    console.log("User is signed in:", JSON.parse(user).email);
  }
}

// Initialize auth check
checkAuthStatus();
