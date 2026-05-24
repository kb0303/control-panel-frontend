const BASE = `${import.meta.env.VITE_API_URL}/api`;

/**
 * POST /api/deploy
 * Sends the form data to the backend. Returns { deploymentId }.
 */
export async function submitDeploy({ clientName, domain, image }) {
    const res = await fetch(`${BASE}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, domain, image }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Deploy request failed");
    }

    return res.json(); // { message, deploymentId }
}

/**
 * GET /api/status/:id
 * Returns the full deployment document from MongoDB.
 */
export async function fetchStatus(deploymentId) {
    const res = await fetch(`${BASE}/status/${deploymentId}`);

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Status fetch failed");
    }

    return res.json(); // { _id, clientName, domain, image, status, message, ... }
}


export async function fetchAllDeployments() {
    const res = await fetch(`${BASE}/deployments`);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch deployments");
    }
    return res.json();
}