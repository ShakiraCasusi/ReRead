// scripts/about.js - JavaScript for the about page

document.addEventListener('DOMContentLoaded', function() {
    initAboutPage();
});

function initAboutPage() {
    initContactForm();
    initScrollAnimations();
    initValueCards();
}

function initContactForm() {
    const contactForm = document.querySelector('.about-contact-form form');

    if (!contactForm) return;

    // Form validation
    const requiredFields = contactForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateContactField(this);
        });

        field.addEventListener('input', function() {
            clearFieldError(this);
        });
    });

    // Form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateContactForm()) {
            submitContactForm();
        }
    });

    // Character counter for textarea
    const textarea = contactForm.querySelector('textarea');
    if (textarea) {
        const maxLength = 500;
        textarea.maxLength = maxLength;

        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            text-align: right;
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        `;

        textarea.parentNode.insertBefore(counter, textarea.nextSibling);

        textarea.addEventListener('input', function() {
            const remaining = maxLength - this.value.length;
            counter.textContent = `${remaining} characters remaining`;

            if (remaining < 50) {
                counter.style.color = '#ef4444';
            } else {
                counter.style.color = '#6b7280';
            }
        });

        // Trigger initial count
        textarea.dispatchEvent(new Event('input'));
    }
}

function validateContactField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch(field.type) {
        case 'text':
            if (!value) {
                isValid = false;
                errorMessage = 'Name is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            }
            break;

        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;

        case 'textarea':
            if (!value) {
                isValid = false;
                errorMessage = 'Message is required';
            } else if (value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters';
            }
            break;
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

function validateContactForm() {
    const contactForm = document.querySelector('.about-contact-form form');
    const requiredFields = contactForm.querySelectorAll('[required]');
    let isFormValid = true;

    requiredFields.forEach(field => {
        if (!validateContactField(field)) {
            isFormValid = false;
        }
    });

    return isFormValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(field, message) {
    clearFieldError(field);

    field.style.borderColor = '#ef4444';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 14px;
        margin-top: 4px;
        margin-bottom: 8px;
    `;

    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function submitContactForm() {
    const contactForm = document.querySelector('.about-contact-form form');
    const formData = new FormData(contactForm);

    // Show loading state
    const submitBtn = contactForm.querySelector('.about-submit-btn');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Reset form
        contactForm.reset();

        // Reset character counter
        const counter = contactForm.querySelector('.char-counter');
        if (counter) {
            counter.textContent = '500 characters remaining';
            counter.style.color = '#6b7280';
        }

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Show success message
        alert('Message sent successfully! We\'ll get back to you soon.');

    }, 1500);

    console.log('Contact form submission:', Object.fromEntries(formData));
}

function initScrollAnimations() {
    // Animate elements as they come into view
    const animateElements = document.querySelectorAll('.value-card, .serve-card, .commitment-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

function initValueCards() {
    // Add hover effects to value cards
    const valueCards = document.querySelectorAll('.value-card');

    valueCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    // Add hover effects to serve cards
    const serveCards = document.querySelectorAll('.serve-card');

    serveCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}
