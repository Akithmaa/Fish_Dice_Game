//user click event
document.addEventListener('click', function(e) {
    if (e.target.closest('.password-toggle')) {
        const toggle = e.target.closest('.password-toggle');
        const passwordInputWrapper = toggle.closest('.password-input-wrapper');
        const passwordInput = passwordInputWrapper ? passwordInputWrapper.querySelector('input[type="password"], input[type="text"]') : null;
        const iconElement = toggle.querySelector('.password-toggle-icon i');
        
        if (passwordInput && iconElement) {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggle.classList.toggle('active', !isPassword);
            toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            
            if (isPassword) {
                iconElement.classList.remove('fa-eye');
                iconElement.classList.add('fa-eye-slash');
            } else {
                iconElement.classList.remove('fa-eye-slash');
                iconElement.classList.add('fa-eye');
            }
        }
    }
});

async function checkSession() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include"
        });
        
        if (res.status === 200) {
            const userData = await res.json();
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("isLoggedIn", "true");
            return true;
        } else {
            if (res.status === 401) {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("user");
            }
            return false;
        }
    } catch (err) {
        console.error("Session check error:", err);
        return false;
    }
}

function showNotification(message, type = "info") {
    if (typeof toast !== "undefined" && toast) {
        if (typeof toast[type] === "function") {
            toast[type](message);
            return;
        }
        if (typeof toast.show === "function") {
            toast.show(message, type);
            return;
        }
    }

    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.className = `notification notification-${type}`;
    box.textContent = message;

    box.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        background-color: ${
            type === "success" ? "#10b981" :
            type === "error" ? "#ef4444" :
            "#3b82f6"
        };
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(box);
    setTimeout(() => box.remove(), 5000);
}

//character seletion
function initializeCharacterSelection() {
    const options = document.querySelectorAll(".character-option");
    const selectedCharacterInput = document.getElementById("selectedCharacter");

    if (!options.length || !selectedCharacterInput) return;

    options.forEach(option => {
        option.addEventListener("click", () => {
            options.forEach(o => o.classList.remove("selected"));
            option.classList.add("selected");
            selectedCharacterInput.value = option.getAttribute("data-character");
        });
    });
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.querySelector("#loginForm .auth-btn");

    if (!email || !password) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;

    const rememberMe = document.getElementById("rememberMe").checked;

    fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe })
    })
    .then(async res => {
        const data = await res.json();
        
        if (res.status === 429) {
            const retryMinutes = data.retryAfterMinutes || data.retryAfter || 15;
            const message = `${data.msg || "Too many login attempts"}. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}.`;
            showNotification(message, "error");
            return;
        }
        
        if (data.msg === "Login successful") {
            showNotification("Login successful!", "success");
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("isLoggedIn", "true");
            
            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberMe");
            }
            
            if (typeof navigateTo === 'function') {
                navigateTo('home');
            } else {
                window.location.href = "index.html";
            }
        } else {
            showNotification(data.msg || "Login failed", "error");
        }
    })
    .catch(() => showNotification("Cannot reach backend", "error"))
    .finally(() => {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    });
}

