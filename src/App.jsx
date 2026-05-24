import React, { useState, useEffect } from "react";
import DeployForm from "./DeployForm.jsx";
import StatusCard from "./StatusCard.jsx";
import { fetchAllDeployments } from "./api.js";
import "./App.css";

// ─── Sidebar nav items — easy to extend with more pages ──────────────────────
const NAV_ITEMS = [
  { id: "deployments", icon: "⬡", label: "Deployments", active: true },
];

export default function App() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | running | completed | failed
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAllDeployments()
      .then((data) => {
        const shaped = data.map((d) => ({
          deploymentId: d._id,
          form: { clientName: d.clientName, domain: d.domain, image: d.image },
        }));
        setDeployments(shaped);
      })
      .catch((err) => console.error("Failed to load deployments:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDeployed = (deploymentId, form) => {
    setDeployments((prev) => {
      const alreadyExists = prev.some((d) => d.deploymentId === deploymentId);
      if (alreadyExists) return prev;
      return [{ deploymentId, form }, ...prev];
    });
    setShowForm(false); // close form after deploy
  };

  // Close sidebar on window resize if screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Stats for the header bar
  const total = deployments.length;

  const FILTER_TABS = [
    { id: "all", label: "All", count: total },
    { id: "running", label: "Running" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Failed" },
  ];

  return (
    <>
      {/* Hamburger button - mobile only */}
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1001,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 10px',
          cursor: 'pointer',
          fontSize: '18px',
          color: 'var(--text)'
        }}
      >
        ☰
      </button>

      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="app-shell" style={styles.shell}>
        {/* ── Sidebar ── */}
        <aside
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{
            ...styles.sidebar,
            position: window.innerWidth <= 1024 ? 'fixed' : 'sticky'
          }}
        >
          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoMark}>
              <span style={styles.logoIcon}>⬡</span>
            </div>
            <div>
              <div style={styles.logoName}>HostCtrl</div>
              <div style={styles.logoSub}>Control Panel</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={styles.nav}>
            <div style={styles.navSection}>PLATFORM</div>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.navItem,
                  ...(item.active ? styles.navItemActive : {}),
                  ...(item.soon ? styles.navItemDisabled : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
                {item.soon && <span style={styles.soonBadge}>SOON</span>}
                {item.active && <div style={styles.navActiveLine} />}
              </div>
            ))}
          </nav>

          {/* Bottom status */}
          <div style={styles.sidebarBottom}>
            <div style={styles.statusRow}>
              <div style={styles.statusDot("green")} />
              <span style={styles.statusText}>All systems operational</span>
            </div>
            <div style={styles.versionTag}>v1.0.0</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main-content" style={styles.main}>

          {/* Top bar */}
          <header className="topbar" style={styles.topbar}>
            <div className="topbar-left" style={styles.topbarLeft}>
              <h1 style={styles.pageTitle}>Deployments</h1>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbItem}>Platform</span>
                <span style={styles.breadcrumbSep}>›</span>
                <span style={styles.breadcrumbItem}>Deployments</span>
              </div>
            </div>
            <div className="topbar-right" style={styles.topbarRight}>
              {/* Stats pills */}
              <div className="stat-pills" style={styles.statPills}>
                <div style={styles.statPill}>
                  <span className="stat-num" style={styles.statNum}>{total}</span>
                  <span className="stat-label" style={styles.statLabel}>Total</span>
                </div>
              </div>
              {/* Deploy button */}
              <button
                className="deploy-btn"
                style={{ ...styles.deployBtn, ...(showForm ? styles.deployBtnActive : {}) }}
                onClick={() => setShowForm((v) => !v)}
              >
                <span style={styles.deployBtnPlus}>{showForm ? "−" : "+"}</span>
                New Deployment
              </button>
            </div>
          </header>

          {/* Content area */}
          <div className="content-area" style={styles.content}>

            {/* Deploy form — slides in when open */}
            {showForm && (
              <div className="deploy-form-card" style={styles.formWrap}>
                <DeployForm onDeployed={handleDeployed} />
              </div>
            )}

            {/* Filter tabs + deployment list */}
            <div style={styles.listSection}>
              {/* Filter tabs */}
              <div className="filter-bar" style={styles.filterBar}>
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className="filter-tab"
                    style={{
                      ...styles.filterTab,
                      ...(filter === tab.id ? styles.filterTabActive : {}),
                    }}
                    onClick={() => setFilter(tab.id)}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="filter-count" style={styles.filterCount}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Table header */}
              <div className="table-header" style={styles.tableHeader}>
                <span style={{ ...styles.th, flex: 2 }}>CLIENT</span>
                <span style={{ ...styles.th, flex: 2 }}>DOMAIN</span>
                <span style={{ ...styles.th, flex: 1.5 }}>IMAGE</span>
                <span style={{ ...styles.th, flex: 1 }}>STATUS</span>
                <span style={{ ...styles.th, flex: 1 }}>JOB ID</span>
              </div>

              {/* Deployments */}
              {loading ? (
                <div className="empty-state" style={styles.emptyState}>
                  <div style={styles.spinner} />
                  <span>Loading deployments...</span>
                </div>
              ) : deployments.length === 0 ? (
                <div className="empty-state" style={styles.emptyState}>
                  <div className="empty-icon" style={styles.emptyIcon}>⬡</div>
                  <div className="empty-title" style={styles.emptyTitle}>No deployments yet</div>
                  <div className="empty-desc" style={styles.emptyDesc}>Click "New Deployment" to onboard your first client.</div>
                </div>
              ) : (
                <div className="card-list" style={styles.cardList}>
                  {deployments.map(({ deploymentId, form }) => (
                    <StatusCard
                      key={deploymentId}
                      deploymentId={deploymentId}
                      initialForm={form}
                      filter={filter}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
  },

  // Sidebar
  sidebar: {
    width: "var(--sidebar-w)",
    minHeight: "100vh",
    background: "var(--surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    top: 0,
    height: "100vh",
    transition: "left 0.3s ease",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px 20px 16px",
    borderBottom: "1px solid var(--border)",
  },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "var(--radius)",
    background: "linear-gradient(135deg, var(--accent), var(--purple))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoIcon: { fontSize: "16px", color: "#fff" },
  logoName: {
    fontFamily: "var(--font-display)",
    fontWeight: "700",
    fontSize: "14px",
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  nav: {
    padding: "16px 12px",
    flex: 1,
  },
  navSection: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "0.12em",
    color: "var(--text-muted)",
    padding: "0 8px 8px",
    textTransform: "uppercase",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    position: "relative",
    marginBottom: "2px",
    transition: "background 0.15s",
    color: "var(--text-muted)",
    fontFamily: "var(--font-sans)",
    fontSize: "13px",
    fontWeight: "500",
  },
  navItemActive: {
    background: "var(--surface-2)",
    color: "var(--text)",
  },
  navItemDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  navActiveLine: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: "3px",
    height: "16px",
    background: "var(--accent)",
    borderRadius: "2px",
  },
  navIcon: { fontSize: "14px", width: "16px", textAlign: "center" },
  navLabel: { flex: 1 },
  soonBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "8px",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    background: "var(--surface-3)",
    padding: "2px 5px",
    borderRadius: "3px",
    border: "1px solid var(--border)",
  },
  sidebarBottom: {
    padding: "16px 20px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: { display: "flex", alignItems: "center", gap: "6px" },
  statusDot: (color) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: `var(--${color})`,
    boxShadow: `0 0 6px var(--${color}-glow)`,
    animation: "pulse 2s infinite",
  }),
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  versionTag: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    background: "var(--surface-2)",
    padding: "2px 6px",
    borderRadius: "3px",
    border: "1px solid var(--border)",
  },

  // Main area
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topbar: {
    height: "var(--header-h)",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    background: "var(--surface)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    gap: "16px",
  },
  topbarLeft: { display: "flex", flexDirection: "column", gap: "1px" },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "15px",
    fontWeight: "700",
    color: "var(--text)",
    letterSpacing: "-0.01em",
  },
  breadcrumb: { display: "flex", alignItems: "center", gap: "4px" },
  breadcrumbItem: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  breadcrumbSep: { fontSize: "10px", color: "var(--border-2)" },

  topbarRight: { display: "flex", alignItems: "center", gap: "12px" },
  statPills: { display: "flex", gap: "8px" },
  statPill: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "3px 10px",
  },
  statNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text)",
  },
  statLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  deployBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "all 0.15s",
    boxShadow: "0 0 0 0 var(--accent-glow)",
  },
  deployBtnActive: {
    background: "var(--surface-3)",
    color: "var(--text-muted)",
    boxShadow: "none",
  },
  deployBtnPlus: { fontSize: "16px", lineHeight: 1, fontWeight: "300" },

  // Content
  content: {
    padding: "24px 28px",
    flex: 1,
  },
  formWrap: {
    marginBottom: "24px",
    animation: "fadeSlideIn 0.2s ease",
  },

  // List
  listSection: {},
  filterBar: {
    display: "flex",
    gap: "4px",
    marginBottom: "12px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "0",
  },
  filterTab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-1px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "all 0.15s",
  },
  filterTabActive: {
    color: "var(--text)",
    borderBottomColor: "var(--accent)",
  },
  filterCount: {
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "0px 6px",
    fontSize: "10px",
    color: "var(--text-dim)",
  },

  // Table header
  tableHeader: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    marginBottom: "4px",
    gap: "12px",
  },
  th: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
  },

  // Cards
  cardList: { display: "flex", flexDirection: "column", gap: "4px" },

  // Empty / loading
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    gap: "12px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  emptyIcon: {
    fontSize: "40px",
    opacity: 0.2,
    marginBottom: "8px",
  },
  emptyTitle: {
    fontSize: "14px",
    color: "var(--text-dim)",
    fontWeight: "500",
  },
  emptyDesc: { fontSize: "12px", color: "var(--text-muted)", textAlign: "center" },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    marginBottom: "8px",
  },
};