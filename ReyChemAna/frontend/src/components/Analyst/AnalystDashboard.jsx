/**
 * Analyst Dashboard - main view for analysts
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import StatusBadge from '../Common/StatusBadge';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import {
    REQUEST_STATUS,
    PRIORITY_LABELS,
    PRIORITY_COLORS,
    USER_ROLES
} from '../../utils/constants';

export default function AnalystDashboard() {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        try {
            const params = { page: 1, page_size: 100 };

            if (filter === 'pending') {
                params.status = REQUEST_STATUS.PENDING;
            } else if (filter === 'in_progress') {
                params.status = REQUEST_STATUS.IN_PROGRESS;
            }

            const data = await requestService.getRequests(params);
            setRequests(data.requests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSampleReceived = async (requestId) => {
        try {
            // Optimistic update to UI
            setRequests(prev => prev.map(req => {
                if (req.id === requestId) {
                    return {
                        ...req,
                        status: REQUEST_STATUS.IN_PROGRESS,
                        analyst_id: user.id,
                        analyst_name: user.full_name
                    };
                }
                return req;
            }));

            // API Call
            await requestService.sampleReceived(requestId);

            // Re-fetch to ensure sync with backend (optional but safer)
            loadRequests();

        } catch (error) {
            console.error('Failed to update request status:', error);
            alert('Failed to acknowledge sample. Please try again.');
            // Revert changes on error
            loadRequests();
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div>
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <h1>Analysis Requests</h1>
                    <div className="filter-buttons">
                        <button
                            className={filter === 'all' ? 'btn-filter active' : 'btn-filter'}
                            onClick={() => setFilter('all')}
                        >
                            All Requests
                        </button>
                        <button
                            className={filter === 'pending' ? 'btn-filter active' : 'btn-filter'}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={filter === 'in_progress' ? 'btn-filter active' : 'btn-filter'}
                            onClick={() => setFilter('in_progress')}
                        >
                            In Progress
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <p>No {filter !== 'all' ? filter.replace('_', ' ') + ' ' : ''}requests found.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Request #</th>
                                    <th>Chemist</th>
                                    <th>Compound</th>
                                    <th>Analysis Types</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Analyst</th>
                                    <th>Actions</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr
                                        key={request.id}
                                        onClick={() => navigate(`/analyst/request/${request.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td><strong>{request.request_number}</strong></td>
                                        <td>{request.chemist_name}</td>
                                        <td>{request.compound_name}</td>
                                        <td>
                                            {request.analysis_types.map(at => at.code).join(', ')}
                                        </td>
                                        <td>
                                            <span style={{
                                                color: PRIORITY_COLORS[request.priority],
                                                fontWeight: '500'
                                            }}>
                                                {PRIORITY_LABELS[request.priority]}
                                            </span>
                                        </td>
                                        <td>{formatDate(request.due_date)}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td>{request.analyst_name || '-'}</td>
                                        <td>
                                            {user &&
                                                user.role === USER_ROLES.ANALYST &&
                                                request.status === REQUEST_STATUS.PENDING && (
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSampleReceived(request.id);
                                                        }}
                                                    >
                                                        Sample Received
                                                    </button>
                                                )}
                                        </td>
                                        <td>{formatDate(request.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
