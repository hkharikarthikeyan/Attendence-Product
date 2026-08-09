import { useState } from 'react';
import './StudentDashboard.css';

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([
        { id: '1', title: 'Calculus Assignment 1', subject: 'Mathematics', deadline: '2026-08-15', status: 'pending', marks: '-' },
        { id: '2', title: 'Data Structures Lab 2', subject: 'Computer Science', deadline: '2026-08-20', status: 'submitted', marks: '-' },
        { id: '3', title: 'Physics Essay 1', subject: 'Physics', deadline: '2026-08-01', status: 'evaluated', marks: '42 / 50' }
    ]);
    const [uploadingAssignment, setUploadingAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [screening, setScreening] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileSelect = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const submitSolution = (e) => {
        e.preventDefault();
        if (!file) return;

        setScreening(true);
        setError('');

        // Simulate plagiarism duplicate screening
        setTimeout(() => {
            setScreening(false);
            
            // Mock condition: if the student uploads a file containing "duplicate" in the name, trigger plagiarism warning
            if (file.name.toLowerCase().includes('duplicate')) {
                setError('Duplicate detection alert: This image submission matches an already uploaded file from another student. Please upload your original work.');
                return;
            }

            setAssignments(assignments.map(ass => {
                if (ass.id === uploadingAssignment.id) {
                    return { ...ass, status: 'submitted' };
                }
                return ass;
            }));
            
            setSuccess('Assignment uploaded and submitted successfully! Originality screening passed.');
            setUploadingAssignment(null);
            setFile(null);
        }, 1500);
    };

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
                                {assignments.map(ass => (
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
                                ))}
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
                    <div className="modal card" style={{ width: '450px', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Upload Handwritten Assignment</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setUploadingAssignment(null)}>✕</button>
                        </div>
                        <form onSubmit={submitSolution}>
                            <div className="card-body">
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
                            <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
