// Connects to the socket server, joins the room for this deploymentId,
// and listens for "deployment:update" events emitted by the worker.

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { fetchStatus } from "./api.js";

const TERMINAL_STATES = ["Completed", "Failed"];

// Single shared socket instance for the whole app
const socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
});

export function useDeploymentStatus(deploymentId) {
    const [deployment, setDeployment] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!deploymentId) return;

        // 1. Fetch current state immediately so the card isn't blank on load
        fetchStatus(deploymentId)
            .then(setDeployment)
            .catch((err) => setError(err.message));

        // 2. Join the room for this deployment
        socket.emit("watch", deploymentId);

        // 3. Listen for updates pushed by the worker
        const handleUpdate = (data) => {
            if (data._id.toString() !== deploymentId.toString()) return;
            setDeployment(data);
            // Leave the room once we hit a terminal state — no more updates coming
            if (TERMINAL_STATES.includes(data.status)) {
                socket.emit("leave", deploymentId);
            }
        };

        socket.on("deployment:update", handleUpdate);

        // Cleanup — remove listener when card unmounts
        return () => {
            socket.off("deployment:update", handleUpdate);
        };
    }, [deploymentId]);

    return { deployment, error };
}