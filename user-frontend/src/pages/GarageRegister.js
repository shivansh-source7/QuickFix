
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Auth.css";

export default function GarageRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    garageName: "",
    ownerName: "",
    email: "",
    password: "",
    services: "",
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

  // Detect the garage's location
  const getGarageLocation = () => {
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

        setSuccess(
          "Garage location detected. Make sure you are at your garage."
        );
        setLocationLoading(false);
      },
      (err) => {
        let message = "Unable to detect the garage location.";

        if (err.code === 1) {
          message =
            "Location permission denied. Allow location access in your browser and try again.";
        } else if (err.code === 2) {
          message = "Location is unavailable. Please try again.";
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
      setError("Please detect your garage location before registering.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/garages/register", {
        garageName: form.garageName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        services: form.services.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
      });

      alert("Garage registered successfully! Please log in.");
      navigate("/garage-login");
    } catch (err) {
      console.error("Garage registration error:", err);
      console.error("Backend response:", err.response?.data);

      const data = err.response?.data;
      let message = "Garage registration failed. Please try again.";

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
            <p className="auth-kicker">BECOME A QUICKFIX PARTNER</p>

            <h1 className="auth-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </h1>

            <h2>Grow your garage business with us.</h2>

            <p>
              Connect with nearby customers, manage service requests,
              and grow your garage through QuickFix.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="auth-benefit-icon">⌖</span>
                <span>Connect with nearby customers</span>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>
                <span>Manage service requests</span>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">↗</span>
                <span>Track repairs and invoices</span>
              </div>
            </div>
          </div>

          <p className="auth-brand-footer">
            Better service. Stronger connections.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-content">
            <Link to="/" className="auth-mobile-logo">
              <span className="auth-logo-mark">Q</span> QuickFix
            </Link>

            <p className="auth-kicker">PARTNER REGISTRATION</p>
            <h2 className="auth-heading">Register Your Garage</h2>

            <p className="auth-description">
              Enter your business details to join QuickFix.
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
                <label htmlFor="garage-name">Garage name</label>
                <input
                  id="garage-name"
                  name="garageName"
                  type="text"
                  placeholder="Enter your garage name"
                  value={form.garageName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="owner-name">Owner name</label>
                <input
                  id="owner-name"
                  name="ownerName"
                  type="text"
                  placeholder="Enter owner's full name"
                  value={form.ownerName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="garage-email">Business email</label>
                <input
                  id="garage-email"
                  name="email"
                  type="email"
                  placeholder="garage@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="garage-password">Password</label>
                <input
                  id="garage-password"
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
                <label htmlFor="garage-services">Services offered</label>
                <input
                  id="garage-services"
                  name="services"
                  type="text"
                  placeholder="e.g. Repairs, servicing, tyres"
                  value={form.services}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Garage location</label>

                <button
                  type="button"
                  className="auth-submit"
                  onClick={getGarageLocation}
                  disabled={locationLoading || loading}
                >
                  {locationLoading
                    ? "Detecting location..."
                    : form.lat && form.lng
                    ? "↻ Update Garage Location"
                    : "◎ Detect Garage Location"}
                </button>

                {form.lat && form.lng && (
                  <p className="auth-description">
                    <span aria-hidden="true">✓ </span>
                    Garage location detected successfully.
                  </p>
                )}
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading || locationLoading}
              >
                {loading ? "Registering garage..." : "Register Garage"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="auth-switch">
              Already a partner?{" "}
              <Link to="/garage-login">Sign in</Link>
            </p>

            <Link to="/register" className="auth-back-link">
              Looking for vehicle assistance? Create a user account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
