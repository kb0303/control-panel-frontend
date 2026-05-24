// StatusCard.jsx - Updated with responsive layout classes
import React, { useState } from "react";
import { useDeploymentStatus } from "./useDeploymentStatus.js";

const STATUS_COLOR = {
    Pending: { color: "var(--yellow)", glow: "var(--yellow-glow)", bg: "rgba(210,153,34,0.08)" },
    Running: { color: "var(--blue)", glow: "var(--blue-glow)", bg: "rgba(47,129,247,0.08)" },
    Completed: { color: "var(--green)", glow: "var(--green-glow)", bg: "rgba(63,185,80,0.08)" },
    Failed: { color: "var(--red)", glow: "var(--red-glow)", bg: "rgba(248,81,73,0.08)" },
};


const PIPELINE_STEPS = [
    {
        id: "queued",
        label: "Queued",
        icon: "◈",
        // Active when status is Pending OR when first log exists (Connecting message)
        match: (logs, status) => true, // always at least here
    },
    {
        id: "ssm",
        label: "SSM / EC2",
        icon: "⬡",
        // Worker sends "► Connecting to EC2 via AWS SSM..." as the very first message
        match: (logs) => logs.some(l =>
            l.message?.includes("Connecting to EC2") ||
            l.message?.includes("SSM command dispatched")
        ),
    },
    {
        id: "docker",
        label: "Docker",
        icon: "▣",
        // Worker sends "► Container '...' started on EC2."
        match: (logs) => logs.some(l =>
            l.message?.includes("started on EC2")
        ),
    },
    {
        id: "lambda",
        label: "Lambda",
        icon: "λ",
        // Worker sends "► Lambda post-deploy hook fired successfully."
        match: (logs) => logs.some(l =>
            l.message?.includes("Lambda post-deploy hook") ||
            l.message?.includes("Invoking Lambda")
        ),
    },
];

function getActiveStep(status, logs = []) {
    if (status === "Pending") return 0;
    if (status === "Completed") return PIPELINE_STEPS.length - 1;

    // For Running/Failed — find the FURTHEST step whose match is true
    let active = 0;
    PIPELINE_STEPS.forEach((step, i) => {
        if (step.match(logs, status)) active = i;
    });
    return active;
}

function getStepState(stepIndex, activeStep, status) {
    if (status === "Completed") return "done"; // all steps done
    if (status === "Failed") {
        if (stepIndex < activeStep) return "done";
        if (stepIndex === activeStep) return "failed";
        return "idle";
    }
    // Pending or Running
    if (stepIndex < activeStep) return "done";
    if (stepIndex === activeStep) return status === "Pending" ? "active" : "active";
    return "idle";
}

const PulseStyle = () => (
    <style>{`
    @keyframes pulse       { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.75)} }
    @keyframes spin        { to{transform:rotate(360deg)} }
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .status-card:hover     { border-color: var(--border-2) !important; }
    .log-box::-webkit-scrollbar       { width:4px }
    .log-box::-webkit-scrollbar-thumb { background:var(--border-2);border-radius:2px }
  `}</style>
);

