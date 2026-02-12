// Digital Downloads Page Script

document.addEventListener('DOMContentLoaded', () => {
  loadDownloads();
});

function loadDownloads() {
  try {
    // Get order data
    const orderData = JSON.parse(localStorage.getItem('rereadLastOrder') || '{}');
    const digitalItems = JSON.parse(localStorage.getItem('rereadDigitalDownloads') || '[]');

    // Get order number from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumberFromURL = urlParams.get('order');

    console.log('📥 Digital Downloads Page Loaded');
    console.log('📋 Order data from localStorage:', orderData);
    console.log('📦 Digital items from localStorage:', digitalItems);
    console.log('🔗 Order from URL:', orderNumberFromURL);

    if (!orderData.orderNumber && !orderNumberFromURL) {
      console.warn('❌ No order data found in localStorage or URL');
      document.getElementById('downloadsContainer').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>No Order Found</h3>
          <p>Please complete a purchase first or check your order status.</p>
        </div>
      `;
      return;
    }

    // Populate order info
    document.getElementById('orderNumber').textContent = orderData.orderNumber || orderNumberFromURL || 'N/A';
    document.getElementById('totalAmount').textContent = `₱${orderData.total?.toFixed(2) || '0.00'}`;
    document.getElementById('orderDate').textContent = orderData.orderDate
      ? new Date(orderData.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : 'N/A';
    document.getElementById('itemCount').textContent = digitalItems.length;

    // Populate downloads
    const container = document.getElementById('downloadsContainer');

    if (digitalItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-inbox"></i>
          </div>
          <h3>No Books Found</h3>
          <p>There are no digital books associated with this order.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = digitalItems.map((item, index) => {
      const fileType = getFileType(item);
      const fileIcon = getFileIcon(fileType);

      return `
        <div class="download-item">
          <div class="download-item-info">
            <div class="download-item-icon">
              ${fileIcon}
            </div>
            <div class="download-item-details">
              <h3>${item.title}</h3>
              <p>${item.author || 'Unknown Author'}</p>
              <div class="download-item-meta">
                <span><i class="fas fa-file"></i> ${fileType.toUpperCase()}</span>
                <span>${item.quantity || 1} × ${formatPrice(item.price)}</span>
              </div>
            </div>
          </div>
          <div class="download-btn-group">
            ${item.bookFile?.url ? `
              <button class="download-btn"
                 data-file-url="${item.bookFile.url}"
                 data-title="${item.title}"
                 data-file-type="${fileType}"
                 onclick="handleDownloadClick(event)"
                 title="Download ${item.title}">
                <i class="fas fa-download"></i>
                Download
              </button>
            ` : `
              <button class="download-btn" disabled title="File not available" style="opacity: 0.5;">
                <i class="fas fa-clock"></i>
                Processing
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading downloads:', error);
    document.getElementById('downloadsContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>Error Loading Downloads</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function getFileType(item) {
  if (item.bookFile?.fileType) return item.bookFile.fileType;
  if (item.fileType) return item.fileType;

  // Try to guess from URL
  if (item.bookFile?.url) {
    if (item.bookFile.url.includes('.pdf')) return 'pdf';
    if (item.bookFile.url.includes('.epub')) return 'epub';
    if (item.bookFile.url.includes('.mobi')) return 'mobi';
  }

  return 'pdf';
}

function getFileExtension(fileType) {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'pdf';
    case 'epub':
      return 'epub';
    case 'mobi':
      return 'mobi';
    default:
      return 'pdf';
  }
}

function getFileIcon(fileType) {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return '<i class="fas fa-file-pdf"></i>';
    case 'epub':
      return '<i class="fas fa-book"></i>';
    case 'mobi':
      return '<i class="fas fa-book-open"></i>';
    default:
      return '<i class="fas fa-file"></i>';
  }
}

function formatPrice(price) {
  if (typeof price === 'string') {
    return price;
  }
  return `₱${price?.toFixed(2) || '0.00'}`;
}

// Extract file key from S3 URL
function extractFileKeyFromUrl(url) {
  try {
    // Parse the URL to get the path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove leading slash
    const fileKey = pathname.startsWith('/') ? pathname.substring(1) : pathname;

    console.log(`📂 Extracted file key: ${fileKey}`);
    return fileKey;
  } catch (error) {
    console.error('Error extracting file key:', error);
    return null;
  }
}

// Handle download click - fetch signed URL from backend
async function handleDownloadClick(event) {
  event.preventDefault();

  const btn = event.target.closest('.download-btn');
  if (!btn) return;

  const fileUrl = btn.dataset.fileUrl;
  const title = btn.dataset.title;
  const fileType = btn.dataset.fileType;

  console.log(`📥 Starting download: ${title}`);

  try {
    // Disable button and show loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';

    // Extract file key from URL
    const fileKey = extractFileKeyFromUrl(fileUrl);

    if (!fileKey) {
      throw new Error('Could not extract file key from URL');
    }

    // Fetch signed URL from backend (public endpoint - no auth required)
    console.log(`🔐 Fetching signed URL for: ${fileKey}`);
    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:5000/api'; // Use global config or fallback
    const response = await fetch(`${apiBaseUrl}/upload/public-download/${encodeURIComponent(fileKey)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      if (response.status === 404) {
        throw new Error('File not found on server.');
      }
      throw new Error(`Failed to fetch download URL: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.data?.url) {
      throw new Error('Invalid response from server');
    }

    console.log(`✅ Got signed URL, starting download...`);

    // Perform download with signed URL
    performDirectDownload(data.data.url, title, fileType);

  } catch (error) {
    console.error('❌ Download error:', error);
    alert(`Download failed: ${error.message}`);
  } finally {
    // Re-enable button with original state
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-download"></i> Download';
  }
}

// Perform direct download using a link
function performDirectDownload(url, title, fileType) {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.${getFileExtension(fileType)}`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Download initiated for: ${title}`);
  } catch (error) {
    console.error('Error performing download:', error);
    // Open in new tab as fallback
    window.open(url, '_blank');
  }
}