function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;
    const signupBtn = document.querySelector("#signupForm .auth-btn");

    if (!username || !email || !password || !confirmPassword) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
    }

    if (password.length < 6) {
        showNotification("Password must be at least 6 characters", "error");
        return;
    }

    const selected = document.querySelector(".character-option.selected");
    let character = selected ? selected.getAttribute("data-character") : "Dolphin";

    signupBtn.textContent = "Creating Account...";
    signupBtn.disabled = true;

    const characterLower = character.toLowerCase();
    const profileData = {
        character,
        avatar: `assets/characters/${characterLower}.png`
    };

    const rememberMe = document.getElementById("signupRememberMe")?.checked || false;

    fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password, profile: profileData, rememberMe })
    })
    .then(res => res.json())
    .then(data => {
        if (data.msg === "Signup successful") {
            showNotification("Account created successfully!", "success");
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("isLoggedIn", "true");
            
            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberMe");
            }
            
            if (typeof navigateTo === 'function') {
                navigateTo('home');
            } else {
                window.location.href = "index.html";
            }
        } else {
            showNotification(data.msg || "Signup failed", "error");
        }
    })
    .catch(() => showNotification("Cannot reach backend", "error"))
    .finally(() => {
        signupBtn.disabled = false;
        signupBtn.textContent = "Sign Up";
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const rememberMeEnabled = localStorage.getItem("rememberMe") === "true";
    
    const sessionActive = await checkSession();
    
    let initialRoute = window.location.hash.slice(1);
    
    if (rememberMeEnabled && sessionActive) {
        if (!initialRoute || initialRoute === 'login' || initialRoute === 'signup') {
            initialRoute = 'home';
        }
    } else if (sessionActive) {
        if (!initialRoute || initialRoute === 'login' || initialRoute === 'signup') {
            initialRoute = 'home';
        }
    } else {
        if (rememberMeEnabled) {
            localStorage.removeItem("rememberMe");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("user");
        }
        
        const publicRoutes = ['login', 'signup', 'instructions'];
        if (!initialRoute || !publicRoutes.includes(initialRoute)) {
            initialRoute = 'login';
        }
    }
    
    if (typeof router !== 'undefined' && router.initializeRoute) {
        router.initializeRoute(initialRoute);
    } else if (typeof navigateTo === 'function') {
        navigateTo(initialRoute);
    } else {
        window.location.href = `index.html#${initialRoute}`;
    }

    if (loginForm && rememberMeEnabled && sessionActive) {
        const rememberMeCheckbox = document.getElementById("rememberMe");
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }

    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
        initializeCharacterSelection();
    }
});

const resetLink = document.getElementById("forgotLink");
const resetModal = document.getElementById("resetModal");
const resetClose = document.getElementById("resetClose");

let otpSession = null;
let tempEmail = "";
let tempNewPass = "";

if (resetLink) {
    resetLink.addEventListener("click", () => {
        resetModal.classList.remove("hidden");
        resetModal.classList.add("active");
        document.body.classList.add("modal-open");
    });
}

if (resetClose) {
    resetClose.addEventListener("click", () => {
        resetModal.classList.add("hidden");
        resetModal.classList.remove("active");
        document.body.classList.remove("modal-open");
    });
}

//This button click event triggers an API request to send an OTP email
document.getElementById("sendOtpBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value.trim();
    const newPass = document.getElementById("resetPassword").value;
    const confirmPass = document.getElementById("resetConfirm").value;

    if (!email || !newPass || !confirmPass) {
        return showNotification("Please fill in all fields", "error");
    }

    if (newPass !== confirmPass) {
        return showNotification("Passwords do not match", "error");
    }

    if (newPass.length < 6) {
        return showNotification("Password must be at least 6 characters", "error");
    }

    tempEmail = email;
    tempNewPass = newPass;

    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.status === 200) {
        otpSession = data.otpId;
        showNotification("OTP sent to your email!", "success");
        document.getElementById("step1").classList.add("hidden");
        document.getElementById("step2").classList.remove("hidden");
    } else {
        showNotification(data.msg || "Error sending OTP", "error");
    }
});

document.getElementById("verifyOtpBtn")?.addEventListener("click", async () => {
    const otp = document.getElementById("otpInput").value.trim();

    if (!otp) {
        return showNotification("Enter the OTP", "error");
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            otpId: otpSession,
            otp,
            newPassword: tempNewPass,
            email: tempEmail
        })
    });

    const data = await response.json();

    if (response.status === 200) {
        showNotification("Password changed successfully!", "success");
        resetModal.classList.add("hidden");
        resetModal.classList.remove("active");
        document.body.classList.remove("modal-open");
    } else {
        showNotification(data.msg || "Invalid OTP", "error");
    }
});
