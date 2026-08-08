document.addEventListener("DOMContentLoaded", async () => {
    const counter = document.querySelector(".visitor-counter");

    if (!counter) {
        return;
    }

    try {
        const response = await fetch("/api/visitors");

        if (!response.ok) {
            throw new Error("Visitor counter request failed");
        }

        const data = await response.json();

        const visitorCount = Number(data.visitors || 0);

        counter.textContent = String(visitorCount).padStart(6, "0");

    } catch (error) {
        console.error("Visitor counter error:", error);

        // Keep the display at 000000 if the service is temporarily unavailable
        counter.textContent = "000000";
    }
});
