import React, { useState, useEffect } from "react";
import DeployForm from "./DeployForm.jsx";
import StatusCard from "./StatusCard.jsx";
import { fetchAllDeployments } from "./api.js";

const s = {
  layout: {
    maxWidth: "780px",
    margin: "0 auto",
    padding: "48px 24px",
  },
  header: {
    marginBottom: "40px",
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    letterSpacing: "0.15em",
    color: "var(--accent)",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "26px",
    fontWeight: "600",
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "13px",
    marginTop: "6px",
  },
  sectionTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    letterSpacing: "0.12em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  divider: {
    height: "1px",
    flex: 1,
    background: "var(--border)",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    background: "var(--surface)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-lg)",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
};

export default function App() {
  // Each item: { deploymentId, form: { clientName, domain, image } }
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  // On page load — fetch all existing deployments from MongoDB
  useEffect(() => {
    fetchAllDeployments()
      .then((data) => {
        // Shape each MongoDB doc into { deploymentId, form } so StatusCard works the same way
        const shaped = data.map((d) => ({
          deploymentId: d._id,
          form: { clientName: d.clientName, domain: d.domain, image: d.image },
        }));
        setDeployments(shaped);
      })
      .catch((err) => console.error("Failed to load deployments:", err.message))
      .finally(() => setLoading(false));
  }, []);

  // Called by DeployForm when a new deployment is queued
  const handleDeployed = (deploymentId, form) => {
    setDeployments((prev) => [{ deploymentId, form }, ...prev]);
  };

  return (
    <div style={s.layout}>
      {/* Page Header */}
      <header style={s.header}>
        <p style={s.eyebrow}>Hosting Platform</p>
        <h1 style={s.title}>Control Panel</h1>
        <p style={s.subtitle}>
          Onboard a new client to spin up a Docker container on EC2 and trigger post-deploy automation via Lambda.
        </p>
      </header>

      {/* Onboarding Form */}
      <DeployForm onDeployed={handleDeployed} />

      {/* Live Status Dashboard */}
      <div style={s.sectionTitle}>
        <span>Live Deployments</span>
        <div style={s.divider} />
        <span style={{ color: "var(--text-dim)" }}>{deployments.length}</span>
      </div>

      {loading ? (
        <div style={s.loading}>Loading deployments...</div>
      ) : deployments.length === 0 ? (
        <div style={s.empty}>No deployments yet. Fill in the form above to get started.</div>
      ) : (
        deployments.map(({ deploymentId, form }) => (
          <StatusCard
            key={deploymentId}
            deploymentId={deploymentId}
            initialForm={form}
          />
        ))
      )}
    </div>
  );
}