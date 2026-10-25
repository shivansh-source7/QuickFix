
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import "./ServiceRequest.css";

const problems = [
  { name: "Brake Failure", icon: "🛑", desc: "Brake or stopping issues" },
  { name: "Engine Problem", icon: "⚙️", desc: "Engine noise or failure" },
  { name: "Battery Issue", icon: "🔋", desc: "Dead battery or starting issue" },
  { name: "Flat Tyre / Puncture", icon: "🛞", desc: "Flat tyre or damaged tyre" },
  { name: "Clutch Problem", icon: "🔧", desc: "Clutch or gear shifting issue" },
  { name: "Overheating", icon: "🌡️", desc: "Engine temperature is high" },
  { name: "Oil Leakage", icon: "🛢️", desc: "Oil leak or low oil level" },
  { name: "Starting Problem", icon: "🔑", desc: "Vehicle won't start" },
  { name: "AC Not Working", icon: "❄️", desc: "AC or cooling issue" },
  { name: "Accident / Body Damage", icon: "🚘", desc: "Body damage or accident" },
  { name: "Electrical Problem", icon: "⚡", desc: "Lights, wiring or electrical issue" },
  { name: "Other", icon: "🧰", desc: "Any other vehicle problem" },
];

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.userId || user._id || localStorage.getItem("userId") || "";
  } catch {
    return localStorage.getItem("userId") || "";
  }
}

function ServiceRequest() {
  const location = useLocation();
  const selectedGarage = location.state || {};

  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [request, setRequest] = useState(null);

  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const loadRequest = async () => {
      try {
        const response = await api.get(
          `/service/user/details/${userId}`
        );

        if (!active) return;

        const data = response.data;
        if (data && !data.detail) {
          setRequest(data);
        }
      } catch (err) {
        // No previous request may exist yet.
      }
    };

    loadRequest();
    const interval = setInterval(loadRequest, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Please log in before requesting a service.");
      return;
    }

    if (!problem) {
      setError("Please select a vehicle problem.");
      return;
    }

    setLoading(true);

    try {
      // The description field remains compatible with a backend
      // that currently accepts userId and description.
      const fullDescription = [
        `Problem: ${problem}`,
        `Urgency: ${urgency}`,
        description.trim() ? `Details: ${description.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        userId,
        problem,
        urgency,
        description: fullDescription,
      };

      // Pass the chosen garage if the user selected one on Garages.js.
      if (selectedGarage.garageId) {
        payload.garageId = selectedGarage.garageId;
      }

      const response = await api.post("/service/create", payload);

      setSuccess(
        response.data?.message || "Your service request was submitted successfully."
      );

      setRequest({
        ...response.data,
        problem,
        urgency,
        description: fullDescription,
        status: response.data?.status || "pending",
        garageName:
          response.data?.garageName || selectedGarage.garageName || "",
      });

      setDescription("");
      setProblem("");
      setUrgency("Normal");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to submit your request. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const status = String(request?.status || "pending").toLowerCase();
  const stages = ["pending", "accepted", "in progress", "completed"];
  const activeStage = stages.indexOf(status);

  return (
    <main className="sr-page">
      <div className="sr-container">
        <header className="sr-heading">
          <span className="sr-eyebrow">QUICKFIX AUTO CARE</span>
          <h1>Request Vehicle Service</h1>
          <p>Tell us what's wrong. We'll help you find the right service.</p>
        </header>

        {selectedGarage.garageName && (
          <div className="sr-garage-banner">
            <span className="sr-garage-icon">🏪</span>
            <div>
              <strong>Selected garage</strong>
              <p>{selectedGarage.garageName}</p>
            </div>
          </div>
        )}

        {error && <div className="sr-alert sr-error">{error}</div>}
        {success && <div className="sr-alert sr-success">{success}</div>}

        <form className="sr-card" onSubmit={handleSubmit}>
          <section className="sr-section">
            <div className="sr-section-heading">
              <span className="sr-step">1</span>
              <div>
                <h2>What's the problem?</h2>
                <p>Select the issue with your vehicle.</p>
              </div>
            </div>

            <div className="sr-problem-grid">
              {problems.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={`sr-problem ${
                    problem === item.name ? "selected" : ""
                  }`}
                  onClick={() => setProblem(item.name)}
                  aria-pressed={problem === item.name}
                >
                  <span className="sr-problem-icon">{item.icon}</span>
                  <span className="sr-problem-name">{item.name}</span>
                  <span className="sr-problem-desc">{item.desc}</span>
                  {problem === item.name && (
                    <span className="sr-selected-mark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="sr-section">
            <div className="sr-section-heading">
              <span className="sr-step">2</span>
              <div>
                <h2>How urgent is it?</h2>
                <p>Choose how soon you need assistance.</p>
              </div>
            </div>

            <div className="sr-urgency-options">
              <button
                type="button"
                className={`sr-urgency ${
                  urgency === "Normal" ? "selected" : ""
                }`}
                onClick={() => setUrgency("Normal")}
              >
                <span>🕒</span>
                <span>
                  <strong>Normal</strong>
                  <small>Service can be scheduled</small>
                </span>
              </button>

              <button
                type="button"
                className={`sr-urgency ${
                  urgency === "Urgent" ? "selected urgent" : ""
                }`}
                onClick={() => setUrgency("Urgent")}
              >
                <span>🚨</span>
                <span>
                  <strong>Urgent</strong>
                  <small>Need help as soon as possible</small>
                </span>
              </button>
            </div>

            {urgency === "Urgent" && (
              <p className="sr-safety-note">
                If the brakes fail or the vehicle is unsafe to drive, stop in a
                safe place and arrange towing. Do not drive it to the garage.
              </p>
            )}
          </section>

          <section className="sr-section">
            <div className="sr-section-heading">
              <span className="sr-step">3</span>
              <div>
                <h2>Additional details</h2>
                <p>Help the mechanic understand the issue.</p>
              </div>
            </div>

            <label className="sr-label" htmlFor="sr-description">
              Describe the problem <span>(optional)</span>
            </label>
            <textarea
              id="sr-description"
              className="sr-textarea"
              rows="4"
              maxLength="1000"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Example: My car makes a noise when I apply the brakes..."
            />
            <div className="sr-character-count">
              {description.length}/1000
            </div>
          </section>

          <button
            className="sr-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting request..." : "Submit Service Request →"}
          </button>
          <p className="sr-form-footnote">
            Your request details will be shared with the service system.
          </p>
        </form>

        {request && (
          <section className="sr-card sr-tracking">
            <div className="sr-tracking-top">
              <div>
                <span className="sr-eyebrow">REQUEST TRACKING</span>
                <h2>Your Service Request</h2>
              </div>
              <span className={`sr-status status-${status.replace(/\s+/g, "-")}`}>
                {request.status || "Pending"}
              </span>
            </div>

            {request.problem && (
              <p className="sr-tracking-problem">
                <strong>Problem:</strong> {request.problem}
              </p>
            )}

            {request.garageName && (
              <p className="sr-tracking-problem">
                <strong>Garage:</strong> {request.garageName}
              </p>
            )}

            <div className="sr-progress">
              {["Pending", "Accepted", "In Progress", "Completed"].map(
                (stage, index) => (
                  <div
                    key={stage}
                    className={`sr-progress-stage ${
                      activeStage >= index ? "active" : ""
                    }`}
                  >
                    <span className="sr-progress-dot">
                      {activeStage > index ? "✓" : index + 1}
                    </span>
                    <span>{stage}</span>
                  </div>
                )
              )}
            </div>
            <p className="sr-tracking-note">
              Request status refreshes automatically.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default ServiceRequest;
