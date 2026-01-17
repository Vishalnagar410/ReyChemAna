/**
 * Login component
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/index.css';

export default function Login() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /**
     * 🚦 Redirect already authenticated users away from login
     */
    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    /**
     * Handle login submit
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const loggedInUser = await login(username, password);

            /**
             * Redirect based on role
             */
            switch (loggedInUser.role?.toLowerCase()) {
                case 'admin':
                    navigate('/admin', { replace: true });
                    break;
                case 'chemist':
                    navigate('/chemist', { replace: true });
                    break;
                case 'analyst':
                    navigate('/analyst', { replace: true });
                    break;
                default:
                    navigate('/', { replace: true });
            }
        } catch (err) {
            /**
             * 🔥 Robust FastAPI error handling
             */
            const detail = err.response?.data?.detail;

            if (Array.isArray(detail)) {
                setError(detail.map((d) => d.msg).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * While auth bootstrap is running
     */
    if (loading) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <p>Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>Laboratory Request Management System</h1>
                    <p>Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p><strong>Test credentials</strong></p>
                    <p>Admin: admin / admin123</p>
                    <p>Chemist: chemist1 / chemist123</p>
                    <p>Analyst: analyst1 / analyst123</p>
                </div>
            </div>
        </div>
    );
}
