// Checkout Page JavaScript

console.log('checkout.js loaded (JSON-based)');

const LOCATION_DATA_PATH = '../delivery%20form/ph-locations.json';

// Toast Notification Function
function showNotification(message, type = 'success', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const toastId = `toast-${Date.now()}-${Math.random()}`;
  const backgroundColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  const toastHTML = `
    <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header ${backgroundColor} text-white">
        <span class="me-auto fw-bold">${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  const toastElement = document.createElement('div');
  toastElement.innerHTML = toastHTML;
  container.appendChild(toastElement);

  const toast = new bootstrap.Toast(toastElement.querySelector('.toast'));
  toast.show();

  setTimeout(() => {
    toastElement.remove();
  }, duration);
}

// Shipping configuration
const SHIPPING_RATES = {
  'NCR': 65,
  'REGION I': 95,
  'REGION II': 110,
  'REGION III': 85,
  'REGION IV-A': 75,
  'REGION IV-B': 95,
  'REGION V': 105,
  'REGION VI': 95,
  'REGION VII': 95,
  'REGION VIII': 105,
  'REGION IX': 120,
  'REGION X': 110,
  'REGION XI': 110,
  'REGION XII': 120,
  'REGION XIII': 115,
  'CAR': 105,
  'BARMM': 130
};

const SHIPPING_NOTES = {
  'NCR': 'National Capital Region: ₱65 (1-2 days delivery)',
  'REGION I': 'Ilocos Region: ₱95 (2-3 days delivery)',
  'REGION II': 'Cagayan Valley: ₱110 (3-4 days delivery)',
  'REGION III': 'Central Luzon: ₱85 (2-3 days delivery)',
  'REGION IV-A': 'CALABARZON: ₱75 (1-2 days delivery)',
  'REGION IV-B': 'MIMAROPA: ₱95 (3-4 days delivery)',
  'REGION V': 'Bicol Region: ₱105 (3-4 days delivery)',
  'REGION VI': 'Western Visayas: ₱95 (3-4 days delivery)',
  'REGION VII': 'Central Visayas: ₱95 (3-4 days delivery)',
  'REGION VIII': 'Eastern Visayas: ₱105 (3-4 days delivery)',
  'REGION IX': 'Zamboanga Peninsula: ₱120 (4-5 days delivery)',
  'REGION X': 'Northern Mindanao: ₱110 (3-4 days delivery)',
  'REGION XI': 'Davao Region: ₱110 (3-4 days delivery)',
  'REGION XII': 'SOCCSKSARGEN: ₱120 (4-5 days delivery)',
  'REGION XIII': 'Caraga: ₱115 (4-5 days delivery)',
  'CAR': 'Cordillera Administrative Region: ₱105 (3-4 days delivery)',
  'BARMM': 'Bangsamoro Autonomous Region: ₱130 (5-6 days delivery)'
};

const VOUCHERS = {
  'NEWUSER10': {
    type: 'percentage',
    value: 10,
    minSpend: 500,
    description: '10% off for new users (min. spend ₱500)'
  },
  'FREESHIP': {
    type: 'freeshipping',
    value: 0,
    minSpend: 1000,
    description: 'Free shipping on orders ₱1000+'
  },
  'BOOK50': {
    type: 'fixed',
    value: 50,
    minSpend: 0,
    description: '₱50 off on all books'
  }
};

// State
let currentStep = 1;
let shippingData = {};
let appliedVoucher = null;
let cart = [];
let subtotal = 0;
let shippingFee = 0;
let discount = 0;
let total = 0;
let selectedPaymentMethod = null;
let isAllDigital = false;
let physicalItems = [];
let digitalItems = [];

const PAYMENT_INSTRUCTIONS = {
  gcash: {
    title: 'GCash Payment',
    steps: [
      'Tap the <strong>Pay QR</strong> option in your GCash app.',
      'Scan or upload the QR code that will be sent to your email after confirming.',
      'Enter the exact order total and complete the transaction.'
    ],
    note: 'Keep a copy of your GCash reference number. We will verify your payment within 24 hours.'
  },
  paymaya: {
    title: 'PayMaya Payment',
    steps: [
      'Open your Maya app and choose <strong>Pay Bills &gt; Others</strong>.',
      'Input the payment reference we will email after confirmation.',
      'Pay the exact amount shown in your order summary.'
    ],
    note: 'A confirmation email will be sent once we receive your Maya payment.'
  },
  cod: {
    title: 'Cash on Delivery',
    steps: [
      'Prepare the exact cash amount before the courier arrives.',
      'Courier will contact you via SMS or call on the delivery day.',
      'Provide a valid ID if requested by the delivery personnel.'
    ],
    note: 'COD is available for J&T Express deliveries nationwide.'
  }
};

let locationData = null;
const philippineLocations = {
  regions: [],
  regionMap: new Map(),
  provinceMap: new Map(),
  cityMap: new Map(),

  async init() {
    if (locationData) return;
    try {
      const response = await fetch(LOCATION_DATA_PATH);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      locationData = await response.json();
      this.processData(locationData);
      console.log('✅ Location data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load location data:', error);
      throw error;
    }
  },

  processData(raw) {
    this.regions = [];
    this.regionMap.clear();
    this.provinceMap.clear();
    this.cityMap.clear();

    Object.entries(raw).forEach(([code, regionObj]) => {
      const regionName = regionObj.region_name;
      const region = { code, name: regionName };
      this.regions.push(region);
      this.regionMap.set(code, {
        code,
        name: regionName,
        provinces: new Map()
      });

      Object.entries(regionObj.province_list || {}).forEach(([provinceName, provinceObj]) => {
        const provinceKey = `${code}::${provinceName}`;
        const provinceData = {
          code: provinceKey,
          name: provinceName,
          regionCode: code,
          cities: new Map()
        };

        this.regionMap.get(code).provinces.set(provinceKey, provinceData);
        this.provinceMap.set(provinceKey, provinceData);

        Object.entries(provinceObj.municipality_list || {}).forEach(([cityName, cityObj]) => {
          const cityKey = `${provinceKey}::${cityName}`;
          const cityData = {
            code: cityKey,
            name: cityName,
            provinceCode: provinceKey,
            barangays: cityObj.barangay_list || []
          };

          provinceData.cities.set(cityKey, cityData);
          this.cityMap.set(cityKey, cityData);
        });
      });
    });

    this.regions.sort((a, b) => a.name.localeCompare(b.name));
  },

  getProvincesByRegion(regionCode) {
    const region = this.regionMap.get(regionCode);
    if (!region) return [];
    return Array.from(region.provinces.values()).map(province => ({
      code: province.code,
      name: province.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  getCityMunByProvince(provinceCode) {
    const province = this.provinceMap.get(provinceCode);
    if (!province) return [];
    return Array.from(province.cities.values()).map(city => ({
      code: city.code,
      name: city.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  getBarangayByMun(cityCode) {
    const city = this.cityMap.get(cityCode);
    if (!city) return [];
    return city.barangays.map(name => ({ name })).sort((a, b) => a.name.localeCompare(b.name));
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await philippineLocations.init();
    initCheckout();
  } catch (error) {
    showNotification('Error loading location data. Please refresh the page.', 'error');
  }
});

async function initCheckout() {
  console.log('Initializing checkout with JSON data...');
  try {
    loadCart();
    classifyItems(); // Separate digital and physical items
    loadUserData();
    await populateRegions();
    displayOrderSummary();
    setupEventListeners();
    updateCartBadge();
    resetPaymentSelection();
    console.log('Checkout initialization complete');
  } catch (error) {
    console.error('Error initializing checkout:', error);
    showNotification('Error loading location data. Please refresh the page.', 'error');
  }
}

async function populateRegions() {
  const regionSelect = document.getElementById('region');
  if (!regionSelect) return;

  const regionsData = philippineLocations.regions;

  regionSelect.innerHTML = '<option value="">Select Region</option>';

  regionsData.forEach(region => {
    const option = document.createElement('option');
    option.value = region.code;
    option.textContent = region.name;
    option.setAttribute('data-region-name', region.name);
    option.setAttribute('data-region-code', region.code);
    regionSelect.appendChild(option);
  });

  console.log('✅ Regions populated successfully:', regionsData.length);
}

// Classify items into digital and physical
function classifyItems() {
  physicalItems = [];
  digitalItems = [];

  cart.forEach(item => {
    console.log(`🔍 Checking item: "${item.title}"`);
    console.log(`   - bookFile: ${item.bookFile ? '✓ Present' : '✗ Missing'}`);
    console.log(`   - isDigital: ${item.isDigital ? '✓ True' : '✗ False'}`);

    if (item.bookFile || item.isDigital) {
      digitalItems.push(item);
      console.log(`   ➜ Classified as: DIGITAL`);
    } else {
      physicalItems.push(item);
      console.log(`   ➜ Classified as: PHYSICAL`);
    }
  });

  isAllDigital = physicalItems.length === 0 && digitalItems.length > 0;

  console.log(`\n📊 Cart Classification Summary:`);
  console.log(`   - Digital items: ${digitalItems.length}`);
  console.log(`   - Physical items: ${physicalItems.length}`);
  console.log(`   - isAllDigital: ${isAllDigital ? '✓ TRUE' : '✗ FALSE'}\n`);

  // Hide shipping section if all items are digital
  const shippingSection = document.getElementById('step1');
  if (shippingSection) {
    shippingSection.style.display = isAllDigital ? 'none' : 'block';
  }

  // Hide region select requirement for digital-only purchases
  const regionSelect = document.getElementById('region');
  if (regionSelect) {
    regionSelect.required = !isAllDigital;
  }
}

function loadCart() {
  const savedCart = localStorage.getItem('rereadCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    if (cart.length === 0) cart = demoCart();
  } else {
    cart = demoCart();
  }
  calculateSubtotal();
}

function demoCart() {
  return [
    {
      title: 'Sample Book',
      author: 'Sample Author',
      price: '₱150',
      condition: 'Good',
      image: 'https://via.placeholder.com/150x200',
      quantity: 1
    }
  ];
}

function loadUserData() {
  const userData = localStorage.getItem('rereadUser');
  if (!userData) return;

  const user = JSON.parse(userData);
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');

  if (firstNameInput && user.firstName) firstNameInput.value = user.firstName;
  if (lastNameInput && user.lastName) lastNameInput.value = user.lastName;
  if (emailInput && user.email) emailInput.value = user.email;
}

function calculateSubtotal() {
  subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('₱', ''));
    return sum + price * item.quantity;
  }, 0);
}

function displayOrderSummary() {
  const summaryItems = document.getElementById('summaryItems');
  if (summaryItems) {
    summaryItems.innerHTML = cart.map(item => `
      <div class="summary-item">
        <img src="${item.image}" alt="${item.title}" class="summary-item-image" 
             onerror="this.src='https://via.placeholder.com/60x80/f3f4f6/6b7280?text=Book'">
        <div class="summary-item-details">
          <div class="summary-item-title">${item.title}</div>
          <div class="summary-item-meta">Qty: ${item.quantity}</div>
          <div class="summary-item-price">${item.price}</div>
        </div>
      </div>
    `).join('');
  }

  updateOrderTotals();
}

function updateOrderTotals() {
  total = subtotal + (isAllDigital ? 0 : shippingFee) - discount;

  const displays = [
    { id: 'itemCount', value: cart.reduce((sum, item) => sum + item.quantity, 0) },
    { id: 'itemCount2', value: cart.reduce((sum, item) => sum + item.quantity, 0) },
    { id: 'subtotal', value: `₱${subtotal.toFixed(2)}` },
    { id: 'subtotal2', value: `₱${subtotal.toFixed(2)}` },
    { id: 'shippingFee', value: isAllDigital ? 'Free (Digital)' : (shippingFee > 0 ? `₱${shippingFee.toFixed(2)}` : '₱0') },
    { id: 'shippingFee2', value: isAllDigital ? 'Free (Digital)' : (shippingFee > 0 ? `₱${shippingFee.toFixed(2)}` : '₱0') },
    { id: 'discountAmount', value: `-₱${discount.toFixed(2)}` },
    { id: 'discountAmount2', value: `-₱${discount.toFixed(2)}` },
    { id: 'totalAmount', value: `₱${total.toFixed(2)}` },
    { id: 'totalAmount2', value: `₱${total.toFixed(2)}` },
    { id: 'finalTotal', value: `₱${total.toFixed(2)}` }
  ];

  displays.forEach(display => {
    const element = document.getElementById(display.id);
    if (element) element.textContent = display.value;
  });

  ['discountRow', 'discountRow2'].forEach(id => {
    const row = document.getElementById(id);
    if (row) row.style.display = discount > 0 ? 'flex' : 'none';
  });
}

function setupEventListeners() {
  const shippingForm = document.getElementById('shippingForm');
  if (shippingForm) shippingForm.addEventListener('submit', handleShippingSubmit);

  const regionSelect = document.getElementById('region');
  if (regionSelect) regionSelect.addEventListener('change', handleRegionChange);

  const provinceSelect = document.getElementById('province');
  if (provinceSelect) provinceSelect.addEventListener('change', handleProvinceChange);

  const citySelect = document.getElementById('city');
  if (citySelect) citySelect.addEventListener('change', handleCityChange);

  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
  if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', confirmPayment);
}

async function handleRegionChange(e) {
  const regionCode = e.target.value;
  const regionName = e.target.options[e.target.selectedIndex]?.getAttribute('data-region-name') || '';

  const shippingNote = document.getElementById('shippingNote');
  const provinceSelect = document.getElementById('province');
  const citySelect = document.getElementById('city');
  const barangaySelect = document.getElementById('barangay');

  resetSelect(citySelect, 'Select Province First');
  resetSelect(barangaySelect, 'Select City First');
  citySelect.disabled = true;
  barangaySelect.disabled = true;

  if (regionCode) {
    provinceSelect.innerHTML = '<option value="">Loading provinces...</option>';
    provinceSelect.disabled = true;

    const shippingKey = getShippingKey(regionName);
    shippingFee = SHIPPING_RATES[shippingKey] || 95;

    if (shippingNote) {
      shippingNote.textContent = SHIPPING_NOTES[shippingKey] || `${regionName}: ₱${shippingFee} (3-4 days delivery)`;
      shippingNote.classList.add('show');
    }

    await populateProvinces(regionCode);

    if (appliedVoucher && appliedVoucher.type === 'freeshipping') {
      applyVoucherDiscount();
    }

    updateOrderTotals();
  } else {
    shippingFee = 0;
    resetSelect(provinceSelect, 'Select Region First');
    if (shippingNote) shippingNote.classList.remove('show');
    provinceSelect.disabled = true;
    updateOrderTotals();
  }
}

function getShippingKey(regionName) {
  const upperName = regionName.toUpperCase();
  if (upperName.includes('NCR') || upperName.includes('NATIONAL CAPITAL')) return 'NCR';
  if (upperName === 'REGION I' || upperName.includes('ILOCOS')) return 'REGION I';
  if (upperName === 'REGION II' || upperName.includes('CAGAYAN')) return 'REGION II';
  if (upperName === 'REGION III' || upperName.includes('CENTRAL LUZON')) return 'REGION III';
  if (upperName === 'REGION IV-A' || upperName.includes('CALABARZON')) return 'REGION IV-A';
  if (upperName === 'REGION IV-B' || upperName.includes('MIMAROPA')) return 'REGION IV-B';
  if (upperName === 'REGION V' || upperName.includes('BICOL')) return 'REGION V';
  if (upperName === 'REGION VI' || upperName.includes('WESTERN VISAYAS')) return 'REGION VI';
  if (upperName === 'REGION VII' || upperName.includes('CENTRAL VISAYAS')) return 'REGION VII';
  if (upperName === 'REGION VIII' || upperName.includes('EASTERN VISAYAS')) return 'REGION VIII';
  if (upperName === 'REGION IX' || upperName.includes('ZAMBOANGA')) return 'REGION IX';
  if (upperName === 'REGION X' || upperName.includes('NORTHERN MINDANAO')) return 'REGION X';
  if (upperName === 'REGION XI' || upperName.includes('DAVAO')) return 'REGION XI';
  if (upperName === 'REGION XII' || upperName.includes('SOCCSKSARGEN')) return 'REGION XII';
  if (upperName === 'REGION XIII' || upperName.includes('CARAGA')) return 'REGION XIII';
  if (upperName.includes('CAR') || upperName.includes('CORDILLERA')) return 'CAR';
  if (upperName.includes('BARMM') || upperName.includes('BANGSAMORO')) return 'BARMM';
  return 'NCR';
}

async function populateProvinces(regionCode) {
  const provinceSelect = document.getElementById('province');
  if (!provinceSelect) return;

  try {
    const provincesData = philippineLocations.getProvincesByRegion(regionCode);

    provinceSelect.innerHTML = '<option value="">Select Province</option>';

    if (provincesData.length === 0) {
      provinceSelect.innerHTML = '<option value="">No provinces available</option>';
      provinceSelect.disabled = true;
      return;
    }

    provincesData.forEach(province => {
      const option = document.createElement('option');
      option.value = province.code;
      option.textContent = province.name;
      provinceSelect.appendChild(option);
    });

    provinceSelect.disabled = false;
  } catch (error) {
    console.error('❌ Error populating provinces:', error);
    provinceSelect.innerHTML = '<option value="">Error loading provinces</option>';
    provinceSelect.disabled = false;
  }
}

async function handleProvinceChange(e) {
  const provinceCode = e.target.value;
  const citySelect = document.getElementById('city');
  const barangaySelect = document.getElementById('barangay');

  resetSelect(barangaySelect, 'Select City First');
  barangaySelect.disabled = true;

  if (provinceCode) {
    citySelect.innerHTML = '<option value="">Loading cities/municipalities...</option>';
    citySelect.disabled = true;
    await populateCities(provinceCode);
  } else {
    resetSelect(citySelect, 'Select Province First');
    citySelect.disabled = true;
  }
}

async function populateCities(provinceCode) {
  const citySelect = document.getElementById('city');
  if (!citySelect) return;

  try {
    const citiesData = philippineLocations.getCityMunByProvince(provinceCode);

    citySelect.innerHTML = '<option value="">Select City/Municipality</option>';

    if (citiesData.length === 0) {
      citySelect.innerHTML = '<option value="">No cities available</option>';
      citySelect.disabled = true;
      return;
    }

    citiesData.forEach(city => {
      const option = document.createElement('option');
      option.value = city.code;
      option.textContent = city.name;
      citySelect.appendChild(option);
    });

    citySelect.disabled = false;
  } catch (error) {
    console.error('❌ Error populating cities:', error);
    citySelect.innerHTML = '<option value="">Error loading cities</option>';
    citySelect.disabled = false;
  }
}

async function handleCityChange(e) {
  const cityCode = e.target.value;
  const barangaySelect = document.getElementById('barangay');

  if (cityCode) {
    barangaySelect.innerHTML = '<option value="">Loading barangays...</option>';
    barangaySelect.disabled = true;
    await populateBarangays(cityCode);
  } else {
    resetSelect(barangaySelect, 'Select City First');
    barangaySelect.disabled = true;
  }
}

async function populateBarangays(cityCode) {
  const barangaySelect = document.getElementById('barangay');
  if (!barangaySelect) return;

  try {
    const barangaysData = philippineLocations.getBarangayByMun(cityCode);

    barangaySelect.innerHTML = '<option value="">Select Barangay</option>';

    if (barangaysData.length === 0) {
      barangaySelect.innerHTML = '<option value="">No barangays available</option>';
      barangaySelect.disabled = true;
      return;
    }

    barangaysData.forEach(barangay => {
      const option = document.createElement('option');
      option.value = barangay.name;
      option.textContent = barangay.name;
      barangaySelect.appendChild(option);
    });

    barangaySelect.disabled = false;
  } catch (error) {
    console.error('❌ Error populating barangays:', error);
    barangaySelect.innerHTML = '<option value="">Error loading barangays</option>';
    barangaySelect.disabled = false;
  }
}

function resetSelect(selectElement, placeholder) {
  if (selectElement) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
  }
}

function handleShippingSubmit(e) {
  e.preventDefault();

  const regionSelect = document.getElementById('region');
  const provinceSelect = document.getElementById('province');
  const citySelect = document.getElementById('city');
  const barangaySelect = document.getElementById('barangay');

  shippingData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    region: regionSelect.options[regionSelect.selectedIndex]?.text || '',
    regionCode: regionSelect.value,
    province: provinceSelect.options[provinceSelect.selectedIndex]?.text || '',
    provinceCode: provinceSelect.value,
    city: citySelect.options[citySelect.selectedIndex]?.text || '',
    cityCode: citySelect.value,
    barangay: barangaySelect.options[barangaySelect.selectedIndex]?.text || '',
    zipCode: document.getElementById('zipCode').value,
    streetAddress: document.getElementById('streetAddress').value,
    landmark: document.getElementById('landmark').value,
    deliveryNotes: document.getElementById('deliveryNotes').value
  };

  if (shippingFee === 0) {
    showNotification('Please select a region to calculate shipping fee.', 'error');
    return;
  }

  localStorage.setItem('rereadShipping', JSON.stringify(shippingData));

  goToStep(2);
  displayShippingReview();
  displayReviewItems();
}

function goToStep(step) {
  // For digital-only orders, adjust step numbers
  let adjustedStep = step;
  if (isAllDigital && step === 2) {
    adjustedStep = 2; // Step 2 for digital is payment review
  } else if (isAllDigital && step === 3) {
    adjustedStep = 3; // Step 3 for digital is payment method
  }

  document.querySelectorAll('.checkout-step').forEach(el => el.classList.remove('active'));

  const targetStep = document.querySelector(`.step-${adjustedStep}`);
  if (targetStep) targetStep.classList.add('active');

  document.querySelectorAll('.progress-step').forEach((el, index) => {
    // Skip step 1 for digital-only
    let stepNum = index + 1;

    el.classList.remove('active', 'completed');
    if (isAllDigital && stepNum === 1) {
      el.style.display = 'none';
    } else {
      el.style.display = 'flex';
      if (stepNum < adjustedStep) el.classList.add('completed');
      else if (stepNum === adjustedStep) el.classList.add('active');
    }
  });

  currentStep = adjustedStep;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editStep(step) {
  goToStep(step);
}

function displayShippingReview() {
  const reviewDiv = document.getElementById('shippingReview');
  if (!reviewDiv || !shippingData) return;

  reviewDiv.innerHTML = `
    <p><strong>Name:</strong> ${shippingData.firstName} ${shippingData.lastName}</p>
    <p><strong>Email:</strong> ${shippingData.email}</p>
    <p><strong>Phone:</strong> ${shippingData.phone}</p>
    <p><strong>Address:</strong><br>
      ${shippingData.streetAddress}<br>
      Brgy. ${shippingData.barangay}, ${shippingData.city}, ${shippingData.province}<br>
      ${shippingData.region}, ${shippingData.zipCode}
    </p>
    ${shippingData.landmark ? `<p><strong>Landmark:</strong> ${shippingData.landmark}</p>` : ''}
    ${shippingData.deliveryNotes ? `<p><strong>Delivery Notes:</strong> ${shippingData.deliveryNotes}</p>` : ''}
  `;
}

function displayReviewItems() {
  const reviewItems = document.getElementById('reviewItems');
  if (!reviewItems) return;

  reviewItems.innerHTML = cart.map(item => {
    const price = parseFloat(item.price.replace('₱', ''));
    const itemTotal = price * item.quantity;

    return `
      <div class="review-item">
        <img src="${item.image}" alt="${item.title}" class="review-item-image"
             onerror="this.src='https://via.placeholder.com/80x100/f3f4f6/6b7280?text=Book'">
        <div class="review-item-info">
          <div class="review-item-title">${item.title}</div>
          <div class="review-item-author">${item.author}</div>
          <div class="review-item-condition">${item.condition}</div>
          <div class="review-item-price">₱${price.toFixed(2)} × ${item.quantity} = ₱${itemTotal.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function applyVoucher() {
  const voucherInput = document.getElementById('voucherCode');
  if (!voucherInput) return;

  const code = voucherInput.value.trim().toUpperCase();
  if (!code) {
    showVoucherMessage('Please enter a voucher code.', 'error');
    return;
  }

  const voucher = VOUCHERS[code];
  if (!voucher) {
    showVoucherMessage('Invalid voucher code.', 'error');
    return;
  }

  if (voucher.minSpend > 0 && subtotal < voucher.minSpend) {
    showVoucherMessage(`Minimum spend of ₱${voucher.minSpend} required.`, 'error');
    return;
  }

  appliedVoucher = { code, ...voucher };
  applyVoucherDiscount();

  showVoucherMessage(`Voucher "${code}" applied successfully!`, 'success');
  voucherInput.value = '';
}

function selectVoucher(code) {
  const voucherInput = document.getElementById('voucherCode');
  if (!voucherInput) return;
  voucherInput.value = code;
  applyVoucher();
}

function applyVoucherDiscount() {
  if (!appliedVoucher) return;

  switch (appliedVoucher.type) {
    case 'percentage':
      discount = subtotal * (appliedVoucher.value / 100);
      break;
    case 'fixed':
      discount = appliedVoucher.value;
      break;
    case 'freeshipping':
      discount = shippingFee;
      break;
  }

  updateOrderTotals();
}

function showVoucherMessage(message, type) {
  const voucherMessage = document.getElementById('voucherMessage');
  if (!voucherMessage) return;

  voucherMessage.textContent = message;
  voucherMessage.className = `voucher-message ${type}`;
}

function proceedToPayment() {
  if (!isAllDigital && !shippingData.firstName) {
    showNotification('Please complete shipping information first.', 'error');
    goToStep(1);
    return;
  }

  goToStep(3);
  resetPaymentSelection();
}

function selectPayment(method) {
  if (!isAllDigital && !shippingData.firstName) {
    showNotification('Please complete shipping information first.', 'error');
    goToStep(1);
    return;
  }

  selectedPaymentMethod = method;

  document.querySelectorAll('.payment-method-btn').forEach((btn) => {
    const isActive = btn.dataset.method === method;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.removeAttribute('aria-pressed');
    }
  });

  updatePaymentInstructions(method);

  const confirmBtn = document.getElementById('confirmPaymentBtn');
  if (confirmBtn) {
    confirmBtn.style.display = 'block';
    confirmBtn.disabled = false;
    confirmBtn.textContent = `Confirm ${formatPaymentMethod(method)} Payment`;
  }
}

function confirmPayment() {
  if (!isAllDigital && !shippingData.firstName) {
    showNotification('Please complete shipping information first.', 'error');
    goToStep(1);
    return;
  }

  if (!selectedPaymentMethod) {
    showNotification('Please select a payment method first.', 'error');
    return;
  }

  finalizeOrder(selectedPaymentMethod);
}

function finalizeOrder(method) {
  // Recalculate item classification before finalizing
  classifyItems();

  console.log(`🛒 Final cart check: ${digitalItems.length} digital, ${physicalItems.length} physical items`);
  console.log(`📦 isAllDigital flag: ${isAllDigital}`);
  console.log(`📋 Cart items:`, cart);
  console.log(`📥 Digital items:`, digitalItems);

  const orderData = {
    orderNumber: 'ORD-' + Date.now(),
    orderDate: new Date().toISOString(),
    customer: isAllDigital ? { email: 'digital-order' } : shippingData,
    items: cart,
    subtotal,
    shippingFee: isAllDigital ? 0 : shippingFee,
    discount,
    total: isAllDigital ? (subtotal - discount) : total,
    voucher: appliedVoucher,
    paymentMethod: method,
    status: 'pending',
    isDigitalOnly: isAllDigital,
    digitalItems: digitalItems
  };

  localStorage.setItem('rereadLastOrder', JSON.stringify(orderData));
  localStorage.removeItem('rereadCart');

  if (isAllDigital) {
    // For digital-only orders, show download page
    console.log(`✅ Redirecting to digital downloads page...`);
    localStorage.setItem('rereadDigitalDownloads', JSON.stringify(digitalItems));
    showNotification(`Order placed successfully!\n\nOrder Number: ${orderData.orderNumber}\n\nPreparing your downloads...`, 'success', 3000);

    setTimeout(() => {
      const redirectUrl = './digital-downloads.html?order=' + orderData.orderNumber;
      console.log(`🔗 Redirect URL: ${redirectUrl}`);
      window.location.href = redirectUrl;
    }, 1000);
  } else {
    // For mixed or physical-only orders
    console.log(`📮 Redirecting to home page...`);
    if (digitalItems.length > 0) {
      localStorage.setItem('rereadDigitalDownloads', JSON.stringify(digitalItems));
    }
    showNotification(`Order placed successfully!\n\nOrder Number: ${orderData.orderNumber}\nPayment Method: ${method.toUpperCase()}\n\nYou will receive a confirmation email shortly.`, 'success', 4000);

    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1000);
  }
}

