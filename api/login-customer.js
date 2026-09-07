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

        // Read login data
        const {
            mobile,
            password
        } = req.body || {};

        // Normalize mobile number
        const mobileNumber =
            typeof mobile === "string"
                ? mobile.trim()
                : "";

        // Validate mobile number
        const indianMobilePattern =
            /^[6-9][0-9]{9}$/;

        if (!indianMobilePattern.test(mobileNumber)) {

            return res.status(400).json({
                error: "Invalid mobile number"
            });

        }

        // Validate password
        if (
            typeof password !== "string" ||
            password.length === 0
        ) {

            return res.status(400).json({
                error: "Password is required"
            });

        }

        // Redis customer key
        const customerKey =
            `customer:${mobileNumber}`;

        // Retrieve customer record
        const customerResponse = await fetch(url, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify([
                "GET",
                customerKey
            ])

        });

        if (!customerResponse.ok) {

            throw new Error(
                "Unable to retrieve customer record"
            );

        }

        const customerResult =
            await customerResponse.json();

        // Customer does not exist
        if (!customerResult.result) {

            return res.status(401).json({
                error:
                    "Invalid mobile number or password"
            });

        }

        // Convert stored JSON into customer object
        let customer;

        try {

            customer =
                JSON.parse(customerResult.result);

        } catch (error) {

            throw new Error(
                "Invalid customer record"
            );

        }

        // Make sure password data exists
        if (
            typeof customer.passwordHash !== "string" ||
            typeof customer.passwordSalt !== "string"
        ) {

            throw new Error(
                "Customer password data is invalid"
            );

        }

        // Generate hash from entered password
        const enteredPasswordHash =
            crypto
                .scryptSync(
                    password,
                    customer.passwordSalt,
                    64
                )
                .toString("hex");

        // Convert hashes to buffers
        const storedHashBuffer =
            Buffer.from(
                customer.passwordHash,
                "hex"
            );

        const enteredHashBuffer =
            Buffer.from(
                enteredPasswordHash,
                "hex"
            );

        // Compare hashes safely
        const passwordMatches =
            storedHashBuffer.length ===
                enteredHashBuffer.length &&
            crypto.timingSafeEqual(
                storedHashBuffer,
                enteredHashBuffer
            );

        // Incorrect password
        if (!passwordMatches) {

            return res.status(401).json({
                error:
                    "Invalid mobile number or password"
            });

        }

        // =========================================
        // CREATE AUTHENTICATION SESSION
        // =========================================

        const sessionId =
            crypto.randomBytes(32).toString("hex");

        const sessionKey =
            `session:${sessionId}`;

        // Session information
        const sessionData = {

            customerId: customer.customerId,

            mobile: customer.mobile,

            name: customer.name,

            createdAt:
                new Date().toISOString()

        };

        // Session lifetime: 24 hours
        const sessionResponse = await fetch(url, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify([
                "SET",
                sessionKey,
                JSON.stringify(sessionData),
                "EX",
                86400
            ])

        });

        if (!sessionResponse.ok) {

            throw new Error(
                "Unable to create login session"
            );

        }

        const sessionResult =
            await sessionResponse.json();

        if (sessionResult.result !== "OK") {

            throw new Error(
                "Unable to create login session"
            );

        }

        // =========================================
        // SEND SECURE SESSION COOKIE
        // =========================================

        const isProduction =
            process.env.VERCEL_ENV === "production";

        const cookieParts = [

            `rk_session=${sessionId}`,

            "HttpOnly",

            "Path=/",

            "SameSite=Lax",

            "Max-Age=86400"

        ];

        // Secure cookie on production HTTPS
        if (isProduction) {

            cookieParts.push("Secure");

        }

        res.setHeader(
            "Set-Cookie",
            cookieParts.join("; ")
        );

        // =========================================
        // LOGIN SUCCESS
        // =========================================

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            customer: {

                customerId:
                    customer.customerId,

                name:
                    customer.name,

                mobile:
                    customer.mobile

            }

        });

    } catch (error) {

        console.error(
            "Customer login error:",
            error
        );

        return res.status(500).json({

            error:
                "Unable to complete login"

        });

    }

}