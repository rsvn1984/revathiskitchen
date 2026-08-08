export default async function handler(req, res) {
    try {
        // Only allow GET requests
        if (req.method !== "GET") {
            return res.status(405).json({
                error: "Method not allowed"
            });
        }

        const url = process.env.KV_REST_API_URL;
        const token = process.env.KV_REST_API_TOKEN;

        if (!url || !token) {
            return res.status(500).json({
                error: "Visitor counter database is not configured"
            });
        }

        // Increase the visitor count by 1
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([
                "INCR",
                "visitors"
            ])
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Redis request failed");
        }

        return res.status(200).json({
            visitors: Number(data.result)
        });

    } catch (error) {

        console.error("Visitor counter error:", error);

        return res.status(500).json({
            error: "Unable to update visitor counter"
        });
    }
}