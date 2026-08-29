import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentsAPI } from '../../services/api';
import './StudentDashboard.css';

const StudentAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingAssignment, setUploadingAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [screening, setScreening] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadAssignments = async () => {
        try {
            const res = await assignmentsAPI.getAssignments();
            if (res.success) {
                const mapped = res.data.map(item => ({
                    id: item.id,
                    title: item.title,
                    subject: item.subjects?.name || item.subject || 'General',
                    deadline: new Date(item.deadline).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }),
                    status: item.status || 'pending',
                    marks: item.marks_obtained !== null && item.marks_obtained !== undefined ? `${item.marks_obtained} / ${item.max_marks}` : '-'
                }));
                setAssignments(mapped);
            }
        } catch (err) {
            setError(err.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    const handleFileSelect = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const submitSolution = async (e) => {
        e.preventDefault();
        if (!file || !user) return;

        setScreening(true);
        setError('');
        setSuccess('');

        // Plagiarism warning check
        if (file.name.toLowerCase().includes('duplicate')) {
            setTimeout(() => {
                setScreening(false);
                setError('Duplicate detection alert: This image submission matches an already uploaded file from another student. Please upload your original work.');
            }, 1000);
            return;
        }

        try {
            // Convert file to Base64 data URL
            const fileBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });

            const res = await assignmentsAPI.submitAssignment(uploadingAssignment.id, user.id, fileBase64);
            if (res.success) {
                setSuccess('Assignment uploaded and submitted successfully! Originality screening passed.');
                setUploadingAssignment(null);
                setFile(null);
                loadAssignments();
            } else {
                setError('Submission failed.');
            }
        } catch (err) {
            setError(err.message || 'Failed to submit assignment');
        } finally {
            setScreening(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: '#1e3a5f', fontSize: '1.75rem', fontWeight: 'bold' }}>My Assignments</h1>
                    <p style={{ color: '#64748b' }}>Submit handwritten assignments and view graded scores</p>
                </div>
            </header>

            {success && <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{success}</div>}
            {error && <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}

            <div className="card">
                <div className="card-header"><h3>List of Assignments</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.length > 0 ? (
                                    assignments.map(ass => (
                                        <tr key={ass.id}>
                                            <td><strong>{ass.title}</strong></td>
                                            <td>{ass.subject}</td>
                                            <td>{ass.deadline}</td>
                                            <td>
                                                <span style={{ 
                                                    color: ass.status === 'evaluated' ? '#22c55e' : ass.status === 'submitted' ? '#0284c7' : '#ef4444',
                                                    backgroundColor: ass.status === 'evaluated' ? '#dcfce7' : ass.status === 'submitted' ? '#e0f2fe' : '#fef2f2',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {ass.status}
                                                </span>
                                            </td>
                                            <td><strong>{ass.marks}</strong></td>
                                            <td>
                                                {ass.status === 'pending' && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => setUploadingAssignment(ass)}>
                                                        Upload Submission
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                            No assignments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {uploadingAssignment && (
                <div className="modal-overlay" onClick={() => setUploadingAssignment(null)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal card" style={{ width: '450px', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Upload Handwritten Assignment</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setUploadingAssignment(null)}>✕</button>
                        </div>
                        <form onSubmit={submitSolution}>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem' }}><strong>Task:</strong> {uploadingAssignment.title}</p>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Upload Image / PDF *</label>
                                    <input type="file" accept="image/*,.pdf" className="form-input" onChange={handleFileSelect} required />
                                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Note: Filename containing "duplicate" triggers duplicate checker alert.</p>
                                </div>
                                {screening && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#14b8a6', fontWeight: 600 }}>
                                        <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                        Running plagiarism screening...
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setUploadingAssignment(null)} disabled={screening}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!file || screening}>Submit Solution</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAssignments;
