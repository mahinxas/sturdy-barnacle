document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch account information from the server
        const response = await fetch("/accountInfo");

        if (!response.ok) {
            // Handle specific error statuses
            if (response.status === 401) {
                throw new Error("Unauthorized access. Please log in.");
            } else {
                throw new Error(`Error fetching account information: ${response.statusText}`);
            }
        }

        const accountData = await response.json();

        // Populate account information on the page
        document.getElementById("username").textContent = accountData.username || "N/A";
        document.getElementById("role").textContent = accountData.role || "N/A";
        document.getElementById("terms_accepted").textContent = accountData.terms_accepted ? "Yes" : "No";
        document.getElementById("created_at").textContent = accountData.created_at
            ? new Date(accountData.created_at).toLocaleString()
            : "N/A";
    } catch (error) {
        console.error("Error loading account information:", error);

        // Display a user-friendly message on the page
        const errorContainer = document.getElementById("account-info");
        errorContainer.innerHTML = `
            <p class="error-message">Failed to load account information. Please try again later.</p>
        `;

        // Optional: Alert the user
        // alert("Failed to load account information. Please try again later.");
    }
});