export default function StatusCard({ deploymentId, initialForm, filter }) {
    const { deployment, error } = useDeploymentStatus(deploymentId);
    const [expanded, setExpanded] = useState(false);

    const display = deployment || { ...initialForm, status: "Pending", message: "Queued...", logs: [] };
    const logs = display.logs || [];
    const activeStep = getActiveStep(display.status, logs);
    const colors = STATUS_COLOR[display.status] || STATUS_COLOR.Pending;

    if (filter && filter !== "all") {
        if (display.status?.toLowerCase() !== filter.toLowerCase()) return null;
    }

    if (error) {
        return (
            <div style={{ ...s.card, borderColor: "rgba(248,81,73,0.3)", padding: "14px 20px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--red)" }}>
                    ⚠ Socket error: {error}
                </span>
            </div>
        );
    }

    return (
        <>
            <PulseStyle />
            <div
                className="status-card"
                style={{
                    ...s.card,
                    borderColor:
                        display.status === "Completed" ? "rgba(63,185,80,0.2)"
                            : display.status === "Failed" ? "rgba(248,81,73,0.2)"
                                : display.status === "Running" ? "rgba(47,129,247,0.2)"
                                    : "var(--border)",
                    animation: "fadeSlideIn 0.2s ease",
                }}
            >
                {/* ── Compact row ── */}
                <div className="card-row" style={s.row} onClick={() => setExpanded((v) => !v)}>
                    <div className="card-cell client-cell" style={{ ...s.cell, flex: 2 }}>
                        <div className="client-avatar" style={s.clientAvatar}>
                            {display.clientName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <div className="client-name" style={s.clientName}>{display.clientName}</div>
                            <div className="client-sub" style={s.clientSub}>
                                {new Date(display.createdAt || Date.now()).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="card-cell domain-cell" style={{ ...s.cell, flex: 2 }}>
                        <span className="mono-text" style={s.monoText}>{display.domain}</span>
                    </div>

                    <div className="card-cell image-cell" style={{ ...s.cell, flex: 1.5 }}>
                        <span className="image-pill" style={s.imagePill}>{display.image}</span>
                    </div>

                    <div className="card-cell status-cell" style={{ ...s.cell, flex: 1 }}>
                        <span className="status-badge" style={{
                            ...s.statusBadge,
                            color: colors.color,
                            background: colors.bg,
                            borderColor: `${colors.color}33`,
                        }}>
                            <span className="status-dot" style={{
                                ...s.statusDot,
                                background: colors.color,
                                boxShadow: `0 0 5px ${colors.color}`,
                                animation: ["Running", "Pending"].includes(display.status)
                                    ? "pulse 1.5s infinite" : "none",
                            }} />
                            {display.status}
                        </span>
                    </div>

                    <div className="card-cell jobid-cell" style={{ ...s.cell, flex: 1 }}>
                        <span className="job-id" style={s.jobId}>{deploymentId.slice(-8)}</span>
                        <span className="expand-icon" style={{
                            ...s.expandIcon,
                            transform: expanded ? "rotate(90deg)" : "rotate(-90deg)",
                        }}>‹</span>
                    </div>
                </div>

                {/* ── Expanded panel ── */}
                {expanded && (
                    <div className="detail-panel" style={s.detail}>

                        {/* Pipeline */}
                        <div className="pipeline-steps" style={s.pipeline}>
                            {PIPELINE_STEPS.map((step, i) => {
                                // When Completed every step is done
                                const state = display.status === "Completed"
                                    ? "done"
                                    : getStepState(i, activeStep, display.status);
                                const isLast = i === PIPELINE_STEPS.length - 1;
                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="step-wrap" style={s.stepWrap}>
                                            <div className="step-circle" style={{ ...s.stepCircle, ...s.stepCircleState(state) }}>
                                                {state === "done" ? "✓"
                                                    : state === "failed" ? "✖"
                                                        : state === "active"
                                                            ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
                                                            : step.icon}
                                            </div>
                                            <span className="step-label" style={{
                                                ...s.stepLabel,
                                                color: state === "done" ? "var(--green)"
                                                    : state === "active" ? "var(--blue)"
                                                        : state === "failed" ? "var(--red)"
                                                            : "var(--text-muted)",
                                            }}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {!isLast && (
                                            <div className="connector-line" style={{
                                                ...s.connector,
                                                background: state === "done" ? "var(--green)" : "var(--border-2)",
                                            }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {display.message && (
                            <div className="message-banner" style={s.messageBanner}>
                                <span className="message-dot" style={{
                                    ...s.messageDot,
                                    background: colors.color,
                                    boxShadow: `0 0 5px ${colors.color}`,
                                }} />
                                <span className="message-text" style={{ ...s.messageText, color: colors.color }}>
                                    {display.message}
                                </span>
                            </div>
                        )}

                        {/* Logs — one entry per worker updateDeployment call */}
                        <div className="log-box" style={s.logBox}>
                            {/* Header */}
                            <div style={s.logHeader}>
                                <span className="log-header-label" style={s.logHeaderLabel}>DEPLOYMENT LOGS</span>
                                <span className="log-header-count" style={s.logHeaderCount}>{logs.length} events</span>
                            </div>

                            {/* Log entries */}
                            {logs.length > 0 ? (
                                logs.map((entry, i) => {
                                    const isLatest = i === logs.length - 1;
                                    return (
                                        <div key={i} className="log-entry" style={{
                                            ...s.logEntry,
                                            borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                                            background: isLatest ? "rgba(47,129,247,0.03)" : "transparent",
                                        }}>
                                            {/* Left dot — colour shows recency */}
                                            <div className="log-dot" style={{
                                                ...s.logDot,
                                                background: isLatest
                                                    ? display.status === "Completed" ? "var(--green)"
                                                        : display.status === "Failed" ? "var(--red)"
                                                            : "var(--blue)"
                                                    : "var(--border-2)",
                                                boxShadow: isLatest
                                                    ? display.status === "Completed" ? "0 0 6px var(--green-glow)"
                                                        : display.status === "Failed" ? "0 0 6px var(--red-glow)"
                                                            : "0 0 6px var(--blue-glow)"
                                                    : "none",
                                            }} />

                                            <div style={s.logEntryBody}>
                                                {/* Timestamp */}
                                                <span className="log-timestamp" style={s.logTimestamp}>
                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                </span>
                                                {/* Message lines */}
                                                {entry.message.split("\n").map((line, j) => (
                                                    <div key={j} className="log-line" style={{
                                                        ...s.logLine,
                                                        color: line.startsWith("✖") ? "var(--red)"
                                                            : line.startsWith("►") ? "var(--text)"
                                                                : "var(--text-muted)",
                                                        fontWeight: line.startsWith("►") ? "500" : "400",
                                                    }}>
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={s.logEmpty}>Waiting for logs...</div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </>
    );
}

const s = {
    card: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        transition: "border-color 0.2s",
        cursor: "pointer",
    },
    row: {
        display: "flex",
        alignItems: "center",
        padding: "12px 20px",
        gap: "12px",
        minHeight: "52px",
    },
    cell: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: 0,
        overflow: "hidden",
    },
    clientAvatar: {
        width: "28px",
        height: "28px",
        borderRadius: "var(--radius)",
        background: "linear-gradient(135deg, var(--accent), var(--purple))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: "12px",
        fontWeight: "700",
        color: "#fff",
        flexShrink: 0,
    },
    clientName: {
        fontFamily: "var(--font-sans)",
        fontWeight: "600",
        fontSize: "13px",
        color: "var(--text)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    clientSub: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--text-muted)",
    },
    monoText: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-dim)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    imagePill: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--text-dim)",
        background: "var(--surface-3)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "2px 7px",
        whiteSpace: "nowrap",
    },
    statusBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: "600",
        letterSpacing: "0.04em",
        padding: "3px 8px",
        borderRadius: "20px",
        border: "1px solid",
        whiteSpace: "nowrap",
    },
    statusDot: {
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    jobId: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-muted)",
        flex: 1,
    },
    expandIcon: {
        fontFamily: "var(--font-mono)",
        fontSize: "16px",
        color: "var(--text-muted)",
        transition: "transform 0.2s",
        display: "inline-block",
        lineHeight: 1,
    },

    // Detail
    detail: {
        borderTop: "1px solid var(--border)",
        padding: "16px 20px",
        background: "var(--surface-2)",
        animation: "fadeSlideIn 0.15s ease",
    },

    // Pipeline
    pipeline: {
        display: "flex",
        alignItems: "center",
        marginBottom: "16px",
    },
    stepWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
        flexShrink: 0,
    },
    stepCircle: {
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        fontWeight: "600",
        transition: "all 0.3s",
    },
    stepCircleState: (state) => ({
        ...(state === "done" && { background: "var(--green)", color: "#fff", boxShadow: "0 0 10px var(--green-glow)" }),
        ...(state === "active" && { background: "var(--blue)", color: "#fff", boxShadow: "0 0 10px var(--blue-glow)" }),
        ...(state === "failed" && { background: "var(--red)", color: "#fff", boxShadow: "0 0 10px var(--red-glow)" }),
        ...(state === "idle" && { background: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border-2)" }),
    }),
    stepLabel: {
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        transition: "color 0.3s",
        whiteSpace: "nowrap",
    },
    connector: {
        flex: 1,
        height: "1px",
        transition: "background 0.3s",
        margin: "0 6px",
        marginBottom: "16px",
    },

    // Logs
    logBox: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        background: "var(--bg)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        maxHeight: "220px",
        overflowY: "auto",
    },
    logHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-3)",
        position: "sticky",
        top: 0,
    },
    logHeaderLabel: {
        fontSize: "9px",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
    },
    logHeaderCount: {
        fontSize: "9px",
        color: "var(--text-muted)",
        opacity: 0.6,
    },
    logEntry: {
        display: "flex",
        gap: "10px",
        padding: "8px 12px",
        alignItems: "flex-start",
        transition: "background 0.2s",
    },
    logDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: "5px",
        transition: "all 0.3s",
    },
    logEntryBody: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: 1,
        minWidth: 0,
    },
    logTimestamp: {
        fontSize: "10px",
        color: "var(--text-muted)",
        opacity: 0.5,
        marginBottom: "2px",
    },
    logLine: {
        lineHeight: "1.6",
        wordBreak: "break-word",
        fontSize: "11px",
    },
    logEmpty: {
        padding: "16px 12px",
        color: "var(--text-muted)",
        fontSize: "11px",
    },

    messageBanner: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "8px 12px",
        marginBottom: "12px",
        background: "var(--surface-3)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
    },
    messageDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: "4px",
    },
    messageText: {
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        lineHeight: "1.6",
        wordBreak: "break-word",
    },
};