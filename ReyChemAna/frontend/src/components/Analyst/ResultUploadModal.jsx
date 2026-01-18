/**
 * ResultUploadModal
 * Enhanced modal with drag & drop, preview chips, progress bar
 * Option-A: Chemist comments shown inline (read-only)
 */
import { useState, useEffect } from 'react';
import requestService from '../../services/requestService';
import './ResultUploadModal.css';

export default function ResultUploadModal({ request, onClose, onSuccess }) {
    const [files, setFiles] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
        document.body.style.overflow = 'hidden';
        return () => (document.body.style.overflow = 'auto');
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 200);
    };

    const handleFilesAdd = (newFiles) => {
        const uniqueFiles = [...files];
        newFiles.forEach(file => {
            if (!uniqueFiles.some(f => f.name === file.name && f.size === file.size)) {
                uniqueFiles.push(file);
            }
        });
        setFiles(uniqueFiles);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        handleFilesAdd(Array.from(e.dataTransfer.files));
    };

    const handleSubmit = async () => {
        if (!remarks.trim()) {
            alert('Remarks are mandatory');
            return;
        }
        if (files.length === 0) {
            alert('Please upload at least one result file');
            return;
        }

        try {
            setSubmitting(true);
            setProgress(10);

            await requestService.uploadFiles(request.id, files, (p) => {
                setProgress(p);
            });

            setProgress(85);

            await requestService.updateRequest(request.id, {
                status: 'completed',
                analyst_comments: remarks
            });

            setProgress(100);
            onSuccess();
            handleClose();

        } catch (err) {
            console.error(err);
            alert('Result upload failed');
        } finally {
            setSubmitting(false);
            setProgress(0);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className={`modal-card ${visible ? 'modal-show' : ''}`}>
                <div className="modal-header">
                    <h3>Upload Analysis Results</h3>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                <div className="modal-body">

                    {/* ===============================
                        Chemist Context (READ-ONLY)
                       =============================== */}
                    {request.chemist_comments && (
                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '16px'
                            }}
                        >
                            <label
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    display: 'block',
                                    marginBottom: '4px'
                                }}
                            >
                                Chemist Comments
                            </label>
                            <div
                                style={{
                                    fontSize: '0.9rem',
                                    color: '#111827',
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {request.chemist_comments}
                            </div>
                        </div>
                    )}

                    {/* ===============================
                        Drag & Drop Upload
                       =============================== */}
                    <div
                        className={`drop-zone ${dragActive ? 'active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                    >
                        <p>Drag & drop result files here</p>
                        <span>or</span>
                        <label className="file-btn">
                            Browse Files
                            <input
                                type="file"
                                multiple
                                hidden
                                accept=".pdf,.xls,.xlsx,.csv,image/*"
                                onChange={(e) => handleFilesAdd(Array.from(e.target.files))}
                            />
                        </label>
                    </div>

                    {/* File chips */}
                    {files.length > 0 && (
                        <div className="file-chips">
                            {files.map((file, idx) => (
                                <span key={idx} className="file-chip">
                                    {file.name}
                                    <button onClick={() =>
                                        setFiles(files.filter((_, i) => i !== idx))
                                    }>×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Analyst Remarks */}
                    <div className="form-group">
                        <label>Analyst Remarks *</label>
                        <textarea
                            rows={4}
                            value={remarks}
                            placeholder="e.g. 95% pure, data compiled, sample not soluble..."
                            onChange={(e) => setRemarks(e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    {/* Progress bar */}
                    {submitting && (
                        <div className="progress-bar">
                            <div style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Uploading…' : 'Submit & Complete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