function updatePaymentInstructions(method) {
  const instructionsContainer = document.getElementById('paymentInstructions');
  if (!instructionsContainer) return;

  const config = PAYMENT_INSTRUCTIONS[method];
  if (!config) {
    instructionsContainer.innerHTML = '';
    instructionsContainer.style.display = 'none';
    return;
  }

  const stepsList = config.steps
    .map(step => `<li>${step}</li>`)
    .join('');

  instructionsContainer.innerHTML = `
    <div class="payment-instructions-card">
      <h4>${config.title}</h4>
      <ol>${stepsList}</ol>
      <p class="payment-note">${config.note}</p>
    </div>
  `;
  instructionsContainer.style.display = 'block';
}

function resetPaymentSelection() {
  selectedPaymentMethod = null;
  document.querySelectorAll('.payment-method-btn').forEach((btn) => {
    btn.classList.remove('active');
    btn.removeAttribute('aria-pressed');
  });

  const confirmBtn = document.getElementById('confirmPaymentBtn');
  if (confirmBtn) {
    confirmBtn.style.display = 'none';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirm Payment';
  }

  const instructionsContainer = document.getElementById('paymentInstructions');
  if (instructionsContainer) {
    instructionsContainer.innerHTML = '<p class="text-muted">Select a payment method to view the instructions.</p>';
    instructionsContainer.style.display = 'none';
  }
}

function formatPaymentMethod(method) {
  switch (method) {
    case 'gcash':
      return 'GCash';
    case 'paymaya':
      return 'PayMaya';
    case 'cod':
      return 'Cash on Delivery';
    default:
      return method;
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = itemCount;
}

// Expose functions globally for HTML
window.editStep = editStep;
window.applyVoucher = applyVoucher;
window.selectVoucher = selectVoucher;
window.proceedToPayment = proceedToPayment;
window.selectPayment = selectPayment;
window.confirmPayment = confirmPayment;