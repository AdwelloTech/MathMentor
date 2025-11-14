import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import './LandingNavbar.css';

export const LandingNavbar = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isAdminLoggedIn } = useAdmin();

  const handleMyAccountClick = () => {
    // Check if admin is logged in
    if (isAdminLoggedIn) {
      navigate('/admin');
      return;
    }

    // Check if regular user is logged in
    if (user && profile) {
      // Redirect to appropriate dashboard based on role
      const userRole = profile?.role || user.role;
      switch (userRole) {
        case 'admin':
          navigate('/admin');
          break;
        case 'principal':
          navigate('/principal');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'tutor':
          navigate('/tutor');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'parent':
          navigate('/parent');
          break;
        case 'hr':
          navigate('/hr');
          break;
        case 'finance':
          navigate('/finance');
          break;
        case 'support':
          navigate('/support');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      // Not logged in, go to login page
      navigate('/login');
    }
  };

  return (
    <nav className="landing-navbar">
      <div className="landing-navbar-content">
        <ul className="landing-navbar-list">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/for-students">Student</Link>
          </li>
          <li>
            <Link to="/for-tutors">Tutor</Link>
          </li>
          <li>
            <button 
              onClick={handleMyAccountClick}
              className="my-account-button"
            >
              My Account
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

