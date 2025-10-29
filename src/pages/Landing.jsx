import { Link } from 'react-router-dom';
import { Shield, Map, AlertTriangle, TrendingUp, Users, Lock, ArrowRight } from 'lucide-react';

function Landing() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="glass-card landing-hero-content">
            <div className="icon-wrapper icon-wrapper-primary" style={{ margin: '0 auto 1rem' }}>
              <Shield className="w-16 h-16" />
            </div>
            <h1 className="landing-title">Welcome to SafeMzansi</h1>
            <p className="landing-subtitle">
              Stay Informed. Stay Safe. Stay Mzansi.
            </p>
            <p className="landing-description">
              Join thousands of South Africans working together to make our communities safer.
              Report incidents, view crime maps, and receive real-time safety alerts.
            </p>
            <div className="landing-cta">
              <Link to="/signup" className="btn btn-primary">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section-title">How SafeMzansi Works</h2>
          <div className="grid grid-3">
            <div className="card">
              <div className="icon-wrapper icon-wrapper-primary mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="mb-2">Real-Time Alerts</h3>
              <p className="text-gray-600">
                Get instant notifications when crimes are reported near your location. Stay one step ahead.
              </p>
            </div>

            <div className="card">
              <div className="icon-wrapper icon-wrapper-cyan mb-4">
                <Map className="w-8 h-8" />
              </div>
              <h3 className="mb-2">Interactive Map</h3>
              <p className="text-gray-600">
                Visualize crime hotspots and stay informed about your area with our interactive map.
              </p>
            </div>

            <div className="card">
              <div className="icon-wrapper icon-wrapper-primary mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="mb-2">Community Verified</h3>
              <p className="text-gray-600">
                Trust in community-validated reports to stay accurate and informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="landing-container">
          <div className="glass-card">
            <div className="grid grid-3">
              <div className="stat-card">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--primary-blue)' }} />
                <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>1,234</div>
                <div className="stat-label">Reports Today</div>
              </div>
              <div className="stat-card">
                <Users className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--primary-blue)' }} />
                <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>5,678</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <Shield className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--primary-blue)' }} />
                <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>89%</div>
                <div className="stat-label">Verified Reports</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="glass-card landing-cta-box">
            <h2 className="landing-section-title">Ready to Get Started?</h2>
            <p className="landing-description">
              Join our community today and help make Mzansi a safer place for everyone.
            </p>
            <div className="landing-cta">
              <Link to="/signup" className="btn btn-primary">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-outline">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;

