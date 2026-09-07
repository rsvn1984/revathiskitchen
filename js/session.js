/* =========================================
   CUSTOMER SESSION MANAGER
========================================= */

async function checkCustomerSession() {

    try {

        const response = await fetch(
            "/api/session.js",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (
            response.ok &&
            result.authenticated &&
            result.customer
        ) {

            return result.customer;

        }

        return null;

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

        return null;

    }

}


/* =========================================
   GET CURRENT CUSTOMER
========================================= */

async function getCurrentCustomer() {

    return await checkCustomerSession();

}


/* =========================================
   CUSTOMER LOGOUT
========================================= */

async function logoutCustomer() {

    try {

        const response = await fetch(
            "/api/logout-customer.js",
            {
                method: "POST",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to logout"
            );

        }

        // Return to homepage after logout
        window.location.href = "/";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to logout. Please try again."
        );

    }

}


/* =========================================
   UPDATE CUSTOMER ACCOUNT LINKS
========================================= */

async function updateCustomerAccountLinks() {

    const accountLinks =
        document.getElementById("customerAccountLinks");

    if (!accountLinks) {
        return;
    }

    const customer =
        await getCurrentCustomer();

    if (!customer) {
        return;
    }

    accountLinks.innerHTML = `
        <span class="customer-link">
            Welcome, ${customer.name}
        </span>

        <span class="customer-divider">|</span>

        <span class="customer-link">
            ${customer.mobile}
        </span>

        <span class="customer-divider">|</span>

        <button
            type="button"
            class="customer-logout"
            id="customerLogoutButton"
        >
            Logout
        </button>
    `;

    const logoutButton =
        document.getElementById(
            "customerLogoutButton"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutCustomer
        );

    }

}


/* =========================================
   CHECK SESSION WHEN PAGE LOADS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    updateCustomerAccountLinks
);