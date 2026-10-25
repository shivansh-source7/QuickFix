
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Garages.css";

function getDistance(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getServices(services) {
  if (Array.isArray(services)) {
    return services.map(String).filter(Boolean);
  }

  if (typeof services === "string" && services.trim()) {
    return services.split(/[,;]/).map((item) => item.trim()).filter(Boolean);
  }

  return ["General Vehicle Service"];
}

function getGarageId(garage) {
  return garage._id || garage.garageId || garage.id;
}

export default function Garages() {
  const navigate = useNavigate();

  const [garages, setGarages] = useState([]);
  const [location, setLocation] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("All Services");
  const [sortBy, setSortBy] = useState("nearest");
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = user?.userId || user?._id;
  const isLoggedIn = Boolean(userId);

  const loadGarages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Uses your existing GET /garages endpoint.
      const response = await api.get("/garages");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.garages || [];

      setGarages(data);
    } catch (err) {
      console.error("Loading garages failed:", err.response?.data || err.message);
      setError(
        err.response?.data?.detail ||
          "Unable to load garages. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGarages();
  }, [loadGarages]);

  // Use the coordinates saved during registration/login as the initial location.
  useEffect(() => {
    const lat = Number(user?.lat);
    const lng = Number(user?.lng);

    if (
      user?.lat !== undefined &&
      user?.lng !== undefined &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      setLocation({ lat, lng });
      setLocationMessage("Using your saved location.");
    }
  }, [user]);

  const detectLocation = () => {
    setError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage("Your current location is being used.");
        setLocationLoading(false);
      },
      (err) => {
        const message =
          err.code === 1
            ? "Location permission was denied. Allow location access and try again."
            : err.code === 2
              ? "Your location is unavailable. Try again or use your saved location."
              : "Location detection timed out. Please try again.";

        setLocationMessage(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const preparedGarages = useMemo(() => {
    return garages.map((garage) => {
      const lat = Number(garage.lat);
      const lng = Number(garage.lng);

      const hasCoordinates =
        garage.lat !== undefined &&
        garage.lng !== undefined &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;

      const distance =
        location && hasCoordinates
          ? getDistance(location.lat, location.lng, lat, lng)
          : null;

      return {
        ...garage,
        _garageId: getGarageId(garage),
        _name: garage.garageName || garage.name || "Vehicle Service Garage",
        _services: getServices(garage.services),
        _distance: distance,
        _lat: hasCoordinates ? lat : null,
        _lng: hasCoordinates ? lng : null,
      };
    });
  }, [garages, location]);

  const availableServices = useMemo(() => {
    const uniqueServices = new Set();

    preparedGarages.forEach((garage) => {
      garage._services.forEach((service) => uniqueServices.add(service));
    });

    return ["All Services", ...Array.from(uniqueServices).sort()];
  }, [preparedGarages]);

  const filteredGarages = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = preparedGarages.filter((garage) => {
      const matchesSearch =
        !query ||
        garage._name.toLowerCase().includes(query) ||
        garage._services.some((service) =>
          service.toLowerCase().includes(query)
        );

      const matchesService =
        selectedService === "All Services" ||
        garage._services.some(
          (service) => service.toLowerCase() === selectedService.toLowerCase()
        );

      return matchesSearch && matchesService;
    });

    return [...results].sort((a, b) => {
      if (sortBy === "nearest") {
        if (a._distance === null) return 1;
        if (b._distance === null) return -1;
        return a._distance - b._distance;
      }

      return a._name.localeCompare(b._name);
    });
  }, [preparedGarages, search, selectedService, sortBy]);

  const openDirections = (garage) => {
    if (garage._lat === null || garage._lng === null) {
      setLocationMessage("This garage has no valid map coordinates.");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${garage._lat},${garage._lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const requestService = (garage) => {
    // Your current service endpoint creates a general nearby request.
    // It does not yet reserve a specific garage.
    navigate("/request", {
      state: {
        garageName: garage._name,
        garageId: garage._garageId,
      },
    });
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <main className="garages-page">
      <header className="garages-header">
        <button
          type="button"
          className="garages-brand"
          onClick={() => navigate("/")}
          aria-label="QuickFix home"
        >
          <span className="garages-brand-icon">Q</span>
          <span>QuickFix</span>
        </button>

        <nav className="garages-nav">
          <button
            type="button"
            className="garages-nav-link"
            onClick={() => navigate("/request")}
          >
            Service Request
          </button>
          <button
            type="button"
            className="garages-nav-link"
            onClick={() => navigate("/invoice")}
          >
            Invoices
          </button>
          {isLoggedIn ? (
            <button
              type="button"
              className="garages-logout"
              onClick={logout}
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              className="garages-logout"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </nav>
      </header>

      <section className="garages-hero">
        <div className="garages-hero-content">
          <span className="garages-eyebrow">
            YOUR VEHICLE, OUR PRIORITY
          </span>
          <h1>Find the right garage, right near you.</h1>
          <p>
            Search vehicle service providers, compare distances,
            and get directions to your preferred garage.
          </p>

          <button
            type="button"
            className="garages-location-button"
            onClick={detectLocation}
            disabled={locationLoading}
          >
            <span aria-hidden="true">⌖</span>
            {locationLoading
              ? "Detecting your location..."
              : location
                ? "Update My Location"
                : "Find Garages Near Me"}
          </button>

          {locationMessage && (
            <p className="garages-location-message" role="status">
              {locationMessage}
            </p>
          )}
        </div>

        <div className="garages-hero-decoration" aria-hidden="true">
          <span className="hero-wheel">◎</span>
          <span className="hero-road">QUICKFIX · QUICKFIX · QUICKFIX</span>
        </div>
      </section>

      <section className="garages-content">
        <div className="garages-section-heading">
          <div>
            <span className="garages-eyebrow">GARAGE DIRECTORY</span>
            <h2>Nearby garages</h2>
            <p>Find services that fit your vehicle's needs.</p>
          </div>

          <button
            type="button"
            className="garages-refresh"
            onClick={loadGarages}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        <div className="garages-filters">
          <div className="garages-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search garage or service..."
              aria-label="Search garages or services"
            />
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            aria-label="Filter by service"
          >
            {availableServices.map((service) => (
              <option value={service} key={service}>
                {service}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort garages"
          >
            <option value="nearest">Nearest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {!location && (
          <div className="garages-info">
            <span aria-hidden="true">ⓘ</span>
            Detect your location to calculate distances and sort garages
            by proximity. Without coordinates, distances cannot be shown.
          </div>
        )}

        {error && (
          <div className="garages-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadGarages}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="garages-state">
            <div className="garages-spinner" />
            <h3>Finding garages...</h3>
            <p>Loading service providers for you.</p>
          </div>
        ) : filteredGarages.length === 0 ? (
          <div className="garages-state">
            <div className="garages-empty-icon">⌕</div>
            <h3>No garages found</h3>
            <p>
              Try another search term or service filter, or refresh the list.
            </p>
            <button
              type="button"
              className="garages-primary-button"
              onClick={() => {
                setSearch("");
                setSelectedService("All Services");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="garages-results-count">
              Showing <strong>{filteredGarages.length}</strong>{" "}
              {filteredGarages.length === 1 ? "garage" : "garages"}
            </div>

            <div className="garages-grid">
              {filteredGarages.map((garage, index) => (
                <article
                  className="garage-card"
                  key={garage._garageId || `${garage._name}-${index}`}
                >
                  <div className="garage-card-top">
                    <div className="garage-avatar" aria-hidden="true">
                      {(garage._name.charAt(0) || "G").toUpperCase()}
                    </div>

                    {garage._distance !== null ? (
                      <span className="garage-distance">
                        ⌖{" "}
                        {garage._distance < 1
                          ? `${Math.round(garage._distance * 1000)} m away`
                          : `${garage._distance.toFixed(1)} km away`}
                      </span>
                    ) : (
                      <span className="garage-distance garage-distance-muted">
                        Distance unavailable
                      </span>
                    )}
                  </div>

                  <h3>{garage._name}</h3>

                  <p className="garage-card-description">
                    Vehicle repair and maintenance services
                  </p>

                  <div className="garage-services">
                    {garage._services.map((service, serviceIndex) => (
                      <span
                        className="garage-service-tag"
                        key={`${service}-${serviceIndex}`}
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  <div className="garage-card-actions">
                    <button
                      type="button"
                      className="garage-directions-button"
                      onClick={() => openDirections(garage)}
                      disabled={garage._lat === null}
                    >
                      Directions ↗
                    </button>

                    <button
                      type="button"
                      className="garage-request-button"
                      onClick={() => requestService(garage)}
                    >
                      Request Service
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="garages-footer">
        <span className="garages-footer-brand">QuickFix</span>
        <span>Making every journey easier.</span>
      </footer>
    </main>
  );
}
