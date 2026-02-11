
const API = '/api/auth';

function showMessage(message, ok =true) { 
    const el = $('#message');
    el.removeClass("d-none alert-success alert-danger")
    el.addClass(ok ? "alert-success" : "alert-danger");
    el.text(message);
}

$(function () {
    const stored = localStorage.getItem('user');
    const onLogin = location.pathname.endsWith('login.html');
    const onSignup = location.pathname.endsWith('signup.html');

    if (stored && onLogin) {
        window.location.href = "chat.html";
    }

    $('#signupForm').on('submit', async function (e) { 
        e.preventDefault();
        const data=Object.fromEntries(new FormData(this).entries());

        const res = await fetch(`${API}/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
            return showMessage(json.message || "Something went wrong.", false);
        }

        showMessage("Account created! Please log in.", true);
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
    });

    $('#loginForm').on('submit', async function (e) {
        e.preventDefault();
        const data=Object.fromEntries(new FormData(this).entries());

        const res = await fetch(API + "/login", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
            return showMessage(json.message || "Login Failed", false);
        }

        localStorage.setItem('user', JSON.stringify(json.user));
        window.location.href = "chat.html";
    });
});