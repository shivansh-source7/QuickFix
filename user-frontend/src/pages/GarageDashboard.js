
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import "./GarageDashboard.css";

const STATUSES = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function GarageDashboard() {
  const garageId = localStorage.getItem("garageId") || "";
  const garageName = localStorage.getItem("garageName") || "My Garage";

  const [section, setSection] = useState("overview");
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [available, setAvailable] = useState(true);

  const counts = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    active: requests.filter(r =>
      ["accepted", "in_progress"].includes(r.status)
    ).length,
    completed: requests.filter(r => r.status === "completed").length,
  }), [requests]);

  const loadDashboard = useCallback(async () => {
    if (!garageId) {
      setError("Garage ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const [assignedResponse, pendingResponse, reviewsResponse] =
        await Promise.all([
          api.get(`/service/garage/${garageId}`),
          api.get(`/service/pending/${garageId}`),
          api.get(`/garages/${garageId}/reviews`).catch(() => ({
            data: { reviews: [], averageRating: 0, reviewCount: 0 },
          })),
        ]);

      const assigned = Array.isArray(assignedResponse.data)
        ? assignedResponse.data : [];
      const pending = Array.isArray(pendingResponse.data)
        ? pendingResponse.data : [];

      const unique = new Map();
      [...assigned, ...pending].forEach(request => {
        const id = request._id || request.requestId;
        if (id) unique.set(id, request);
      });

      setRequests([...unique.values()]);

      const reviewData = reviewsResponse.data || {};
      setReviews(Array.isArray(reviewData.reviews) ? reviewData.reviews : []);
      setRating(Number(reviewData.averageRating || 0));
      setReviewCount(Number(reviewData.reviewCount || 0));
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [garageId]);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 10000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  const updateRequest = async (request, action) => {
    const id = request._id || request.requestId;
    if (!id) return;

    setBusyId(id);
    setError("");
    setMessage("");

    try {
      if (action === "accept") {
        await api.post(`/service/accept/${id}`, { garageId });
        setMessage("Service request accepted.");
      } else {
        await api.post(`/service/status/${id}`, {
          garageId,
          status: action,
        });
        setMessage(`Request status updated to ${STATUSES[action]}.`);
      }

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not update the request."
      );
      await loadDashboard();
    } finally {
      setBusyId("");
    }
  };

  const startLocationSharing = () => {
    if (!garageId) {
      setLocationMessage("Please log in again.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location sharing.");
      return;
    }

    setLocationMessage("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          await api.post(`/service/location/${garageId}`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationSharing(true);
          setLocationMessage("Location sent successfully.");
        } catch (err) {
          setLocationMessage(
            err.response?.data?.detail || "Unable to send location."
          );
        }
      },
      err => {
        setLocationMessage(
          err.code === 1
            ? "Location permission denied."
            : "Could not access your location."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const logout = () => {
    localStorage.removeItem("garageId");
    localStorage.removeItem("garageName");
    localStorage.removeItem("token");
    window.location.href = "/garage-login";
  };

  const visibleRequests = requests.filter(request => {
    const status = request.status || "pending";
    const id = request._id || request.requestId || "";
    const text = [
      id,
      request.description,
      request.problem,
      request.serviceType,
    ].filter(Boolean).join(" ").toLowerCase();

    if (section === "pending" && status !== "pending") return false;
    if (section === "active" &&
        !["accepted", "in_progress"].includes(status)) return false;
    if (section === "completed" && status !== "completed") return false;
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (search && !text.includes(search.toLowerCase())) return false;

    return true;
  });

  if (!garageId) {
    return (
      <div className="gd-login">
        <h2>Garage login required</h2>
        <p>Please log in to access the QuickFix dashboard.</p>
        <button onClick={() => window.location.href = "/garage-login"}>
          Go to Login
        </button>
      </div>
    );
  }

  const navItems = [
    ["overview", "Overview"],
    ["pending", "Service Requests"],
    ["active", "Active Jobs"],
    ["completed", "Completed Jobs"],
    ["reviews", "Customer Reviews"],
    ["settings", "Settings"],
  ];

  return (
    <div className="gd-layout">
      <aside className="gd-sidebar">
        <div className="gd-logo">
          <span className="gd-logo-icon">Q</span>
          <div>
            <strong>QuickFix</strong>
            <small>Garage Portal</small>
          </div>
        </div>

        <p className="gd-nav-heading">WORKSPACE</p>

        <nav className="gd-nav">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              className={section === key ? "gd-nav-link selected" : "gd-nav-link"}
              onClick={() => {
                setSection(key);
                setStatusFilter("all");
                setSearch("");
              }}
            >
              <span>{{
                overview: "▦",
                pending: "▤",
                active: "⚙",
                completed: "✓",
                reviews: "★",
                settings: "⚙",
              }[key]}</span>
              {label}
              {key === "pending" && counts.pending > 0 &&
                <b className="gd-count">{counts.pending}</b>}
            </button>
          ))}
        </nav>

        <div className="gd-sidebar-bottom">
          <div className="gd-help">
            <strong>QuickFix Garage</strong>
            <p>Manage requests and provide great service.</p>
          </div>
          <button className="gd-logout" onClick={logout}>↪ Log out</button>
        </div>
      </aside>

      <main className="gd-main">
        <header className="gd-topbar">
          <span>Garage Portal / {navItems.find(n => n[0] === section)?.[1]}</span>
          <div className="gd-profile">
            <span className="gd-online-dot" />
            <span>{garageName}</span>
            <div className="gd-avatar">{garageName[0]?.toUpperCase()}</div>
          </div>
        </header>

        <div className="gd-content">
          <section className="gd-welcome">
            <div>
              <p className="gd-eyebrow">GARAGE MANAGEMENT</p>
              <h1>{section === "overview" ? "Welcome back!" :
                navItems.find(n => n[0] === section)?.[1]}</h1>
              <p>Manage your garage, requests, and customer experience.</p>
            </div>
            <button className="gd-btn gd-btn-light"
              onClick={() => { setLoading(true); loadDashboard(); }}>
              ↻ Refresh
            </button>
          </section>

          {error && <div className="gd-alert error">{error}</div>}
          {message && <div className="gd-alert success">{message}</div>}

          {section !== "reviews" && section !== "settings" && (
            <>
              <section className="gd-stats">
                {[
                  ["Total Requests", counts.total, "▤", "blue"],
                  ["Pending Jobs", counts.pending, "◷", "orange"],
                  ["Active Jobs", counts.active, "⚙", "purple"],
                  ["Completed Jobs", counts.completed, "✓", "green"],
                ].map(([label, value, icon, color]) => (
                  <article className="gd-stat" key={label}>
                    <div className="gd-stat-head">
                      <span>{label}</span>
                      <span className={`gd-stat-icon ${color}`}>{icon}</span>
                    </div>
                    <strong>{value}</strong>
                    <small>{label === "Pending Jobs" ? "Awaiting acceptance" :
                      label === "Active Jobs" ? "Accepted or in progress" :
                      label === "Completed Jobs" ? "Finished services" :
                      "Requests visible to your garage"}</small>
                  </article>
                ))}
              </section>

              <section className="gd-panel">
                <div className="gd-panel-title">
                  <div>
                    <h2>{section === "overview" ? "Service Requests" :
                      navItems.find(n => n[0] === section)?.[1]}</h2>
                    <p>Accept jobs and update service progress.</p>
                  </div>
                  <button className="gd-btn gd-btn-light"
                    onClick={() => { setLoading(true); loadDashboard(); }}>
                    Refresh jobs
                  </button>
                </div>

                <div className="gd-toolbar">
                  <input
                    placeholder="Search service requests..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <select value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {loading ? (
                  <div className="gd-empty">Loading requests...</div>
                ) : visibleRequests.length === 0 ? (
                  <div className="gd-empty">
                    <span>▤</span>
                    <h3>No requests found</h3>
                    <p>New eligible service requests will appear here.</p>
                  </div>
                ) : (
                  <div className="gd-request-grid">
                    {visibleRequests.map(request => {
                      const id = request._id || request.requestId;
                      const status = request.status || "pending";
                      const assigned = !request.assignedGarageId ||
                        request.assignedGarageId === garageId;

                      return (
                        <article className="gd-request" key={id}>
                          <div className="gd-request-head">
                            <div className="gd-car-icon">🚘</div>
                            <div className="gd-request-title">
                              <h3>{request.problem || request.serviceType ||
                                "Vehicle Service"}</h3>
                              <small>Request #{String(id).slice(-8)}</small>
                            </div>
                            <span className={`gd-status ${status}`}>
                              {STATUSES[status] || status}
                            </span>
                          </div>

                          <p className="gd-description">
                            {request.description || "No description provided."}
                          </p>

                          <div className="gd-request-meta">
                            <span>
                              <b>Distance</b>
                              {request.distanceKm != null
                                ? `${request.distanceKm} km` : "Not available"}
                            </span>
                            <span>
                              <b>Service status</b>
                              {STATUSES[status] || status}
                            </span>
                          </div>

                          <div className="gd-actions">
                            {status === "pending" && assigned && (
                              <button className="gd-btn gd-btn-primary"
                                disabled={busyId === id}
                                onClick={() => updateRequest(request, "accept")}>
                                {busyId === id ? "Please wait..." : "Accept Request"}
                              </button>
                            )}

                            {status === "pending" && !assigned && (
                              <span className="gd-muted">Assigned elsewhere</span>
                            )}

                            {status === "accepted" && (
                              <button className="gd-btn gd-btn-primary"
                                disabled={busyId === id}
                                onClick={() => updateRequest(request, "in_progress")}>
                                Start Service
                              </button>
                            )}

                            {status === "in_progress" && (
                              <button className="gd-btn gd-btn-success"
                                disabled={busyId === id}
                                onClick={() => updateRequest(request, "completed")}>
                                Mark Completed
                              </button>
                            )}

                            {["accepted", "in_progress"].includes(status) && (
                              <button className="gd-btn gd-btn-light"
                                disabled={busyId === id}
                                onClick={() => updateRequest(request, "cancelled")}>
                                Cancel Job
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {section === "reviews" && (
            <section className="gd-panel">
              <div className="gd-panel-title">
                <div>
                  <h2>Customer Reviews</h2>
                  <p>See what customers say about your services.</p>
                </div>
              </div>

              <div className="gd-rating-summary">
                <strong>{rating.toFixed(1)} <small>/ 5</small></strong>
                <div>
                  <span className="gd-stars">★★★★★</span>
                  <p>{reviewCount} reviews</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="gd-empty">
                  <h3>No reviews yet</h3>
                  <p>Reviews appear here after customers rate completed jobs.</p>
                </div>
              ) : reviews.map((review, index) => (
                <article className="gd-review" key={review.requestId || index}>
                  <div className="gd-review-head">
                    <strong>Service review</strong>
                    <span className="gd-stars">
                      {"★".repeat(Math.max(0, Math.min(5, review.rating || 0)))}
                      {"☆".repeat(5 - Math.max(0, Math.min(5, review.rating || 0)))}
                    </span>
                  </div>
                  <p>{review.comment || "No written comment."}</p>
                  <small>Request #{String(review.requestId || "").slice(-8)}</small>
                </article>
              ))}
            </section>
          )}

          {section === "settings" && (
            <section className="gd-panel">
              <div className="gd-panel-title">
                <div>
                  <h2>Garage Settings</h2>
                  <p>Location sharing and availability controls.</p>
                </div>
              </div>

              <div className="gd-setting-row">
                <div>
                  <h3>Garage availability</h3>
                  <p>This toggle is currently local UI state only.</p>
                </div>
                <button
                  className={`gd-toggle ${available ? "on" : ""}`}
                  onClick={() => setAvailable(v => !v)}
                  aria-pressed={available}
                >
                  {available ? "Available" : "Unavailable"}
                </button>
              </div>

              <div className="gd-setting-row">
                <div>
                  <h3>Share mechanic location</h3>
                  <p>Allow the browser to share this device's location.</p>
                  <small>{locationMessage}</small>
                </div>
                <button className="gd-btn gd-btn-primary"
                  onClick={startLocationSharing}>
                  Share Current Location
                </button>
              </div>

              {locationSharing && (
                <p className="gd-alert success">
                  The last location update was sent. For continuous live
                  tracking, send updates periodically while sharing is enabled.
                </p>
              )}
            </section>
          )}

          <footer className="gd-footer">
            © {new Date().getFullYear()} QuickFix · Garage Portal
          </footer>
        </div>
      </main>
    </div>
  );
}
