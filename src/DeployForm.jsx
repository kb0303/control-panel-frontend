import React, { useState } from "react";
import { submitDeploy } from "./api.js";

const QUICK_IMAGES = ["nginx:latest"];

export default function DeployForm({ onDeployed }) {
    const [form, setForm] = useState({ clientName: "", domain: "", image: "nginx:latest" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await submitDeploy(form);
            onDeployed(result.deploymentId, form);
            setForm({ clientName: "", domain: "", image: "nginx:latest" });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isValid = form.clientName && form.domain && form.image;

    return (
        <div className="deploy-form" style={s.card}>
            {/* Card header */}
            <div className="deploy-form-header" style={s.cardHeader}>
                <div style={s.cardHeaderLeft}>
                    <div style={s.headerDot} />
                    <span className="card-title" style={s.cardTitle}>New Client Deployment</span>
                </div>
                <span className="card-hint" style={s.cardHint}>All fields required</span>
            </div>

            <div className="deploy-form-body" style={s.cardBody}>
                {/* Row 1 — client name + domain */}
                <div className="deploy-form-row" style={s.row}>
                    <div className="field" style={s.field}>
                        <label className="field-label" style={s.label} htmlFor="clientName">
                            <span style={s.labelIcon}>◈</span> Client Name
                        </label>
                        <input
                            className="form-input"
                            style={s.input}
                            id="clientName"
                            name="clientName"
                            placeholder="Acme Corp"
                            value={form.clientName}
                            onChange={handleChange}
                            autoComplete="off"
                        />
                    </div>
                    <div className="field" style={s.field}>
                        <label className="field-label" style={s.label} htmlFor="domain">
                            <span style={s.labelIcon}>◎</span> Domain
                        </label>
                        <div style={s.inputWrap}>
                            <span className="input-prefix" style={s.inputPrefix}>https://</span>
                            <input
                                className="form-input input-with-prefix"
                                style={{ ...s.input, paddingLeft: "58px" }}
                                id="domain"
                                name="domain"
                                placeholder="acme.ourplatform.com"
                                value={form.domain}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2 — docker image */}
                <div className="field" style={s.field}>
                    <label className="field-label" style={s.label} htmlFor="image">
                        <span style={s.labelIcon}>⬡</span> Docker Image
                    </label>
                    <input
                        className="form-input"
                        style={s.input}
                        id="image"
                        name="image"
                        placeholder="nginx:latest"
                        value={form.image}
                        onChange={handleChange}
                        autoComplete="off"
                        readOnly
                    />
                    {/* Quick select pills */}
                    <div className="quick-pills" style={s.quickPills}>
                        {QUICK_IMAGES.map((img) => (
                            <button
                                key={img}
                                className="quick-pill"
                                style={{
                                    ...s.pill,
                                    ...(form.image === img ? s.pillActive : {}),
                                }}
                                onClick={() => setForm((p) => ({ ...p, image: img }))}
                            >
                                {img}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer — error + submit */}
                <div className="form-footer" style={s.footer}>
                    {error && (
                        <div className="error-box" style={s.errorBox}>
                            <span style={s.errorIcon}>⚠</span> {error}
                        </div>
                    )}
                    <button
                        className="deploy-submit-btn"
                        style={{
                            ...s.button,
                            ...(!isValid || loading ? s.buttonDisabled : {}),
                        }}
                        onClick={handleSubmit}
                        disabled={!isValid || loading}
                    >
                        {loading ? (
                            <>
                                <span style={s.btnSpinner} />
                                Queuing...
                            </>
                        ) : (
                            <>
                                <span style={s.btnIcon}>↗</span>
                                Deploy Client
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

const s = {
    card: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-2)",
    },
    cardHeaderLeft: { display: "flex", alignItems: "center", gap: "8px" },
    headerDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "var(--accent)",
        boxShadow: "0 0 8px var(--accent-glow)",
        animation: "pulse 2s infinite",
    },
    cardTitle: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        letterSpacing: "0.08em",
        color: "var(--text-dim)",
        textTransform: "uppercase",
    },
    cardHint: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--text-muted)",
    },
    cardBody: { padding: "20px" },

    row: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "16px",
    },
    field: { display: "flex", flexDirection: "column", gap: "6px" },
    label: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.08em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },
    labelIcon: { fontSize: "11px", color: "var(--accent)", opacity: 0.7 },

    inputWrap: { position: "relative" },
    inputPrefix: {
        position: "absolute",
        left: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-muted)",
        pointerEvents: "none",
        zIndex: 1,
    },
    input: {
        width: "100%",
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--radius)",
        padding: "9px 12px",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
    },

    quickPills: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
        marginTop: "4px",
    },
    pill: {
        padding: "3px 10px",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.15s",
    },
    pillActive: {
        background: "var(--accent-glow)",
        borderColor: "var(--accent)",
        color: "var(--accent)",
    },

    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "20px",
        gap: "12px",
    },
    errorBox: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "var(--red-glow)",
        border: "1px solid rgba(248,81,73,0.3)",
        borderRadius: "var(--radius)",
        padding: "8px 12px",
        color: "var(--red)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
    },
    errorIcon: { fontSize: "12px" },
    button: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "9px 20px",
        background: "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        letterSpacing: "0.04em",
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },
    buttonDisabled: { opacity: 0.4, cursor: "not-allowed" },
    btnIcon: { fontSize: "14px" },
    btnSpinner: {
        width: "12px",
        height: "12px",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        display: "inline-block",
    },
};