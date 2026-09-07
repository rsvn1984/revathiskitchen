/* =========================================
   CUSTOMER LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Clear previous message
    loginMessage.textContent = "";
    loginMessage.className = "login-message";

    // Get form values
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value;

    // Validate mobile number
    if (!/^[0-9]{10}$/.test(mobile)) {

        loginMessage.textContent =
            "Please enter a valid 10-digit mobile number.";

        return;
    }

    // Validate password
    if (password.length === 0) {

        loginMessage.textContent =
            "Please enter your password.";

        return;
    }

    // Disable button while processing
    const loginButton =
        loginForm.querySelector(".login-button");

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {

        const response = await fetch(
            "/api/login-customer.js",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mobile: mobile,
                    password: password
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {

            loginMessage.textContent =
         result.error ||
         "Login failed. Please try again.";

         return;
        }
        loginMessage.textContent =
        result.message ||
        "Login successful.";

        /*
         * Session handling will be added here
         * after the server authentication API
         * is completed.
         */

    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            "Unable to connect to the server. Please try again.";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }

});