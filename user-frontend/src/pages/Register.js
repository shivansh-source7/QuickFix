
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    lat: "",
    lng: "",
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Automatically detect the user's current location
  const getCurrentLocation = () => {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        }));

        setSuccess("Your location has been detected successfully.");
        setLocationLoading(false);
      },
      (err) => {
        let message = "Unable to detect your location.";

        if (err.code === 1) {
          message =
            "Location permission denied. Allow location access in your browser and try again.";
        } else if (err.code === 2) {
          message = "Your location is unavailable. Please try again.";
        } else if (err.code === 3) {
          message = "Location request timed out. Please try again.";
        }

        setError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.lat || !form.lng) {
      setError("Please detect your current location before registering.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        lat: Number(form.lat),
        lng: Number(form.lng),
      });

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("User registration error:", err);
      console.error("Backend response:", err.response?.data);

      const data = err.response?.data;
      let message = "Registration failed. Please try again.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item) => item.msg || JSON.stringify(item))
          .join(", ");
      } else if (data?.error) {
        message = data.error;
      } else if (!err.response) {
        message =
          "Cannot connect to the backend. Check that FastAPI is running.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand">
          <div className="auth-brand-content">
            <p className="auth-kicker">JOIN THE QUICKFIX COMMUNITY</p>

            <h1 className="auth-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </h1>

            <h2>Every journey deserves peace of mind.</h2>

            <p>
              Find nearby garages and make your vehicle service
              journey simple.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="auth-benefit-icon">⌖</span>
                <span>Find nearby garages</span>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>
                <span>Track service requests</span>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">↗</span>
                <span>Manage vehicle services</span>
              </div>
            </div>
          </div>

          <p className="auth-brand-footer">
            Your road. Your journey. QuickFix.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-content">
            <Link to="/" className="auth-mobile-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </Link>

            <p className="auth-kicker">GET STARTED</p>
            <h2 className="auth-heading">Create Account</h2>

            <p className="auth-description">
              Enter your details to join QuickFix.
            </p>

            {error && (
              <div className="auth-message auth-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-message auth-success" role="status">
                {success}
              </div>
            )}

            <form className="auth-form" onSubmit={submit}>
              <div className="auth-field">
                <label htmlFor="user-name">Full name</label>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="user-email">Email address</label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="user-phone">Phone number</label>
                <input
                  id="user-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="user-password">Password</label>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Your current location</label>

                <button
                  type="button"
                  className="auth-submit"
                  onClick={getCurrentLocation}
                  disabled={locationLoading || loading}
                >
                  {locationLoading
                    ? "Detecting location..."
                    : form.lat && form.lng
                    ? "↻ Update My Location"
                    : "◎ Detect My Location"}
                </button>

                {form.lat && form.lng && (
                  <p className="auth-description">
                    <span aria-hidden="true">✓ </span>
                    Location detected successfully.
                  </p>
                )}
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading || locationLoading}
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="auth-switch">
              Already registered? <Link to="/login">Sign in</Link>
            </p>

            <Link to="/garage-register" className="auth-back-link">
              Register as a garage partner
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
