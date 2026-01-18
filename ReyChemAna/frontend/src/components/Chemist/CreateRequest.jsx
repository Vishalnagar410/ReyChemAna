/**
 * Create Request form for chemists
 * Enhanced with toggle pills, custom analysis, persistence & inline validation
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import requestService from '../../services/requestService';
import { PRIORITY } from '../../utils/constants';
import './CreateRequest.css';

const STORAGE_KEY = 'chemist_last_analysis_types';

export default function CreateRequest() {
    const navigate = useNavigate();

    const [analysisTypes, setAnalysisTypes] = useState([]);
    const [analysisError, setAnalysisError] = useState('');

    const [customAnalysis, setCustomAnalysis] = useState('');

    const [formData, setFormData] = useState({
        compound_name: '',
        analysis_type_ids: [],
        priority: PRIORITY.MEDIUM,
        due_date: '',
        description: '',
        chemist_comments: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ----------------------------------------
       Load Analysis Types + Restore Selection
    -----------------------------------------*/
    useEffect(() => {
        loadAnalysisTypes();
    }, []);

    const loadAnalysisTypes = async () => {
        try {
            const types = await requestService.getAnalysisTypes();
            setAnalysisTypes(types);

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setFormData(prev => ({
                    ...prev,
                    analysis_type_ids: JSON.parse(saved),
                }));
            }
        } catch (err) {
            console.error('Failed to load analysis types', err);
        }
    };

    /* ----------------------------------------
       Handlers
    -----------------------------------------*/
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleAnalysisType = (id) => {
        setAnalysisError('');

        setFormData(prev => {
            const updated = prev.analysis_type_ids.includes(id)
                ? prev.analysis_type_ids.filter(x => x !== id)
                : [...prev.analysis_type_ids, id];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return { ...prev, analysis_type_ids: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setAnalysisError('');

        if (formData.analysis_type_ids.length === 0) {
            setAnalysisError('Please select at least one analysis type');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                chemist_comments: customAnalysis
                    ? `${formData.chemist_comments || ''}\nCustom analysis: ${customAnalysis}`.trim()
                    : formData.chemist_comments,
            };

            await requestService.createRequest(payload);
            navigate('/chemist');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------------------------
       UI
    -----------------------------------------*/
    return (
        <div>
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <h1>Create New Analysis Request</h1>
                </div>

                <form onSubmit={handleSubmit} className="form-card">
                    {error && <div className="error-message">{error}</div>}

                    {/* Compound */}
                    <div className="form-group">
                        <label>Compound Name *</label>
                        <input
                            type="text"
                            name="compound_name"
                            value={formData.compound_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Analysis Types */}
                    <div className="form-group">
                        <label>Analysis Types * (Select at least one)</label>

                        <div className={`pill-grid ${analysisError ? 'pill-error' : ''}`}>
                            {analysisTypes.map(type => (
                                <button
                                    type="button"
                                    key={type.id}
                                    className={`pill ${formData.analysis_type_ids.includes(type.id)
                                            ? 'active'
                                            : ''
                                        }`}
                                    onClick={() => toggleAnalysisType(type.id)}
                                >
                                    <strong>{type.code}</strong>
                                    <span>{type.name}</span>
                                </button>
                            ))}
                        </div>

                        {analysisError && (
                            <div className="field-error">{analysisError}</div>
                        )}
                    </div>

                    {/* Custom Analysis */}
                    <div className="form-group">
                        <label>Other / Custom Analysis (optional)</label>
                        <input
                            type="text"
                            placeholder="Describe custom analysis if required"
                            value={customAnalysis}
                            onChange={(e) => setCustomAnalysis(e.target.value)}
                        />
                    </div>

                    {/* Priority + Date */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Priority *</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                            >
                                <option value={PRIORITY.LOW}>Low</option>
                                <option value={PRIORITY.MEDIUM}>Medium</option>
                                <option value={PRIORITY.HIGH}>High</option>
                                <option value={PRIORITY.URGENT}>Urgent</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Sample Submission Date *</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    {/* Chemist Comments */}
                    <div className="form-group">
                        <label>Chemist Comments</label>
                        <textarea
                            name="chemist_comments"
                            rows="3"
                            value={formData.chemist_comments}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/chemist')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
