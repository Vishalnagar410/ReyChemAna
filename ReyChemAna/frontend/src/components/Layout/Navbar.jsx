/**
 * Navbar component
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <h2>LIMS</h2>
                </div>

                <div className="navbar-user">
                    <span className="user-info">
                        <strong>{user?.full_name}</strong>
                        <span className="user-role"> ({user?.role})</span>
                    </span>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
