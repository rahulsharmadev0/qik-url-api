const { useState, useEffect, useCallback, useRef } = React;

console.log("Loading Qik URL script..."); // Debug log to confirm script load

// API configuration - dynamic base URL
const getApiBase = () => {
  // In production (deployed), use the current origin
  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return window.location.origin;
  }

  console.log("Using local API base URL"); // Debug log for local development
  // In development, use localhost or fallback to production URL
  return window.location.port
    ? `${window.location.protocol}//${window.location.host}`
    : "https://qikurl.vercel.app";
};

const apiBase = getApiBase();

async function createShort(data, signal) {
  const res = await fetch(`${apiBase}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) {
    let msg = "Failed to shorten URL";
    try {
      const js = await res.json();
      msg = js.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function deleteShort(deletionCode, signal) {
  const res = await fetch(`${apiBase}/delete/${deletionCode}`, {
    method: "DELETE",
    signal,
  });
  if (!res.ok) {
    let msg = "Failed to delete URL";
    try {
      const js = await res.json();
      msg = js.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function getHealth(signal) {
  try {
    const res = await fetch(`${apiBase}/health`, { signal });
    if (!res.ok) return { status: "down" };
    const data = await res.json();
    return data;
  } catch (e) {
    return { status: "down" };
  }
}

function useInterval(callback, delay) {
  const saved = useRef();
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current && saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function HealthDetails({ health }) {
  if (!health || health.status === "checking") return null;

  return (
    <div className="health-section">
      <h3 className="section-title">System Health</h3>
      <div className="health-details">
        <div className="health-item">
          <label>Overall Status</label>
          <div className="health-status">
            <span
              className={`dot ${
                health.status === "ok"
                  ? "ok"
                  : health.status === "degraded"
                  ? "degraded"
                  : "down"
              }`}
            />
            <span>{health.status || "unknown"}</span>
          </div>
        </div>
        {health.services &&
          Object.entries(health.services).map(([service, status]) => (
            <div key={service} className="health-item">
              <label>{service}</label>
              <div className="health-status">
                <span
                  className={`dot ${status === "connected" ? "ok" : "down"}`}
                />
                <span>{status}</span>
              </div>
            </div>
          ))}
        {health.timestamp && (
          <div className="health-item">
            <label>Last Check</label>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteSection() {
  const [deletionCode, setDeletionCode] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const ctrlRef = useRef();

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deletionCode.trim()) return;

    setDeleting(true);
    setDeleteError("");
    setDeleteSuccess("");

    ctrlRef.current && ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    try {
      await deleteShort(deletionCode.trim(), ctrl.signal);
      setDeleteSuccess("URL deleted successfully");
      setDeletionCode("");
    } catch (err) {
      setDeleteError(err.message || "Failed to delete URL");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="action-section">
      <h3 className="section-title">Delete Short URL</h3>
      <form onSubmit={handleDelete}>
        <div className="delete-input-wrapper">
          <input
            type="text"
            placeholder="Enter deletion code..."
            value={deletionCode}
            onChange={(e) => {
              setDeletionCode(e.target.value);
              setDeleteError("");
              setDeleteSuccess("");
            }}
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
          <button
            type="submit"
            className="btn-danger"
            disabled={deleting || !deletionCode.trim()}
          >
            {deleting ? "Deleting..." : "Delete URL"}
          </button>
        </div>
      </form>

      {deleteError && (
        <div className="error-banner" role="alert">
          {deleteError}
        </div>
      )}
      {deleteSuccess && (
        <div className="success-message" role="alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
          {deleteSuccess}
        </div>
      )}
    </div>
  );
}

function CopyCode({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="kv">
      <label>{label}</label>
      <code className="copyable" onClick={copy}>
        {value}
        {copied && <span style={{ marginLeft: 8, color: "#6366f1" }}>✓</span>}
      </code>
    </div>
  );
}

function ResultCard({ data }) {
  if (!data) return null;
  const shortUrl = `${apiBase}/${data.qik_code}`;
  const expiry = new Date(data.expires_at).toLocaleString();
  return (
    <div className="result-card fade-in">
      <div className="badge">Short URL Created</div>
      <div className="short-url-display" style={{ marginTop: 14 }}>
        <a href={shortUrl} target="_blank" rel="noopener noreferrer">
          {shortUrl}
        </a>
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard.writeText(shortUrl)}
        >
          Copy
        </button>
      </div>
      <div className="result-grid">
        <CopyCode label="Deletion Code" value={data.deletion_code} />
        <CopyCode label="Qik Code" value={data.qik_code} />
        <CopyCode label="Clicks" value={String(data.click_count ?? 0)} />
        <CopyCode label="Expires" value={expiry} />
        <CopyCode label="Single Use" value={String(data.single_use)} />
        <CopyCode label="Original URL" value={data.long_url} />
      </div>
      <p className="inline-note" style={{ marginTop: 20 }}>
        Keep the deletion code secret. You can remove this short link anytime
        using DELETE {apiBase + "/delete/" + data.deletion_code}
      </p>
    </div>
  );
}

function ExpiryPopover({ open, value, onChange, onClose }) {
  if (!open) return null;
  return (
    <div className="datetime-popover fade-in">
      <h5>Set Expiry (≤1 year)</h5>
      <input
        style={{ marginTop: 4 }}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={new Date().toISOString().slice(0, 16)}
        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16)}
      />
      <div className="dt-actions">
        <button
          type="button"
          className="btn-small btn-clear"
          onClick={() => {
            onChange("");
            onClose();
          }}
        >
          Clear
        </button>
        <button type="button" className="btn-small" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

function App() {
  const [longUrl, setLongUrl] = useState("");
  const [singleUse, setSingleUse] = useState(false);
  const [expiresAtLocal, setExpiresAtLocal] = useState("");
  const [showExpiry, setShowExpiry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState({ status: "checking" });
  const [mode, setMode] = useState("create"); // 'create' or 'delete'
  const ctrlRef = useRef();

  // Load health data
  const loadHealth = useCallback(() => {
    getHealth().then(setHealth);
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);
  useInterval(loadHealth, 30000);

  const reset = () => {
    setResult(null);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    const payload = { long_url: longUrl.trim() };
    if (singleUse) payload.single_use = true;
    if (expiresAtLocal) {
      // Convert local to ISO
      const dt = new Date(expiresAtLocal);
      if (!isNaN(dt.getTime())) payload.expires_at = dt.toISOString();
    }

    ctrlRef.current && ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    try {
      const data = await createShort(payload, ctrl.signal);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to create short URL");
    } finally {
      setLoading(false);
    }
  };

  // Click outside handler for popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showExpiry &&
        !e.target.closest(".datetime-popover") &&
        !e.target.closest(".calendar-btn")
      ) {
        setShowExpiry(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExpiry]);

  return (
    <>
      <header>
        <h1>
          <span className="logo">Qik Url</span>
          <span className="version">
            beta
          </span>
        </h1>
         <HealthDetails health={health} />
      </header>

      <main>
        <h2 className="hero-title">Shorten. Share. Vanish.</h2>
        <p className="hero-sub">
          Fast, cache-first URL shortening with intelligent expiry, one-time
          links and secure deletion tokens. Built for modern serverless and edge
          workloads.
        </p>
    
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === "create" ? "active" : ""}
            onClick={() => setMode("create")}
          >
            Long URL
          </button>
          <button
            type="button"
            className={mode === "delete" ? "active" : ""}
            onClick={() => setMode("delete")}
          >
            Delete Short URL
          </button>
        </div>
        {mode === "create" ? (
          <div
            className="panel action-section"
            role="region"
            aria-label="Create short URL form"
          >
            <form className="qik-form" onSubmit={submit}>
              <div className="url-row">
                <label className="field-label" htmlFor="longUrl">
                  Long URL
                </label>
                <div className="input-flex">
                  <div className="url-input-wrapper">
                    <input
                      id="longUrl"
                      placeholder="https://example.com/some/very/long/link?with=params"
                      type="url"
                      required
                      autoFocus
                      value={longUrl}
                      onChange={(e) => {
                        setLongUrl(e.target.value);
                        reset();
                      }}
                    />

                    <div className="input-icons">
                      <label
                        className="single-use-toggle tooltip"
                        data-tooltip="Single-use link"
                      >
                        <input
                          type="checkbox"
                          checked={singleUse}
                          onChange={(e) => {
                            setSingleUse(e.target.checked);
                            reset();
                          }}
                        />
                        <span className="single-use-track">
                          <span className="single-use-thumb" />
                        </span>
                      </label>

                      <button
                        type="button"
                        aria-label="Set expiry"
                        className={
                          "calendar-btn tooltip" + (showExpiry ? " active" : "")
                        }
                        data-tooltip="Set expiry date"
                        onClick={() => setShowExpiry((v) => !v)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </button>
                    </div>

                    <ExpiryPopover
                      open={showExpiry}
                      value={expiresAtLocal}
                      onChange={(v) => {
                        setExpiresAtLocal(v);
                        reset();
                      }}
                      onClose={() => setShowExpiry(false)}
                    />
                  </div>

                  <div className="submit-inline">
                    <button
                      className="primary"
                      type="submit"
                      disabled={loading || !longUrl}
                    >
                      {loading ? "Creating…" : "Shorten URL"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-banner" role="alert">
                  {error}
                </div>
              )}
            </form>

            <div className="response-wrapper">
              <ResultCard data={result} />
            </div>
          </div>
        ) : (
          <div
            className="panel delete-section"
            role="region"
            aria-label="Delete short URL form"
          >
            <DeleteSection />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

// Footer Component
function Footer() {
  return (
    <div className="footer-license">
      <p>Made with ❤️ by  <a className="author" href="https://github.com/rahulsharmadev0">@rahulsharmadev</a></p>
      <p>All rights reserved. Licensed under the MIT License.</p>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById("root")).render(<App />);
