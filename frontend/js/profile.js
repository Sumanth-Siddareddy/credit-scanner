
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
    
        function showMessage(message, isError = false) {
            messageText.textContent = message;
            messageText.style.color = isError ? '#dc3545' : '#28a745';
            messagePopup.classList.add('show');
        }
    
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
        
                if (!response.ok) throw new Error('Failed to fetch user profile');
        
                const data = await response.json();
                const { username, role, credits, id } = data.profile;
        
                // Update UI elements
                usernameElements.forEach(el => el.textContent = username);
                userRoleElements.forEach(el => el.textContent = role);
                profileCredits.textContent = credits;
        
                // Fetch scans history
                const scansResponse = await fetch(`http://localhost:5000/api/scans?user_id=${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
        
                if (!scansResponse.ok) throw new Error('Failed to fetch scans');
        
                const scansData = await scansResponse.json();
                console.log("scans data :",scansData);
                // const scans = Array.isArray(scansData.scans) ? scansData.scans : [];
        
                // Count total scans
                // const totalScansCount = scans.length;
                totalScans.textContent = scansData.length;
        
                // Update history table
                historyTableBody.innerHTML = '';
                scansData.forEach(scan => {
                    if (scan) {
                        // Apply regex for cleaning
                        let cleanedText = scan.extracted_text
                            .replace(/[^\w\s.,;:'"()\-]/g, '')  // Remove unwanted special characters
                            .replace(/\s{2,}/g, ' ')           // Replace multiple spaces with a single space
                            .replace(/\n+/g, ' ')              // Replace newlines with spaces
                            .replace(/\bMathemati\b/g, 'Mathematics') // Fix OCR misread words
                            .replace(/\bPhysi\b/g, 'Physics')
                            .replace(/\bChemist\b/g, 'Chemistry')
                            .trim();
                
                        // Truncate long text for display
                        const maxLength = 500;
                        let displayText = cleanedText.length > maxLength 
                            ? cleanedText.substring(0, maxLength) + "..." 
                            : cleanedText;
                
                        // Create table row
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${new Date(scan.scan_date).toLocaleDateString()}</td>
                            <td>${scan.filename}</td>
                            <td>${scan.match_status}</td>
                            <td title="${cleanedText}">${displayText}</td>
                            <td>${scan.topic}</td>
                        `;
                
                        historyTableBody.appendChild(row);
                    }
                });
            } catch (error) {
                showMessage('Error loading profile data', true);
            }
        }
        
        // Handle document upload
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const fileInput = document.getElementById('documentFile');
            if (!fileInput.files.length) {
                showMessage('Please select a file to upload', true);
                return;
            }
    
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
    
            try {
                // Check for duplicate document
                const checkDuplicateResponse = await fetch('http://localhost:5000/api/documents/check-duplicate', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
    
                const duplicateCheck = await checkDuplicateResponse.json();
                if (duplicateCheck.isDuplicate) {
                    showMessage('This document has already been uploaded', true);
                    return;
                }
    
                // Proceed with scanning
                const scanResponse = await fetch('http://localhost:5000/api/scan', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
    
                if (!scanResponse.ok) throw new Error('Scan failed');
    
                const scanData = await scanResponse.json();
                showMessage('Document scanned successfully');
                profileCredits.textContent = scanData.remaining_credits;
                fetchUserProfile(); // Refresh all data
    
            } catch (error) {
                console.error(error);
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
                console.log("data line 167 :",data);
                if (!response.ok) throw new Error(data.error);
    
                showMessage(data.message);
                fetchUserProfile();
    
            } catch (error) {
                console.error(error);
                showMessage(`${error}`, true);
            }
        });
    
        // Handle logout
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        });
    
        fetchUserProfile();
    });
    