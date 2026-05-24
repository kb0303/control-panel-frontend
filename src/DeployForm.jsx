// src/DeployForm.jsx
// Controlled form component for client onboarding.
// Calls submitDeploy() and passes the returned deploymentId up to the parent.

import React, { useState } from "react";
import { submitDeploy } from "./api.js";

// ─── Inline Styles ────────────────────────────────────────────────────────────
// Keeping styles co-located with the component for recruiter clarity.
// In a larger app you'd use CSS modules or a utility framework.
const s = {
    card: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "32px",
        marginBottom: "24px",
    },
    title: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        letterSpacing: "0.12em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    dot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "var(--accent)",
        display: "inline-block",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "16px",
    },
    fieldFull: { marginBottom: "16px" },
    label: {
        display: "block",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-muted)",
        marginBottom: "6px",
        letterSpacing: "0.05em",
    },
    input: {
        width: "100%",
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--radius)",
        padding: "10px 12px",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        outline: "none",
        transition: "border-color 0.15s",
    },
    button: {
        width: "100%",
        padding: "12px",
        background: "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius)",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "opacity 0.15s",
    },
    buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
    errorBox: {
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        color: "var(--red)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        marginTop: "12px",
    },
};

export default function DeployForm({ onDeployed }) {
    const [form, setForm] = useState({ clientName: "", domain: "", image: "nginx:latest" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Generic change handler – works for all inputs
    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await submitDeploy(form);
            // Pass the new deploymentId to the parent so it can show the status card
            onDeployed(result.deploymentId, form);
            // Reset form
            setForm({ clientName: "", domain: "", image: "nginx:latest" });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isValid = form.clientName && form.domain && form.image;

    return (
        <div style={s.card}>
            <div style={s.title}>
                <span style={s.dot} />
                New Client Deployment
            </div>

            {/* Two-column grid for clientName + domain */}
            <div style={s.grid}>
                <div>
                    <label style={s.label} htmlFor="clientName">CLIENT NAME</label>
                    <input
                        style={s.input}
                        id="clientName"
                        name="clientName"
                        placeholder="Acme Corp"
                        value={form.clientName}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label style={s.label} htmlFor="domain">DOMAIN</label>
                    <input
                        style={s.input}
                        id="domain"
                        name="domain"
                        placeholder="acme.ourplatform.com"
                        value={form.domain}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Full-width docker image input */}
            <div style={s.fieldFull}>
                <label style={s.label} htmlFor="image">DOCKER IMAGE</label>
                <input
                    style={s.input}
                    id="image"
                    name="image"
                    placeholder="nginx:latest"
                    value={form.image}
                    onChange={handleChange}
                />
            </div>

            <button
                style={{ ...s.button, ...(!isValid || loading ? s.buttonDisabled : {}) }}
                onClick={handleSubmit}
                disabled={!isValid || loading}
            >
                {loading ? "QUEUING..." : "DEPLOY"}
            </button>

            {error && <div style={s.errorBox}>⚠ {error}</div>}
        </div>
    );
}