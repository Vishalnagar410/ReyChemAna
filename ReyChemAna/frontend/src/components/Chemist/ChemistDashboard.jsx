/**
 * Chemist Dashboard - main view for chemists
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import StatusBadge from '../Common/StatusBadge';
import RequestDetailsModal from '../Common/RequestDetailsModal';
import requestService from '../../services/requestService';
import {
    REQUEST_STATUS,
    PRIORITY_LABELS,
    PRIORITY_COLORS
} from '../../utils/constants';

export default function ChemistDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewRequestId, setViewRequestId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        try {
            const params = { page: 1, page_size: 50 };

            if (filter !== 'all') {
                params.status = filter;
            }

            const data = await requestService.getRequests(params);
            setRequests(data.requests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div>
            <Navbar />
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1>My Analysis Requests</h1>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/chemist/create-request')}
                    >
                        + New Request
                    </button>
                </div>

                {/* Filters */}
                <div className="filter-buttons" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button
                        className={filter === 'all' ? 'btn-filter active' : 'btn-filter'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === REQUEST_STATUS.PENDING ? 'btn-filter active' : 'btn-filter'}
                        onClick={() => setFilter(REQUEST_STATUS.PENDING)}
                    >
                        Pending
                    </button>
                    <button
                        className={filter === REQUEST_STATUS.IN_PROGRESS ? 'btn-filter active' : 'btn-filter'}
                        onClick={() => setFilter(REQUEST_STATUS.IN_PROGRESS)}
                    >
                        In Progress
                    </button>
                    <button
                        className={filter === REQUEST_STATUS.COMPLETED ? 'btn-filter active' : 'btn-filter'}
                        onClick={() => setFilter(REQUEST_STATUS.COMPLETED)}
                    >
                        Completed
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <p>No requests found.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Request #</th>
                                    <th>Compound</th>
                                    <th>Analysis Types</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Analyst</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr
                                        key={request.id}
                                        onClick={() => setViewRequestId(request.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td><strong>{request.request_number}</strong></td>
                                        <td>{request.compound_name}</td>
                                        <td>{request.analysis_types.map(at => at.code).join(', ')}</td>
                                        <td>
                                            <span
                                                style={{
                                                    color: PRIORITY_COLORS[request.priority],
                                                    fontWeight: 500
                                                }}
                                            >
                                                {PRIORITY_LABELS[request.priority]}
                                            </span>
                                        </td>
                                        <td>{formatDate(request.due_date)}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td>{request.analyst_name || '-'}</td>
                                        <td>{formatDate(request.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Request Details Modal (Download enabled) */}
            {viewRequestId && (
                <RequestDetailsModal
                    requestId={viewRequestId}
                    onClose={() => setViewRequestId(null)}
                />
            )}
        </div>
    );
}
