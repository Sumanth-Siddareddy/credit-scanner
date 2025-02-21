async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();
    if (response.ok) {
        alert("Registration Successful! Please login.");
        window.location.href = "login.html";
    } else {
        alert("Registration Failed: " + (data.error || "Something went wrong"));
    }
}
