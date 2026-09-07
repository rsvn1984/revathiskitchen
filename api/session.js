export default async function handler(req, res) {

    try {

        // Only allow GET requests
        if (req.method !== "GET") {

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

        // Read cookies sent by the browser
        const cookieHeader =
            req.headers.cookie || "";

        // Find rk_session cookie
        const sessionCookie =
            cookieHeader
                .split(";")
                .map(cookie => cookie.trim())
                .find(cookie =>
                    cookie.startsWith("rk_session=")
                );

        // No session cookie
        if (!sessionCookie) {

            return res.status(401).json({
                authenticated: false,
                error: "Not authenticated"
            });

        }

        // Extract session ID
        const sessionId =
            sessionCookie.substring(
                "rk_session=".length
            );

        // Basic validation
        if (!/^[a-f0-9]{64}$/.test(sessionId)) {

            return res.status(401).json({
                authenticated: false,
                error: "Invalid session"
            });

        }

        // Redis session key
        const sessionKey =
            `session:${sessionId}`;

        // Retrieve session
        const sessionResponse = await fetch(url, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify([
                "GET",
                sessionKey
            ])

        });

        if (!sessionResponse.ok) {

            throw new Error(
                "Unable to retrieve session"
            );

        }

        const sessionResult =
            await sessionResponse.json();

        // Session does not exist or has expired
        if (!sessionResult.result) {

            return res.status(401).json({
                authenticated: false,
                error: "Session expired"
            });

        }

        // Convert stored session JSON
        let session;

        try {

            session =
                JSON.parse(sessionResult.result);

        } catch (error) {

            throw new Error(
                "Invalid session data"
            );

        }

        // Return authenticated customer information
        return res.status(200).json({

            authenticated: true,

            customer: {

                customerId:
                    session.customerId,

                name:
                    session.name,

                mobile:
                    session.mobile

            }

        });

    } catch (error) {

        console.error(
            "Session verification error:",
            error
        );

        return res.status(500).json({

            authenticated: false,

            error:
                "Unable to verify session"

        });

    }

}