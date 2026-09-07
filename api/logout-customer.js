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

        // If no session cookie exists,
        // simply clear the cookie and finish
        if (!sessionCookie) {

            res.setHeader(
                "Set-Cookie",
                "rk_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" +
                (process.env.VERCEL_ENV === "production"
                    ? "; Secure"
                    : "")
            );

            return res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });

        }

        // Extract session ID
        const sessionId =
            sessionCookie.substring(
                "rk_session=".length
            );

        // Basic validation
        if (!/^[a-f0-9]{64}$/.test(sessionId)) {

            res.setHeader(
                "Set-Cookie",
                "rk_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" +
                (process.env.VERCEL_ENV === "production"
                    ? "; Secure"
                    : "")
            );

            return res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });

        }

        // Redis session key
        const sessionKey =
            `session:${sessionId}`;

        // Delete the session from Redis
        const deleteResponse = await fetch(url, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify([
                "DEL",
                sessionKey
            ])

        });

        if (!deleteResponse.ok) {

            throw new Error(
                "Unable to delete customer session"
            );

        }

        // Clear the session cookie
        res.setHeader(
            "Set-Cookie",
            "rk_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" +
            (process.env.VERCEL_ENV === "production"
                ? "; Secure"
                : "")
        );

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {

        console.error(
            "Customer logout error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to complete logout"
        });

    }

}