// Profile page script - all logic is now in profile.html inline script
// This file is kept for backward compatibility

console.log("profile.js loaded");


async function loadProfile() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = 'signin.html';
            }
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        currentUser = data.data;
        displayProfile();
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile');
    }
}

function displayProfile() {
    if (!currentUser) return;

    // Header
    document.getElementById('displayName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('displayEmail').textContent = currentUser.email;

    const joinDate = new Date(currentUser.createdAt);
    document.getElementById('memberSince').textContent = `Member since ${joinDate.toLocaleDateString()}`;

    // Personal Info
    document.getElementById('viewFirstName').textContent = currentUser.firstName || '-';
    document.getElementById('viewLastName').textContent = currentUser.lastName || '-';
    document.getElementById('viewUsername').textContent = currentUser.username || '-';
    document.getElementById('viewEmail').textContent = currentUser.email || '-';

    // Edit form
    document.getElementById('editFirstName').value = currentUser.firstName || '';
    document.getElementById('editLastName').value = currentUser.lastName || '';
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editEmail').value = currentUser.email || '';

    // Seller info
    if (currentUser.isSeller) {
        document.getElementById('sellerBadge').style.display = 'block';
        document.getElementById('sellerTab').style.display = 'block';
        document.getElementById('sellerNotAvailable').style.display = 'none';
        document.getElementById('sellerInfo').style.display = 'block';

        if (currentUser.sellerInfo) {
            document.getElementById('viewStoreName').textContent = currentUser.sellerInfo.storeName || '-';
            document.getElementById('viewAccountHolder').textContent = currentUser.sellerInfo.accountHolder || '-';
            document.getElementById('viewBankName').textContent = currentUser.sellerInfo.bankName || '-';
            document.getElementById('viewBankAccount').textContent = currentUser.sellerInfo.bankAccount || '-';
        }
    }
}

function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editForm = document.getElementById('editForm');

    if (editForm.style.display === 'none') {
        viewMode.style.display = 'none';
        editForm.style.display = 'block';
    } else {
        viewMode.style.display = 'block';
        editForm.style.display = 'none';
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: document.getElementById('editFirstName').value,
                lastName: document.getElementById('editLastName').value,
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value
            })
        });

        if (!response.ok) throw new Error('Failed to update profile');

        const data = await response.json();
        currentUser = data.data;
        displayProfile();
        toggleEditMode();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
}

async function becomeSeller() {
    window.location.href = 'sell.html';
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        alert('Account deletion feature coming soon');
    }
}
