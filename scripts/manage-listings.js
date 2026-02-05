// Manage Listings Page - JavaScript

let allBooks = [];
let filteredBooks = [];
let selectedBookIds = [];
let currentEditingBookId = null;
let uploadedEditImage = null;

// Page initialization
document.addEventListener('DOMContentLoaded', async function () {
  console.log('Manage Listings page loaded');

  // Setup description character counter
  const descriptionInput = document.getElementById('editDescription');
  if (descriptionInput) {
    descriptionInput.addEventListener('input', updateCharacterCount);
  }

  // Load initial data
  await loadSellerBooks();

  // Setup filter event listeners
  setupFilterListeners();
});


// AUTHENTICATION & LOADING

async function loadSellerBooks() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const listingsContainer = document.getElementById('listingsContainer');
  const emptyState = document.getElementById('emptyState');

  // Show loading state
  loadingState.style.display = 'block';
  errorState.style.display = 'none';
  listingsContainer.style.display = 'none';
  emptyState.style.display = 'none';

  try {
    // Token from sessionStorage 
    const token = sessionStorage.getItem('accessToken');
    console.log('Token exists:', !!token);

    if (!token) {
      throw new Error('Not authenticated. Please sign in.');
    }

    console.log('Fetching books from API...');

    // Fetch seller's books
    const response = await fetch('http://localhost:5000/api/seller/books', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response Status:', response.status);

    if (response.status === 401) {
      console.log('Unauthorized - clearing tokens');
      try {
        const errorData = await response.json();
        console.error('Auth error response:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 2000);
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('Access denied. You may not have seller privileges.');
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error Response:', errorData);
      throw new Error(`API Error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log('API Response Data:', data);

    // Handle different response formats
    allBooks = data.data || data.books || [];
    console.log('Books loaded:', allBooks.length, 'Books array:', allBooks);

    // Display stats from response
    if (data.stats) {
      console.log('Stats:', data.stats);
      displayStatistics(data.stats, allBooks);
    }

    // Display listings
    loadingState.style.display = 'none';

    if (allBooks.length === 0) {
      console.log('No books found - showing empty state');
      emptyState.style.display = 'block';
    } else {
      console.log('Displaying listings...');
      filteredBooks = [...allBooks];
      displayListings(filteredBooks);
      listingsContainer.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading books:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    document.getElementById('errorMessage').textContent = error.message || 'Failed to load your listings. Please try again later.';

    // If it's an auth error, redirect
    if (error.message.includes('Not authenticated')) {
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 2000);
    }
  }
}


// STATISTICS DISPLAY

function displayStatistics(stats, books) {
  // Total Listings
  document.getElementById('totalListings').textContent = stats.totalListings || 0;

  // Total Revenue
  const totalRevenue = parseFloat(stats.totalPrice) || 0;
  document.getElementById('totalRevenue').textContent = `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Average Price
  const averagePrice = parseFloat(stats.averagePrice) || 0;
  document.getElementById('averagePrice').textContent = `₱${averagePrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Featured Books Count
  const featuredCount = books.filter(book => book.featured).length;
  document.getElementById('featuredCount').textContent = featuredCount;
}


// DISPLAY LISTINGS

function displayListings(books) {
  const tableBody = document.getElementById('listingsTableBody');
  if (!tableBody) return;

  if (books.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No listings match your filters</td></tr>';
    return;
  }

  tableBody.innerHTML = books.map(book => `
    <tr>
      <td style="text-align: center;">
        <input type="checkbox" class="form-check-input book-checkbox" value="${book._id}" onchange="updateBulkActionsBar()">
      </td>
      <td>
        <img src="${book.image || 'https://via.placeholder.com/50x65?text=No+Image'}" alt="${book.title}" class="book-thumbnail">
      </td>
      <td>
        <strong>${book.title || 'N/A'}</strong>
      </td>
      <td>${book.author || 'N/A'}</td>
      <td>₱${(book.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>
        <span class="status-badge status-${getConditionClass(book.quality)}">${book.quality || 'N/A'}</span>
      </td>
      <td>${formatDate(book.createdAt)}</td>
      <td>
        <span class="status-badge ${book.featured ? 'status-featured' : 'status-listed'}">
          ${book.featured ? 'Featured' : 'Listed'}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-edit" onclick="openEditModal('${book._id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-delete" onclick="openDeleteModal('${book._id}', '${encodeURIComponent(book.title)}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
    `).join('');
}


// FILTERS & SORTING

function setupFilterListeners() {
  document.getElementById('dateFilter')?.addEventListener('change', applyFilters);
  document.getElementById('priceFilter')?.addEventListener('change', applyFilters);
  document.getElementById('conditionFilter')?.addEventListener('change', applyFilters);
  document.getElementById('sortFilter')?.addEventListener('change', applyFilters);
}

function applyFilters() {
  const dateFilter = document.getElementById('dateFilter')?.value || 'all';
  const priceFilter = document.getElementById('priceFilter')?.value || 'all';
  const conditionFilter = document.getElementById('conditionFilter')?.value || 'all';
  const sortFilter = document.getElementById('sortFilter')?.value || 'newest';

  let filtered = [...allBooks];

  // Date filter
  if (dateFilter !== 'all') {
    const now = new Date();
    let days = 0;

    switch (dateFilter) {
      case '7days':
        days = 7;
        break;
      case '30days':
        days = 30;
        break;
      case '90days':
        days = 90;
        break;
    }

    if (days > 0) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(book => new Date(book.createdAt) >= cutoffDate);
    }
  }

  // Price filter
  if (priceFilter !== 'all') {
    if (priceFilter === '0-500') {
      filtered = filtered.filter(book => book.price < 500);
    } else if (priceFilter === '500-1000') {
      filtered = filtered.filter(book => book.price >= 500 && book.price < 1000);
    } else if (priceFilter === '1000+') {
      filtered = filtered.filter(book => book.price >= 1000);
    }
  }

  // Condition filter
  if (conditionFilter !== 'all') {
    filtered = filtered.filter(book => book.quality === conditionFilter);
  }

  // Sorting
  switch (sortFilter) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
  }

  filteredBooks = filtered;
  displayListings(filteredBooks);
  clearSelection();
}


// EDIT FUNCTIONALITY

async function openEditModal(bookId) {
  currentEditingBookId = bookId;
  uploadedEditImage = null;

  try {
    const token = sessionStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/seller/books/${bookId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load book details');
    }

    const data = await response.json();
    const book = data.data;

    // Populate form
    document.getElementById('editBookId').value = book._id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editPrice').value = book.price;
    document.getElementById('editCondition').value = book.quality;
    document.getElementById('editGenre').value = book.genre || '';
    document.getElementById('editDescription').value = book.description || '';
    document.getElementById('editFeatured').checked = book.featured || false;
    updateCharacterCount();

    // Set image preview
    if (book.image) {
      const imagePreview = document.getElementById('editImagePreview');
      imagePreview.innerHTML = `<img src="${book.image}" alt="Current book image">`;
      imagePreview.classList.add('has-image');
    } else {
      const imagePreview = document.getElementById('editImagePreview');
      imagePreview.innerHTML = '<i class="fas fa-image fa-3x text-muted"></i>';
      imagePreview.classList.remove('has-image');
    }

    // Clear file input
    document.getElementById('editImageInput').value = '';
    uploadedEditImage = null;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading book:', error);
    showError('Error', 'Failed to load book details');
  }
}

function handleEditImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    showError('File too large', 'Image must be less than 5MB');
    return;
  }

  if (!file.type.startsWith('image/')) {
    showError('Invalid file', 'Please select an image file');
    return;
  }

  // Read file as data URL
  const reader = new FileReader();
  reader.onload = function (e) {
    uploadedEditImage = e.target.result;
    const imagePreview = document.getElementById('editImagePreview');
    imagePreview.innerHTML = `<img src="${uploadedEditImage}" alt="Preview">`;
    imagePreview.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

async function saveBookChanges() {
  const bookId = document.getElementById('editBookId').value;
  const title = document.getElementById('editTitle').value.trim();
  const author = document.getElementById('editAuthor').value.trim();
  const price = parseFloat(document.getElementById('editPrice').value);
  const condition = document.getElementById('editCondition').value;
  const genre = document.getElementById('editGenre').value;
  const description = document.getElementById('editDescription').value.trim();
  const featured = document.getElementById('editFeatured').checked;

  // Validation
  if (!title || !author || !price || !condition) {
    showError('Validation Error', 'Please fill in all required fields');
    return;
  }

  if (price <= 0) {
    showError('Validation Error', 'Price must be greater than 0');
    return;
  }

  try {
    const token = sessionStorage.getItem('accessToken');

    const updateData = {
      title,
      author,
      price,
      quality: condition,
      genre,
      description,
      featured
    };

    // Include image if new one was uploaded
    if (uploadedEditImage) {
      updateData.image = uploadedEditImage;
    }

    const response = await fetch(`http://localhost:5000/api/seller/books/${bookId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to save changes');
    }

    const data = await response.json();

    // Update in memory
    const bookIndex = allBooks.findIndex(b => b._id === bookId);
    if (bookIndex !== -1) {
      allBooks[bookIndex] = data.data;
    }

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();

    // Reapply filters and display
    applyFilters();

    showSuccess('Success', 'Book listing updated successfully');
  } catch (error) {
    console.error('Error saving changes:', error);
    showError('Error', 'Failed to save changes');
  }
}

// DELETE FUNCTIONALITY

function openDeleteModal(bookId, bookTitle) {
  document.getElementById('deleteBookId').value = bookId;
  document.getElementById('deleteBookTitle').textContent = bookTitle;

  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function confirmDeleteBook() {
  const bookId = document.getElementById('deleteBookId').value;

  try {
    const token = sessionStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/seller/books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete book');
    }

    // Remove from memory
    allBooks = allBooks.filter(b => b._id !== bookId);
    filteredBooks = filteredBooks.filter(b => b._id !== bookId);

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();

    // Reload page
    await loadSellerBooks();

    showSuccess('Success', 'Book listing deleted successfully');
  } catch (error) {
    console.error('Error deleting book:', error);
    showError('Error', 'Failed to delete book');
  }
}

// BULK DELETE FUNCTIONALITY

function openBulkDeleteModal() {
  if (selectedBookIds.length === 0) {
    showWarning('No Selection', 'Please select at least one book to delete');
    return;
  }

  document.getElementById('bulkDeleteCount').textContent = `${selectedBookIds.length} book${selectedBookIds.length === 1 ? '' : 's'}`;

  const modal = new bootstrap.Modal(document.getElementById('bulkDeleteModal'));
  modal.show();
}

async function confirmBulkDelete() {
  if (selectedBookIds.length === 0) return;

  try {
    const token = sessionStorage.getItem('accessToken');

    // Delete each book
    for (const bookId of selectedBookIds) {
      const response = await fetch(`http://localhost:5000/api/seller/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete book ${bookId}`);
      }

      // Remove from memory
      allBooks = allBooks.filter(b => b._id !== bookId);
      filteredBooks = filteredBooks.filter(b => b._id !== bookId);
    }

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('bulkDeleteModal')).hide();

    // Clear selection and reload
    clearSelection();
    await loadSellerBooks();

    showSuccess('Success', `${selectedBookIds.length} book${selectedBookIds.length === 1 ? '' : 's'} deleted successfully`);
  } catch (error) {
    console.error('Error deleting books:', error);
    showError('Error', 'Failed to delete selected books');
  }
}

// SELECTION & BULK ACTIONS

function toggleSelectAll(checked) {
  document.querySelectorAll('.book-checkbox').forEach(checkbox => {
    checkbox.checked = checked;
  });
  updateBulkActionsBar();
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.book-checkbox');
  selectedBookIds = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const selectedCount = document.getElementById('selectedCount');
  const selectAllCheckbox = document.getElementById('selectAllCheckboxTable');

  if (selectedBookIds.length === 0) {
    bulkActionsBar.style.display = 'none';
    selectAllCheckbox.checked = false;
  } else {
    bulkActionsBar.style.display = 'block';
    selectedCount.textContent = `${selectedBookIds.length} item${selectedBookIds.length === 1 ? '' : 's'} selected`;

    // Update select all checkbox state
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
  }
}

function clearSelection() {
  document.querySelectorAll('.book-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  document.getElementById('selectAllCheckboxTable').checked = false;
  selectedBookIds = [];
  document.getElementById('bulkActionsBar').style.display = 'none';
}

function deselectAll() {
  clearSelection();
}

// UTILITY FUNCTIONS

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getConditionClass(condition) {
  switch (condition) {
    case 'New':
      return 'new';
    case 'Like New':
      return 'like-new';
    case 'Very Good':
      return 'very-good';
    case 'Good':
      return 'good';
    case 'Fair':
      return 'fair';
    default:
      return 'good';
  }
}

function updateCharacterCount() {
  const textarea = document.getElementById('editDescription');
  const counter = document.getElementById('descriptionCharCount');
  if (textarea && counter) {
    counter.textContent = `${textarea.value.length}/1000 characters`;
  }
}

// NOTIFICATION (existing functions from main.js lang din)

function showSuccess(title, message = "") {
  if (typeof window.showSuccess === 'function') {
    window.showSuccess(title, message);
  } else {
    console.log('Success:', title, message);
  }
}

function showError(title, message = "") {
  if (typeof window.showError === 'function') {
    window.showError(title, message);
  } else {
    console.error('Error:', title, message);
  }
}

function showWarning(title, message = "") {
  if (typeof window.showWarning === 'function') {
    window.showWarning(title, message);
  } else {
    console.warn('Warning:', title, message);
  }
}

// GO TO PAGES

function goToSellPage() {
  window.location.href = 'sell.html';
}

console.log('Manage Listings script loaded successfully');
