// Connects to the socket server, joins the room for this deploymentId,
// and listens for "deployment:update" events emitted by the worker.

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { fetchStatus } from "./api.js";
import { useRef } from "react";

const TERMINAL_STATES = ["Completed", "Failed"];

const socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
});

export function useDeploymentStatus(deploymentId) {
    const [deployment, setDeployment] = useState(null);
    const [error, setError] = useState(null);
    const socketUpdatedAt = useRef(null);

    useEffect(() => {
        if (!deploymentId) return;

        setDeployment(null);
        setError(null);
        socketUpdatedAt.current = null; // reset on new deployment

        fetchStatus(deploymentId)
            .then((data) => {
                // Only apply fetch result if socket hasn't already given us newer data
                if (!socketUpdatedAt.current) {
                    setDeployment(data);
                }
            })
            .catch((err) => setError(err.message));

        socket.emit("watch", deploymentId);

        const handleUpdate = (data) => {
            if (data._id.toString() !== deploymentId.toString()) return;
            setDeployment(data);
            if (TERMINAL_STATES.includes(data.status)) {
                socket.emit("leave", deploymentId);
            }
        };

        socket.on("deployment:update", handleUpdate);

        return () => {
            socket.off("deployment:update", handleUpdate);
        };
    }, [deploymentId]);

    return { deployment, error };
}