
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Auth.css";

export default function GarageLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/garages/login", {
        email,
        password,
      });

      if (res.data.error) {
        setError(res.data.error);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("garageId", res.data.garageId);

      navigate("/garage-dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand">
          <div className="auth-brand-content">
            <p className="auth-kicker">QUICKFIX PARTNER NETWORK</p>
            <h1 className="auth-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </h1>
            <h2>More connections. More opportunities.</h2>
            <p>
              Manage incoming service requests, keep customers informed,
              and grow your garage business with QuickFix.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="auth-benefit-icon">⌖</span>
                <span>Receive nearby service requests</span>
              </div>
              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>
                <span>Manage repairs in one place</span>
              </div>
              <div className="auth-benefit">
                <span className="auth-benefit-icon">↗</span>
                <span>Keep track of service progress</span>
              </div>
            </div>
          </div>
          <p className="auth-brand-footer">Built for the people who keep us moving.</p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-content">
            <Link to="/" className="auth-mobile-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </Link>

            <p className="auth-kicker">PARTNER ACCESS</p>
            <h2 className="auth-heading">Garage Login</h2>
            <p className="auth-description">
              Sign in to manage your garage and service requests.
            </p>

            {error && (
              <div className="auth-message auth-error" role="alert">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={submit}>
              <div className="auth-field">
                <label htmlFor="garage-email">Business email</label>
                <input
                  id="garage-email"
                  type="email"
                  placeholder="garage@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="garage-password">Password</label>
                <input
                  id="garage-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Partner Sign In"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="auth-switch">
              New partner? <Link to="/garage-register">Register your garage</Link>
            </p>

            <Link to="/login" className="auth-back-link">
              Looking for vehicle assistance? User login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
