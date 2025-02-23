const API_BASE_URL = 'http://localhost:5000';

const API = {
    admin: {
        getDetails: async (token) => {
            const response = await fetch(`${API_BASE_URL}/protected/admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.json();
        },
        getDashboard: async (token) => {
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.json();
        },
        getCreditRequests: async (token) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/credit-requests`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                // console.log("Credit Requests API Response:", data);  // Debugging log
                return data; // Ensure we're returning the entire response object
            } catch (error) {
                console.error("API Fetch Error:", error);
                return { success: false, message: "Failed to fetch credit requests" };
            }
        },
        approveCredits: async (userId, token) => {
            const response = await fetch(`${API_BASE_URL}/api/admin/approve/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.json();
        },
        rejectCredits: async (userId, token) => {
            const response = await fetch(`${API_BASE_URL}/api/admin/reject/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.json();
        },
        setCredits: async (userId, amount, token) => {
            const response = await fetch(`${API_BASE_URL}/api/admin/set-credits/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ credits: amount })
            });
            return response.json();
        },
        scanDocument: async (formData, token) => {
            const response = await fetch(`${API_BASE_URL}/api/scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            return response.json();
        },
        getScans: async (token, userId) => {
            const response = await fetch(`${API_BASE_URL}/api/scans`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
        
            const data = await response.json(); // Await JSON response
            // console.log("line->81 : ", data);
            return data; // Return parsed JSON data
        }        
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    initializeAdmin(token);
    loadCreditRequests(token);
    loadScanHistory(token);

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const section = btn.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });

    const uploadInput = document.getElementById('documentUpload');
    const scanButton = document.getElementById('scanButton');

    uploadInput.addEventListener('change', handleFileSelect);
    scanButton.addEventListener('click', () => handleScan(token));

    refreshDashboard(token);
});

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

async function initializeAdmin(token) {
    try {
        const { user } = await API.admin.getDetails(token);
        document.getElementById('adminName').textContent = user.username;
    } catch (error) {
        console.error('Error initializing admin:', error);
        showMessage('Error loading admin details', true);
    }
}

async function loadScanHistory(token) {
    try {
        const scansData = await API.admin.getScans(token);
        const historyTableBody = document.getElementById('scanHistoryTableBody');
        
        historyTableBody.innerHTML = '';
        // console.log("line 112 -> scans data : ", scansData);

        // Ensure scansData is an array
        if (!Array.isArray(scansData)) {
            console.error("Expected an array but received:", scansData);
            throw new Error("Invalid response format");
        }

        scansData.forEach(scan => {
            if (scan) {
                let cleanedText = scan.extracted_text
                    .replace(/[^\w\s.,;:'"()\-]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .replace(/\n+/g, ' ')
                    .trim();

                const maxLength = 500;
                let displayText = cleanedText.length > maxLength 
                    ? cleanedText.substring(0, maxLength) + "..." 
                    : cleanedText;

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
        console.error('Error loading scan history:', error);
        showMessage('Error loading scan history', true);
    }
}


async function refreshDashboard(token) {
    try {
        const data = await API.admin.getDashboard(token);
        updateDashboardStats(data);
        updateTopUsersTable(data.topUsers);
        updateCreditUsersTable(data.topCreditUsers);
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showMessage('Error loading dashboard data', true);
    }
}

function updateDashboardStats(data) {
    document.getElementById('totalCreditsUsed').textContent = data.totalCreditsUsed;
    // console.log(data.totalCreditsUsed);
    const topTopicsDiv = document.getElementById('topTopics');
    topTopicsDiv.innerHTML = data.topTopics
        .map(topic => `<div class="topic-item">
            <span>${topic.topic}</span>
            <span>${topic.count} scans</span>
        </div>`)
        .join('');
}

function updateTopUsersTable(users) {
    const tbody = document.querySelector('#topUsersTable tbody');
    tbody.innerHTML = users
        .map(user => `
        <tr>
            <td>${user.name} ${user.role === 'admin' ? '(admin)' : '(user)'}</td>
            <td>${user.scan_count}</td>
        </tr>
        `)
        .join('');
}

function updateCreditUsersTable(users) {
    const tbody = document.querySelector('#creditUsersTable tbody');
    tbody.innerHTML = users
        .map(user => `<tr>
            <td>${user.name}</td>
            <td>${user.total_credits}</td>
            <td>
                <button onclick="setCredits(${user.id})" class="btn-primary">Set Credits</button>
            </td>
        </tr>`)
        .join('');
}

async function setCredits(userId, token) {
    const amount = prompt('Enter new credit amount:');
    if (amount === null || amount === '') return;

    try {
        await API.admin.setCredits(userId, parseInt(amount), token);
        showMessage('Credits updated successfully');
        refreshDashboard(token);
    } catch (error) {
        console.error('Error setting credits:', error);
        showMessage('Failed to set credits', true);
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.querySelector('.upload-label').textContent = file.name;
    }
}

async function handleScan(token) {
    const fileInput = document.getElementById('documentUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select a file to scan', true);
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await API.admin.scanDocument(formData, token);
        const resultsDiv = document.getElementById('scanResults');
        resultsDiv.innerHTML = `
            <h3>Scan Results</h3>
            <p><strong>Message:</strong> ${result.message}</p>
            <p><strong>Topic:</strong> ${result.topic}</p>
            <p><strong>Match Status:</strong> ${result.match_status}</p>
            <p><strong>Similarity Score:</strong> ${result.similarity_score}</p>
            <pre>${result.extracted_text}</pre>
        `;
        resultsDiv.classList.add('active');
        
        // Refresh scan history after successful scan
        loadScanHistory(token);
        showMessage('Document scanned successfully');
    } catch (error) {
        console.error('Error scanning document:', error);
        showMessage('Failed to scan document', true);
    }
}

async function loadCreditRequests(token) {
    try {
        const response = await API.admin.getCreditRequests(token);
        // console.log("API Response ->", response);  

        // Ensure `response.data` is always an array
        const requestsData = Array.isArray(response.data) ? response.data : [response.data];

        if (!requestsData.length) {
            document.getElementById('creditRequestsList').innerHTML = '<p>No pending credit requests.</p>';
            return;
        }

        const requestsList = document.getElementById('creditRequestsList');
        const requestHistory = document.getElementById('creditHistoryList');
        requestsList.innerHTML = '';
        requestHistory.innerHTML = '';

        // Filter only 'pending' requests
        const pendingRequests = requestsData.filter(req => req.status === 'pending');
        const rejectedOrApprovedRequests = requestsData.filter(req => (req.status === 'rejected' || req.status==='approved'));
        // console.log("rejected or appreoved requests : ",rejectedOrApprovedRequests[0].user_id);
        // console.log("rejected or appreoved requests : ",rejectedOrApprovedRequests);

        if (pendingRequests.length === 0 && rejectedOrApprovedRequests.length === 0 ) {
            requestsList.innerHTML = '<p>No pending credit requests.</p>';
            requestHistory.innerHTML = '<p>No credit requests history is avaliable.</p>';
            return;
        }

        pendingRequests.forEach(request => {
            const requestItem = document.createElement('div');
            requestItem.classList.add('request-item'); // .request-item add this className to request Items
            requestItem.innerHTML = `
                <span>User : ${request.user_id}, requested ${request.credits_requested} credit</span>
                <button class="approve-btn" onclick="event.preventDefault(); approveCredit(${request.user_id}, '${token}')">Approve</button>
                <button class="reject-btn" onclick="event.preventDefault(); rejectCredit(${request.user_id}, '${token}')">Reject</button>
            `;
            requestsList.appendChild(requestItem);
        });

        rejectedOrApprovedRequests.forEach(request => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('request-item');
            historyItem.innerHTML = `
            <span> User : ${request.user_id}</span>
            <span> Credits_requested: ${request.credits_requested}</span>
            <span> Status: ${request.status}</span>
            `;
            requestHistory.appendChild(historyItem);
        });

    } catch (error) {
        console.error('Error loading credit requests:', error);
        document.getElementById('creditRequestsList').innerHTML = '<p>Error loading credit requests.</p>';
    }
}



async function approveCredit(userId) {
    const token = localStorage.getItem('token');
    try {
        await API.admin.approveCredits(userId, token);
        loadCreditRequests(token);
    } catch (error) {
        console.error('Error approving credit request:', error);
    }
}

async function rejectCredit(userId) {
    const token = localStorage.getItem('token');
    try {
        await API.admin.rejectCredits(userId, token);
        loadCreditRequests(token);
    } catch (error) {
        console.error('Error rejecting credit request:', error);
    }
}


const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
});