import React from 'react';
import { Link } from 'react-router-dom';
import './LandingFooter.css';

const LandingFooter: React.FC = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-content">
        <div className="landing-footer-left">
          <div className="landing-footer-logo">
            <img src="/footer/footer-logo.svg"
              alt="Math Mentor"
              className="w-full h-full object-cover" loading="lazy"
            />
          </div>
          <p className="landing-footer-tagline">
            Empowering students to master mathematics
          </p>
        </div>

        <div className="landing-footer-links">
          <div className="landing-footer-column">
            <h4>
              <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            </h4>
            <h4>
              <Link to="/for-students" className="hover:text-gray-300 transition-colors">Student</Link>
            </h4>
            <h4>
              <Link to="/for-tutors" className="hover:text-gray-300 transition-colors">Tutor</Link>
            </h4>
            <h4>
              <Link to="/about" className="hover:text-gray-300 transition-colors">About Us</Link>
            </h4>
          </div>

          <div className="landing-footer-column">
            <h4>Follow us</h4>
            <div className="landing-social-links">
              <a href="#" className="landing-social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987H7.898v-2.892h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.261c-1.243 0-1.631.771-1.631 1.562v1.875h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12z" fill="white"/>
                </svg>
              </a>
              <a href="#" className="landing-social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="white"/>
                </svg>
              </a>
              <a href="#" className="landing-social-link" aria-label="X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18.244 2H21l-7.53 8.593L22 22h-6.756l-5.33-6.51L4.756 22H2l8.12-9.344L2 2h6.756l5.02 6.136L18.244 2zM16.91 20h2.006L7.17 4H5.165L16.91 20z" fill="white"/>
                </svg>
              </a>
            </div>
            <p className="landing-contact-email">
              hello@mathmentor.com
            </p>
          </div>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <div className="landing-footer-divider"></div>
        <p className="landing-footer-copyright">
          &copy; 2025 Mathmentor. All rights reserved.{' '}
          <Link to="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <span className="landing-footer-separator"> | </span>
          <Link to="/terms" className="hover:text-gray-300 transition-colors">
            Terms of Service
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;

