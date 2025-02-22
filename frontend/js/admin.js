document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    fetch("http://localhost:5000/protected/admin", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("admin-name").textContent = data.user.username;
        document.getElementById("admin-credits").textContent = data.user.credits;
    })
    .catch(err => console.error("Error fetching admin details:", err));

    // Fetch and display credit requests
    fetch("http://localhost:5000/credits/requests", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        const requestContainer = document.getElementById("credit-requests");
        requestContainer.innerHTML = "";
        data.requests.forEach(request => {
            const div = document.createElement("div");
            div.innerHTML = `
                <p>User: ${request.username}, Requested Credits: ${request.amount}</p>
                <button onclick="approveCredits(${request.id})">Approve</button>
                <button onclick="rejectCredits(${request.id})">Reject</button>
            `;
            requestContainer.appendChild(div);
        });
    });

    // Fetch dashboard analytics
    fetch("http://localhost:5000/api/admin/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("top-topics").textContent = JSON.stringify(data.topTopics);
        document.getElementById("top-users").textContent = JSON.stringify(data.topUsers);
        document.getElementById("top-credit-users").textContent = JSON.stringify(data.topCreditUsers);
    })
    .catch(err => console.error("Error fetching admin dashboard data:", err));
});

// Approve Credits
function approveCredits(requestId) {
    fetch(`http://localhost:5000/credits/approve/${requestId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => res.json())
    .then(() => location.reload())
    .catch(err => console.error("Error approving credits:", err));
}

// Reject Credits (Implementation needed in backend)
function rejectCredits(requestId) {
    fetch(`http://localhost:5000/credits/reject/${requestId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => res.json())
    .then(() => location.reload())
    .catch(err => console.error("Error rejecting credits:", err));
}
