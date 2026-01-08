// scripts/sell.js - JavaScript for the sell page

document.addEventListener('DOMContentLoaded', function() {
    initSellPage();
});

function initSellPage() {
    initImageUpload();
    initFormValidation();
    initPriceCalculator();
    initConditionSelector();
}

function initImageUpload() {
    const photoPlaceholder = document.querySelector('.photo-placeholder');
    const choosePhotosBtn = document.querySelector('.choose-photos-btn');
    const uploadedImages = [];

    if (photoPlaceholder) {
        photoPlaceholder.addEventListener('click', function() {
            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = 'image/*';

            fileInput.addEventListener('change', function(e) {
                handleImageSelection(e.target.files);
            });

            fileInput.click();
        });
    }

    if (choosePhotosBtn) {
        choosePhotosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            photoPlaceholder.click();
        });
    }

    function handleImageSelection(files) {
        Array.from(files).forEach(file => {
            if (uploadedImages.length >= 5) {
                alert('Maximum 5 photos allowed');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size too large. Maximum 5MB per image.');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select only image files.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    file: file,
                    url: e.target.result,
                    name: file.name
                };

                uploadedImages.push(imageData);
                displayUploadedImage(imageData);

                // Update placeholder text
                if (uploadedImages.length >= 1) {
                    photoPlaceholder.innerHTML = `
                        <i class="fa-solid fa-check-circle"></i>
                        <p>${uploadedImages.length} photo(s) uploaded</p>
                        <small>Click to add more photos</small>
                    `;
                    photoPlaceholder.style.background = '#f0fdf4';
                    photoPlaceholder.style.border = '2px dashed #10b981';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function displayUploadedImage(imageData) {
        // Create image preview (you could customize this)
        console.log('Image uploaded:', imageData.name);
        // In a real implementation, you'd display thumbnails
    }
}

function initFormValidation() {
    const form = document.querySelector('.panel-form');

    if (!form) return;

    // Real-time validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });

        field.addEventListener('input', function() {
            clearFieldError(this);
        });
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            submitBookListing();
        }
    });

    // Auto-populate sub-genre based on genre
    const genreSelect = document.getElementById('genre');
    const subGenreSelect = document.getElementById('sub-genre');

    if (genreSelect && subGenreSelect) {
        genreSelect.addEventListener('change', function() {
            populateSubGenres(this.value, subGenreSelect);
        });
    }
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    switch(fieldName) {
        case 'title':
            if (!value) {
                isValid = false;
                errorMessage = 'Book title is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Book title must be at least 2 characters';
            }
            break;

        case 'author':
            if (!value) {
                isValid = false;
                errorMessage = 'Author name is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Author name must be at least 2 characters';
            }
            break;

        case 'genre':
        case 'sub-genre':
        case 'condition':
            if (!value) {
                isValid = false;
                errorMessage = `Please select a ${fieldName.replace('-', ' ')}`;
            }
            break;

        case 'price':
            const price = parseFloat(value);
            if (!value) {
                isValid = false;
                errorMessage = 'Price is required';
            } else if (isNaN(price) || price <= 0) {
                isValid = false;
                errorMessage = 'Please enter a valid price greater than 0';
            } else if (price > 50000) {
                isValid = false;
                errorMessage = 'Price seems too high. Please verify.';
            }
            break;

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
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

function validateForm() {
    const form = document.querySelector('.panel-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isFormValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });

    // Additional validations
    const price = document.getElementById('price');
    const condition = document.getElementById('condition');

    if (price && condition) {
        const priceValue = parseFloat(price.value);
        const conditionValue = condition.value;

        // Price validation based on condition
        if (conditionValue === 'new' && priceValue < 100) {
            showFieldError(price, 'New books should be priced higher');
            isFormValid = false;
        }

        if (conditionValue === 'fair' && priceValue > 1000) {
            showFieldError(price, 'Fair condition books should be priced lower');
            isFormValid = false;
        }
    }

    return isFormValid;
}

function populateSubGenres(genre, subGenreSelect) {
    // Clear existing options (except the first one)
    while (subGenreSelect.children.length > 1) {
        subGenreSelect.removeChild(subGenreSelect.lastChild);
    }

    const subGenres = {
        'romance': ['Contemporary Romance', 'Historical Romance'],
        'adventure': ['Fantasy Adventure', 'Travel Adventure'],
        'business': ['Entrepreneurship', 'Leadership'],
        'education': ['Textbooks', 'Study Guides'],
        'financial-literacy': ['Investing', 'Budgeting'],
        'memoir': ['Autobiography', 'Biography'],
        'self-help': ['Personal Development', 'Productivity'],
        'spiritual': ['Mindfulness', 'Faith'],
        'women': ['Feminism', "Women's Health"]
    };

    if (subGenres[genre]) {
        subGenres[genre].forEach(subGenre => {
            const option = document.createElement('option');
            option.value = subGenre.toLowerCase().replace(' ', '-');
            option.textContent = subGenre;
            subGenreSelect.appendChild(option);
        });
    }
}

function initPriceCalculator() {
    const conditionSelect = document.getElementById('condition');
    const priceInput = document.getElementById('price');

    if (conditionSelect && priceInput) {
        // Show price suggestions when condition changes
        conditionSelect.addEventListener('change', function() {
            showPriceSuggestion(this.value);
        });
    }
}

function showPriceSuggestion(condition) {
    const suggestions = {
        'new': '70-100% of original price',
        'like-new': '60-80% of original price',
        'very-good': '50-70% of original price',
        'good': '30-50% of original price',
        'fair': '20-30% of original price'
    };

    const priceInput = document.getElementById('price');
    if (priceInput && suggestions[condition]) {
        // You could show a tooltip or helper text here
        console.log(`Price suggestion for ${condition}: ${suggestions[condition]}`);
    }
}

function initConditionSelector() {
    const conditionSelect = document.getElementById('condition');

    if (conditionSelect) {
        conditionSelect.addEventListener('change', function() {
            // Update price input placeholder based on condition
            const priceInput = document.getElementById('price');
            if (priceInput) {
                const placeholders = {
                    'new': '800',
                    'like-new': '600',
                    'very-good': '400',
                    'good': '250',
                    'fair': '150'
                };

                if (placeholders[this.value]) {
                    priceInput.placeholder = placeholders[this.value];
                }
            }
        });
    }
}

function submitBookListing() {
    // Collect form data
    const formData = new FormData(document.querySelector('.panel-form'));

    // Add uploaded images if any
    if (window.uploadedImages && window.uploadedImages.length > 0) {
        window.uploadedImages.forEach((imageData, index) => {
            formData.append(`photo_${index}`, imageData.file);
        });
    }

    // Show loading state
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Listing Book...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Reset form
        document.querySelector('.panel-form').reset();

        // Reset image upload area
        const photoPlaceholder = document.querySelector('.photo-placeholder');
        if (photoPlaceholder) {
            photoPlaceholder.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Upload photos of your book</p>
                <small style="color: #9ca3af; margin-top: 8px">Add up to 5 photos showing the cover, spine, and any damage</small>
            `;
            photoPlaceholder.style.background = '';
            photoPlaceholder.style.border = '';
        }

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Show success message
        alert('Book listing submitted successfully!');

        // In a real implementation, redirect to a success page or dashboard
        // window.location.href = '/sell/success';

    }, 2000);

    console.log('Submitting book listing:', Object.fromEntries(formData));
}
