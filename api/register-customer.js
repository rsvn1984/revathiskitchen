import crypto from "crypto";

export default async function handler(req, res) {

    try {

        // Only allow POST requests
        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Method not allowed"
            });
        }

        // Upstash Redis connection
        const url = process.env.KV_REST_API_URL;
        const token = process.env.KV_REST_API_TOKEN;

        if (!url || !token) {
            return res.status(500).json({
                error: "Customer database is not configured"
            });
        }

        // Read customer registration data
        const {
            mobile,
            password,
            name,
            email,
            address,
            latitude,
            longitude
        } = req.body || {};

        // Normalize text values
        const mobileNumber =
            typeof mobile === "string"
                ? mobile.trim()
                : "";

        const customerName =
            typeof name === "string"
                ? name.trim()
                : "";

        const emailAddress =
            typeof email === "string"
                ? email.trim()
                : "";

        const deliveryAddress =
            typeof address === "string"
                ? address.trim()
                : "";

        // Basic backend validation
        if (
            !mobileNumber ||
            !password ||
            !customerName ||
            !deliveryAddress ||
            latitude === undefined ||
            latitude === null ||
            latitude === "" ||
            longitude === undefined ||
            longitude === null ||
            longitude === ""
        ) {
            return res.status(400).json({
                error: "Required customer information is missing"
            });
        }

        // Mobile number validation
        const indianMobilePattern = /^[6-9][0-9]{9}$/;

        if (!indianMobilePattern.test(mobileNumber)) {
            return res.status(400).json({
                error: "Invalid mobile number"
            });
        }

        // Password validation
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                error:
                    "Password must contain at least 8 characters"
            });
        }

        // Customer name validation
        if (customerName.length < 2) {
            return res.status(400).json({
                error: "Please enter a valid customer name"
            });
        }

        // Validate email if provided
        if (emailAddress) {

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(emailAddress)) {
                return res.status(400).json({
                    error: "Invalid email address"
                });
            }
        }

        // Validate address
        if (deliveryAddress.length < 10) {
            return res.status(400).json({
                error:
                    "Please enter a complete delivery address"
            });
        }

        // Validate latitude and longitude
        const lat = Number(latitude);
        const lon = Number(longitude);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {
            return res.status(400).json({
                error: "Invalid delivery location"
            });
        }

        // Redis key based on mobile number
        const customerKey =
            `customer:${mobileNumber}`;

        // Check whether this mobile number is already registered
        const existingCustomerResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([
                "EXISTS",
                customerKey
            ])
        });

        if (!existingCustomerResponse.ok) {
            throw new Error(
                "Unable to check existing customer"
            );
        }

        const existingCustomerResult =
            await existingCustomerResponse.json();

        if (existingCustomerResult.result === 1) {
            return res.status(409).json({
                error:
                    "This mobile number is already registered"
            });
        }

        // Create a secure password hash
        const salt =
            crypto.randomBytes(16).toString("hex");

        const passwordHash =
            crypto
                .scryptSync(password, salt, 64)
                .toString("hex");

        // Generate the next Customer ID
        const sequenceResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([
                "INCR",
                "customer:sequence"
            ])
        });

        if (!sequenceResponse.ok) {
            throw new Error(
                "Unable to generate customer ID"
            );
        }

        const sequenceResult =
            await sequenceResponse.json();

        const customerNumber =
            sequenceResult.result;

        const customerId =
            `RK${String(customerNumber).padStart(6, "0")}`;

        // Customer record
        const customerRecord = {
            customerId: customerId,
            mobile: mobileNumber,
            passwordHash: passwordHash,
            passwordSalt: salt,
            name: customerName,
            email: emailAddress,
            address: deliveryAddress,
            latitude: lat,
            longitude: lon,
            createdAt: new Date().toISOString()
        };

        // Save customer record only if mobile is not already registered
        const saveResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([
                "SET",
                customerKey,
                JSON.stringify(customerRecord),
                "NX"
            ])
        });

        if (!saveResponse.ok) {
            throw new Error(
                "Unable to save customer record"
            );
        }

        const saveResult =
            await saveResponse.json();

        // Mobile number already exists
        if (saveResult.result !== "OK") {
            return res.status(409).json({
                error:
                    "This mobile number is already registered"
            });
        }

        // Registration successful
        return res.status(201).json({
            success: true,
            message:
                "Customer registered successfully",
            customerId: customerId
        });

    } catch (error) {

        console.error(
            "Customer registration error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to complete customer registration"
        });
    }
}