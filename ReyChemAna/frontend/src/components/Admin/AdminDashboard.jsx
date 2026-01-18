/**
 * Admin Dashboard
 * Phase-C Step-2
 * - Users (existing)
 * - Requests (read-only)
 * - Analytics (placeholder)
 */

import { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import userService from '../../services/userService';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
    const { user: currentUser, loading: authLoading } = useAuth();

    /* ---------------- TAB STATE ---------------- */
    const [activeTab, setActiveTab] = useState('users');

    /* ---------------- USERS STATE (EXISTING) ---------------- */
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'chemist'
    });

    /* ---------------- REQUESTS STATE (NEW) ---------------- */
    const [requests, setRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(false);

    const [reqFilters, setReqFilters] = useState({
        status: 'all'
    });

    /* ---------------- LOAD USERS ---------------- */
    useEffect(() => {
        if (!authLoading) {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getUsers({
                page: 1,
                page_size: 100
            });
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- LOAD REQUESTS (ADMIN READ-ONLY) ---------------- */
    const loadRequests = async () => {
        setReqLoading(true);
        try {
            const params = {
                page: 1,
                page_size: 100
            };

            if (reqFilters.status !== 'all') {
                params.status = reqFilters.status;
            }

            const data = await requestService.getRequests(params);
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setReqLoading(false);
        }
    };

    /* Load requests when Requests tab opens */
    useEffect(() => {
        if (activeTab === 'requests') {
            loadRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, reqFilters]);

    /* ---------------- USER ACTIONS (EXISTING) ---------------- */
    const handleCreateUser = async (e) => {
        e.preventDefault();

        try {
            await userService.createUser({
                ...formData,
                role: formData.role.toLowerCase().trim()
            });

            setFormData({
                username: '',
                email: '',
                full_name: '',
                password: '',
                role: 'chemist'
            });

            setShowCreateForm(false);
            await loadUsers();
        } catch (error) {
            const detail = error.response?.data?.detail;

            if (Array.isArray(detail)) {
                alert(detail.map((d) => d.msg).join('\n'));
            } else if (typeof detail === 'string') {
                alert(detail);
            } else {
                alert('Failed to create user');
            }
        }
    };

    const toggleUserStatus = async (user) => {
        if (user.id === currentUser?.id) {
            alert('You cannot deactivate your own account.');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} user "${user.username}"?`
        );

        if (!confirmed) return;

        try {
            await userService.updateUser(user.id, {
                is_active: !user.is_active
            });
            await loadUsers();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    /* ============================ UI ============================ */
    return (
        <div>
            <Navbar />

            <div className="container">
                {/* -------- Tabs -------- */}
                <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                    <button
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👤 Users
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        📄 Requests
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📊 Analytics
                    </button>
                </div>

                {/* ===================================================== */}
                {/* ===================== USERS TAB ===================== */}
                {/* ===================================================== */}
                {activeTab === 'users' && (
                    <>
                        <div className="page-header">
                            <h1>User Management</h1>
                            <button
                                className="btn-primary"
                                onClick={() => setShowCreateForm(!showCreateForm)}
                            >
                                {showCreateForm ? 'Cancel' : '+ New User'}
                            </button>
                        </div>

                        {showCreateForm && (
                            <div className="form-card" style={{ marginBottom: '2rem' }}>
                                <h3>Create New User</h3>

                                <form onSubmit={handleCreateUser}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Username *</label>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        username: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        email: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        full_name: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Password *</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        password: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    role: e.target.value
                                                })
                                            }
                                            required
                                        >
                                            <option value="chemist">Chemist</option>
                                            <option value="analyst">Analyst</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="btn-primary">
                                        Create User
                                    </button>
                                </form>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading">Loading users...</div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Full Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td><strong>{user.username}</strong></td>
                                                <td>{user.full_name}</td>
                                                <td>{user.email}</td>
                                                <td style={{ textTransform: 'capitalize' }}>
                                                    {user.role}
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            user.is_active
                                                                ? 'status-active'
                                                                : 'status-inactive'
                                                        }
                                                    >
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-small"
                                                        onClick={() => toggleUserStatus(user)}
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ===================================================== */}
                {/* =================== REQUESTS TAB ==================== */}
                {/* ===================================================== */}
                {activeTab === 'requests' && (
                    <>
                        <h1>Requests</h1>

                        <div className="filters" style={{ marginBottom: '1rem' }}>
                            <select
                                value={reqFilters.status}
                                onChange={(e) =>
                                    setReqFilters({ ...reqFilters, status: e.target.value })
                                }
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {reqLoading ? (
                            <div className="loading">Loading requests...</div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Request #</th>
                                            <th>Compound</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Chemist</th>
                                            <th>Analyst</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((r) => (
                                            <tr key={r.id}>
                                                <td>{r.request_number}</td>
                                                <td>{r.compound_name}</td>
                                                <td>{r.status}</td>
                                                <td>{r.priority}</td>
                                                <td>{r.chemist_name || '-'}</td>
                                                <td>{r.analyst_name || '-'}</td>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ===================================================== */}
                {/* =================== ANALYTICS TAB =================== */}
                {/* ===================================================== */}
                {activeTab === 'analytics' && (
                    <>
                        <h1>Analytics</h1>
                        <div className="card">
                            <p style={{ color: '#6b7280' }}>
                                Analytics charts will be added in Phase-D.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
