
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

// USER PAGES
import Login from "./pages/Login";
import Register from "./pages/Register";
import Garages from "./pages/Garages";
import ServiceRequest from "./pages/ServiceRequest";
import Invoice from "./pages/Invoice";

// GARAGE PAGES
import GarageRegister from "./pages/GarageRegister";
import GarageLogin from "./pages/GarageLogin";
import GarageDashboard from "./pages/GarageDashboard";

// HOME PAGE
function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoIcon}>Q</div>

        <h1 style={styles.title}>QuickFix</h1>

        <p style={styles.subtitle}>
          Vehicle breakdown assistance, made easy.
        </p>

        <h2 style={styles.heading}>Welcome!</h2>

        <p style={styles.description}>
          Choose how you want to continue.
        </p>

        <Link to="/login" style={styles.userButton}>
          User Login
        </Link>

        <Link to="/register" style={styles.registerButton}>
          User Register
        </Link>

        <div style={styles.divider} />

        <Link to="/garage-login" style={styles.garageButton}>
          Garage Login
        </Link>

        <Link to="/garage-register" style={styles.registerButton}>
          Register Your Garage
        </Link>

        <p style={styles.footer}>
          Need vehicle assistance? QuickFix is here to help.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #101820, #263746)",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "35px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.3)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  logoIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f97316",
    color: "#fff",
    borderRadius: "15px",
    fontSize: "35px",
    fontWeight: "bold",
  },

  title: {
    fontSize: "38px",
    color: "#f97316",
    margin: "0 0 10px",
  },

  subtitle: {
    color: "#666",
    marginBottom: "28px",
    lineHeight: 1.5,
  },

  heading: {
    color: "#222",
    marginBottom: "8px",
  },

  description: {
    color: "#666",
    marginBottom: "22px",
  },

  userButton: {
    display: "block",
    padding: "13px",
    marginBottom: "12px",
    background: "#f97316",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  garageButton: {
    display: "block",
    padding: "13px",
    marginBottom: "12px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  registerButton: {
    display: "block",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #d1d5db",
    color: "#333",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "20px 0",
  },

  footer: {
    marginTop: "24px",
    marginBottom: 0,
    color: "#89919e",
    fontSize: "12px",
    lineHeight: 1.6,
  },
};

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f4f7fb",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "64px", color: "#f97316", margin: 0 }}>
        404
      </h1>

      <h2>Page Not Found</h2>

      <p style={{ color: "#64748b" }}>
        Sorry, the page you are looking for does not exist.
      </p>

      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "12px 22px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* USER ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/garages" element={<Garages />} />
        <Route path="/request" element={<ServiceRequest />} />
        <Route path="/invoice" element={<Invoice />} />

        {/* GARAGE ROUTES */}
        <Route path="/garage-register" element={<GarageRegister />} />
        <Route path="/garage-login" element={<GarageLogin />} />
        <Route
          path="/garage-dashboard"
          element={<GarageDashboard />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
