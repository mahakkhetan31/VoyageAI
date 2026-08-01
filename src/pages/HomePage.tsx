import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <nav className="home-nav">
        <Link to="/" className="home-logo">
          🌍 VoyageAI
        </Link>
        <div className="home-nav-links">
          {user ? (
            <Link to="/dashboard" className="home-btn home-btn--primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="home-link">
                Log in
              </Link>
              <Link to="/register" className="home-btn home-btn--primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="home-hero">
        <h1 className="home-hero__title">
          Plan your perfect trip with AI precision
        </h1>
        <p className="home-hero__subtitle">
          VoyageAI acts as your personal travel concierge, analyzing your budget,
          timeline, and unique interests to craft detailed itineraries, pack lists, and seamless travel experiences.
        </p>
        <div className="home-hero__cta">
          {user ? (
            <Link to="/itinerary" className="home-btn home-btn--primary">
              Plan New Trip
            </Link>
          ) : (
            <Link to="/register" className="home-btn home-btn--primary">
              Start Planning for Free
            </Link>
          )}
          <a href="https://github.com" className="home-btn home-btn--secondary" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
