document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const usernameElements = document.querySelectorAll('#username, #profileUsername');
    const userRoleElements = document.querySelectorAll('#userRole, #profileRole');
    const profileCredits = document.getElementById('profileCredits');
    const totalScans = document.getElementById('totalScans');
    const uploadForm = document.getElementById('uploadForm');
    const historyTableBody = document.getElementById('historyTableBody');
    const logoutBtn = document.getElementById('logoutBtn');
    const requestCreditsBtn = document.getElementById('requestCreditsBtn');
    const messagePopup = document.getElementById('messagePopup');
    const messageText = document.getElementById('messageText');
    const closePopup = document.querySelector('.close-popup');

    // Show message popup
    function showMessage(message, isError = false) {
        messageText.textContent = message;
        messageText.style.color = isError ? '#dc3545' : '#28a745';
        messagePopup.classList.add('show');
    }

    // Close message popup
    closePopup.addEventListener('click', () => {
        messagePopup.classList.remove('show');
    });

    // Fetch user profile and update UI
    async function fetchUserProfile() {
        try {
            const response = await fetch('http://localhost:5000/protected/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const { username, role, credits, id } = data.profile;

                // Update username and role in all locations
                usernameElements.forEach(el => el.textContent = username);
                userRoleElements.forEach(el => el.textContent = role);
                profileCredits.textContent = credits;

                // Fetch scan history to count total scans
                const scansResponse = await fetch(`http://localhost:5000/api/scans?user_id=${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (scansResponse.ok) {
                    const scansData = await scansResponse.json();
                    const scans = Array.isArray(scansData.scans) ? scansData.scans : [scansData.scans];
                    totalScans.textContent = scans.filter(scan => scan).length;
                    
                    // Update history table
                    historyTableBody.innerHTML = '';
                    scans.forEach(scan => {
                        if (scan) {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${new Date(scan.scan_date).toLocaleDateString()}</td>
                                <td>${scan.filename}</td>
                                <td>${scan.match_status}</td>
                                <td>${scan.topic}</td>
                            `;
                            historyTableBody.appendChild(row);
                        }
                    });
                }
            } else {
                throw new Error('Failed to fetch user profile');
            }
        } catch (error) {
            showMessage('Error loading profile data', true);
        }
    }

    // Handle document upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const file = document.getElementById('documentFile').files[0];
        formData.append('document', file);

        try {
            // Check for duplicate document
            const checkDuplicateResponse = await fetch('http://localhost:5000/api/documents/check-duplicate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const duplicateCheck = await checkDuplicateResponse.json();
            
            if (duplicateCheck.isDuplicate) {
                showMessage('This document has already been uploaded', true);
                return;
            }

            // Proceed with scan
            const scanResponse = await fetch('http://localhost:5000/api/scan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (scanResponse.ok) {
                const scanData = await scanResponse.json();
                showMessage('Document scanned successfully');
                profileCredits.textContent = scanData.remaining_credits;
                fetchUserProfile(); // Refresh all data
            } else {
                throw new Error('Scan failed');
            }
        } catch (error) {
            showMessage('Error scanning document', true);
        }
    });

    // Handle request credits
    requestCreditsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:5000/credits/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                showMessage(data.message);
                fetchUserProfile(); // Refresh profile data
            } else {
                throw new Error(data.message || 'Failed to request credits');
            }
        } catch (error) {
            showMessage('Error requesting credits', true);
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    });

    // Initialize
    fetchUserProfile();
});