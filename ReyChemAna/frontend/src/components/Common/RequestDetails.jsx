/**
 * Request Details component
 * Shared view for Chemists and Analysts
 * Handles result upload and auto-completion for Analysts
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import StatusBadge from '../Common/StatusBadge';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import {
    REQUEST_STATUS,
    USER_ROLES,
    PRIORITY_LABELS,
    PRIORITY_COLORS
} from '../../utils/constants';

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadRequest();
    }, [id]);

    const loadRequest = async () => {
        try {
            setLoading(true);
            const data = await requestService.getRequest(id);
            setRequest(data);
        } catch (error) {
            console.error('Error loading request:', error);
            setError('Failed to load request details');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        setSelectedFiles(Array.from(e.target.files));
        setError('');
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select files to upload');
            return;
        }

        try {
            setUploading(true);
            setError('');

            // 1. Upload Files
            await requestService.uploadFiles(id, selectedFiles);

            // 2. Auto-complete request
            await requestService.updateRequest(id, {
                status: REQUEST_STATUS.COMPLETED
            });

            setSuccessMsg('Results uploaded and request completed successfully!');
            setSelectedFiles([]);

            // 3. Refresh data
            loadRequest();

        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload files. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            await requestService.downloadFile(file.id, file.filename);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!request) return <div className="container"><p className="error-message">Request not found</p></div>;

    const isAnalyst = user?.role === USER_ROLES.ANALYST;
    const canUpload = isAnalyst && request.status === REQUEST_STATUS.IN_PROGRESS;

    return (
        <div>
            <Navbar />
            <div className="container">
                <button
                    className="btn-link mb-4"
                    onClick={() => navigate(-1)}
                >
                    &larr; Back to Dashboard
                </button>

                <div className="card">
                    <div className="card-header">
                        <div className="header-content">
                            <h1>{request.request_number}</h1>
                            <StatusBadge status={request.status} />
                        </div>
                        <div className="meta-info">
                            <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                            <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}
                        {successMsg && <div className="alert alert-success">{successMsg}</div>}

                        <div className="details-grid">
                            <div className="detail-group">
                                <label>Compound Name</label>
                                <p>{request.compound_name}</p>
                            </div>

                            <div className="detail-group">
                                <label>Priority</label>
                                <span style={{
                                    color: PRIORITY_COLORS[request.priority],
                                    fontWeight: 'bold'
                                }}>
                                    {PRIORITY_LABELS[request.priority]}
                                </span>
                            </div>

                            <div className="detail-group">
                                <label>Analysis Types</label>
                                <div className="tags">
                                    {request.analysis_types.map(at => (
                                        <span key={at.id} className="tag">{at.code}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-group">
                                <label>Chemist</label>
                                <p>{request.chemist_name}</p>
                            </div>

                            <div className="detail-group">
                                <label>Assigned Analyst</label>
                                <p>{request.analyst_name || 'Unassigned'}</p>
                            </div>
                        </div>

                        <div className="description-section mt-4">
                            <label>Description</label>
                            <p>{request.description || 'No description provided.'}</p>
                        </div>

                        {request.chemist_comments && (
                            <div className="comments-section mt-4">
                                <label>Chemist Comments</label>
                                <p>{request.chemist_comments}</p>
                            </div>
                        )}

                        <hr className="divider" />

                        {/* Result Section */}
                        <div className="results-section mt-6">
                            <h2>Results &amp; Files</h2>

                            {/* File List (Read-Only) */}
                            {request.result_files && request.result_files.length > 0 ? (
                                <div className="file-list">
                                    {request.result_files.map(file => (
                                        <div key={file.id} className="file-item">
                                            <span className="file-name">{file.filename}</span>
                                            <span className="file-size">({(file.file_size / 1024).toFixed(1)} KB)</span>
                                            <button
                                                className="btn-sm btn-outline"
                                                onClick={() => handleDownload(file)}
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No results uploaded yet.</p>
                            )}

                            {/* Upload Control (Analyst Only) */}
                            {canUpload && (
                                <div className="upload-box mt-4">
                                    <h3>Upload Results</h3>
                                    <p className="text-sm text-muted mb-2">
                                        Uploading files will automatically mark the request as COMPLETED.
                                    </p>

                                    <div className="upload-controls">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileSelect}
                                            disabled={uploading}
                                            className="file-input"
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={handleUpload}
                                            disabled={uploading || selectedFiles.length === 0}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload & Complete'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Completion Message */}
                            {request.status === REQUEST_STATUS.COMPLETED && (
                                <div className="completion-info mt-4">
                                    <p className="text-success">
                                        ✓ Request completed on {new Date(request.completed_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
