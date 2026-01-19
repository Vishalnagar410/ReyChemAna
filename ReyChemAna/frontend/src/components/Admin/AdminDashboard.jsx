/**
 * Admin Dashboard
 * Phase-C Step-3
 * - Users (existing, untouched)
 * - Requests (UI aligned with Analyst)
 * - Analytics (fixed 422 + panel)
 */

import { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import userService from '../../services/userService';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import AnalyticsPanel from './AnalyticsPanel';

import {
    REQUEST_STATUS,
    USER_ROLES
} from '../../utils/constants';

export default function AdminDashboard() {
    const { user: currentUser, loading: authLoading } = useAuth();

    /* ---------------- TAB STATE ---------------- */
    const [activeTab, setActiveTab] = useState('users');

    /* ---------------- USERS STATE ---------------- */
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'chemist'
    });

    /* ---------------- REQUESTS STATE ---------------- */
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [requestFilter, setRequestFilter] = useState('all');

    /* ---------------- LOAD USERS ---------------- */
    useEffect(() => {
        if (!authLoading && activeTab === 'users') {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, activeTab]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await userService.getUsers({
                page: 1,
                page_size: 100
            });
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    /* ---------------- LOAD REQUESTS ---------------- */
    useEffect(() => {
        if (activeTab === 'requests') {
            loadRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, requestFilter]);

    const loadRequests = async () => {
        setLoadingRequests(true);
        try {
            const params = {
                page: 1,
                page_size: 100
            };

            if (requestFilter === 'pending') {
                params.status = REQUEST_STATUS.PENDING;
            } else if (requestFilter === 'in_progress') {
                params.status = REQUEST_STATUS.IN_PROGRESS;
            } else if (requestFilter === 'completed') {
                params.status = REQUEST_STATUS.COMPLETED;
            }

            const data = await requestService.getRequests(params);
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    /* ---------------- USER ACTIONS ---------------- */
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await userService.createUser({
                ...formData,
                role: formData.role.toLowerCase()
            });

            setFormData({
                username: '',
                email: '',
                full_name: '',
                password: '',
                role: 'chemist'
            });

            setShowCreateForm(false);
            loadUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const toggleUserStatus = async (user) => {
        if (user.id === currentUser?.id) {
            alert('You cannot deactivate your own account.');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`
        );

        if (!confirmed) return;

        await userService.updateUser(user.id, {
            is_active: !user.is_active
        });

        loadUsers();
    };

    /* ============================ UI ============================ */
    return (
        <div>
            <Navbar />

            <div className="container">

                {/* ---------------- Tabs ---------------- */}
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

                {/* ================= USERS TAB ================= */}
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
                            <div className="form-card">
                                <h3>Create New User</h3>
                                <form onSubmit={handleCreateUser}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Username *</label>
                                            <input
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Password *</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="chemist">Chemist</option>
                                            <option value="analyst">Analyst</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <button className="btn-primary">Create User</button>
                                </form>
                            </div>
                        )}

                        {loadingUsers ? (
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
                                        {users.map((u) => (
                                            <tr key={u.id}>
                                                <td><strong>{u.username}</strong></td>
                                                <td>{u.full_name}</td>
                                                <td>{u.email}</td>
                                                <td>{u.role}</td>
                                                <td>{u.is_active ? 'Active' : 'Inactive'}</td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn-small" onClick={() => toggleUserStatus(u)}>
                                                        {u.is_active ? 'Deactivate' : 'Activate'}
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

                {/* ================= REQUESTS TAB ================= */}
                {activeTab === 'requests' && (
                    <>
                        <div className="page-header">
                            <h1>Requests</h1>
                            <div className="filter-buttons">
                                {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                                    <button
                                        key={f}
                                        className={`btn-filter ${requestFilter === f ? 'active' : ''}`}
                                        onClick={() => setRequestFilter(f)}
                                    >
                                        {f.replace('_', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingRequests ? (
                            <div className="loading">Loading requests...</div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Request #</th>
                                            <th>Chemist</th>
                                            <th>Compound</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Analyst</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((r) => (
                                            <tr key={r.id}>
                                                <td>{r.request_number}</td>
                                                <td>{r.chemist_name}</td>
                                                <td>{r.compound_name}</td>
                                                <td>{r.status}</td>
                                                <td>{r.priority}</td>
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

                {/* ================= ANALYTICS TAB ================= */}
                {activeTab === 'analytics' && <AnalyticsPanel />}
            </div>
        </div>
    );
}
