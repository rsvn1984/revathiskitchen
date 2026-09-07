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
    `;
}


/* =========================================
   CHECK SESSION WHEN PAGE LOADS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    updateCustomerAccountLinks
);