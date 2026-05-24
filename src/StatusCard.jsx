// src/StatusCard.jsx
// Displays the live status of a single deployment.
// Receives a deploymentId and uses the useDeploymentStatus hook to poll for updates.
// The status badge colour changes automatically as the job progresses.

import React from "react";
import { useDeploymentStatus } from "./useDeploymentStatus.js";

// Map each status to a colour from our CSS variables
const STATUS_COLOR = {
    Pending: "var(--yellow)",
    Running: "var(--blue)",
    Completed: "var(--green)",
    Failed: "var(--red)",
};

const s = {
    card: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 32px",
        marginBottom: "16px",
        transition: "border-color 0.3s",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
    },
    clientName: {
        fontFamily: "var(--font-sans)",
        fontWeight: "600",
        fontSize: "15px",
        color: "var(--text)",
    },
    badge: (status) => ({
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.08em",
        padding: "3px 10px",
        borderRadius: "20px",
        color: STATUS_COLOR[status] || "var(--text-muted)",
        background: `${STATUS_COLOR[status] || "var(--text-muted)"}1a`,
        border: `1px solid ${STATUS_COLOR[status] || "var(--text-muted)"}44`,
        display: "flex",
        alignItems: "center",
        gap: "6px",
    }),
    pulseDot: (status) => ({
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: STATUS_COLOR[status] || "var(--text-muted)",
        // Animate the dot when still in progress
        animation: ["Running", "Pending"].includes(status) ? "pulse 1.5s infinite" : "none",
    }),
    meta: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginBottom: "14px",
    },
    metaItem: { display: "flex", flexDirection: "column", gap: "2px" },
    metaLabel: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    },
    metaValue: {
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-dim)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    message: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-muted)",
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        padding: "12px",
        borderLeft: "3px solid var(--border-2)",
        whiteSpace: "pre-line",        // respects \n line breaks
        lineHeight: "1.8",
    },
    logLine: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
    },
    logTimestamp: {
        color: "var(--text-muted)",
        opacity: 0.5,
        flexShrink: 0,
        fontSize: "10px",
        paddingTop: "1px",
    },
    loading: {
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-muted)",
        padding: "8px 0",
    },
};

// Pulse animation via a <style> tag (avoids a CSS-in-JS dependency)
const PulseStyle = () => (
    <style>{`
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.85); }
    }
  `}</style>
);

export default function StatusCard({ deploymentId, initialForm }) {
    const { deployment, error } = useDeploymentStatus(deploymentId);

    // While the first poll is in flight, show the data from the form
    const display = deployment || { ...initialForm, status: "Pending", message: "Queued..." };

    if (error) {
        return (
            <div style={{ ...s.card, borderColor: "rgba(239,68,68,0.3)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--red)" }}>
                    ⚠ Socket error: {error}
                </span>
            </div>
        );
    }

    return (
        <>
            <PulseStyle />
            <div
                style={{
                    ...s.card,
                    borderColor: display.status === "Completed"
                        ? "rgba(34,197,94,0.25)"
                        : display.status === "Failed"
                            ? "rgba(239,68,68,0.25)"
                            : "var(--border)",
                }}
            >
                {/* Header: client name + status badge */}
                <div style={s.header}>
                    <span style={s.clientName}>{display.clientName}</span>
                    <span style={s.badge(display.status)}>
                        <span style={s.pulseDot(display.status)} />
                        {display.status?.toUpperCase()}
                    </span>
                </div>

                {/* Domain + Image + ID metadata row */}
                <div style={s.meta}>
                    <div style={s.metaItem}>
                        <span style={s.metaLabel}>Domain</span>
                        <span style={s.metaValue}>{display.domain}</span>
                    </div>
                    <div style={s.metaItem}>
                        <span style={s.metaLabel}>Image</span>
                        <span style={s.metaValue}>{display.image}</span>
                    </div>
                    <div style={s.metaItem}>
                        <span style={s.metaLabel}>Job ID</span>
                        <span style={s.metaValue}>{deploymentId.slice(-8)}</span>
                    </div>
                </div>

                {/* Status message from the worker */}
                {display.message && (
                    <div style={s.message}>
                        {display.message.split("\n").map((line, i) => (
                            <div key={i} style={s.logLine}>
                                <span style={s.logTimestamp}>
                                    {new Date(display.updatedAt).toLocaleTimeString()}
                                </span>
                                <span>{line}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}