async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        alert("Login Successful");

        if (data.role === "admin") {
            window.location.href = "admin_dashboard.html";
        } else {
            window.location.href = "user_dashboard.html";
        }
    } else {
        alert("Login Failed: " + (data.error || "Invalid credentials"));
    }
}
