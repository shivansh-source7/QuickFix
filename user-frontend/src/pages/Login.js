
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/users/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem("user", JSON.stringify(res.data));
      localStorage.setItem("role", "user");

      navigate("/garages");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Login failed. Please try again."
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
            <p className="auth-kicker">WELCOME BACK</p>
            <h1 className="auth-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </h1>
            <h2>Help is closer than you think.</h2>
            <p>Sign in to find nearby garages and manage your services.</p>
          </div>
          <p className="auth-brand-footer">
            Reliable help for every journey.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-content">
            <Link to="/" className="auth-mobile-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </Link>

            <p className="auth-kicker">USER ACCOUNT</p>
            <h2 className="auth-heading">User Login</h2>
            <p className="auth-description">
              Enter your account details to continue.
            </p>

            {error && (
              <div className="auth-message auth-error" role="alert">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="auth-switch">
              New to QuickFix? <Link to="/register">Create an account</Link>
            </p>

            <Link to="/garage-login" className="auth-back-link">
              Garage partner? Sign in here
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
