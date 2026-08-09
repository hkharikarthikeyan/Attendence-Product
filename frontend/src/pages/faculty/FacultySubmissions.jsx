import { useState } from 'react';
import '../hod/FacultyManagement.css';

const FacultySubmissions = () => {
    const [submissions, setSubmissions] = useState([
        { id: 's1', student_name: 'Alex Johnson', roll: '01', title: 'Calculus Assignment 1', file: 'calculus_alex.jpg', marks: '', status: 'submitted' },
        { id: 's2', student_name: 'Ryan Smith', roll: '03', title: 'Calculus Assignment 1', file: 'calculus_ryan.pdf', marks: '45', status: 'evaluated' },
        { id: 's3', student_name: 'Emma Davis', roll: '02', title: 'Calculus Assignment 1', file: 'calculus_emma.jpg', marks: '', status: 'submitted' }
    ]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [marksInput, setMarksInput] = useState('');
    const [feedback, setFeedback] = useState('');

    const saveEvaluation = () => {
        setSubmissions(submissions.map(sub => {
            if (sub.id === selectedSubmission.id) {
                return { ...sub, marks: marksInput, status: 'evaluated' };
            }
            return sub;
        }));
        setSelectedSubmission(null);
        setMarksInput('');
        setFeedback('');
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Student Assignment Submissions</h1>
                    <p>Review student uploads, check plagiarism/duplicates, and assign marks</p>
                </div>
            </header>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ color: '#64748b' }}>Class Submission Rate</h4>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#1e3a5f', marginTop: '0.5rem' }}>
                            75% <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>(3 of 4 students submitted)</span>
                        </h2>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Submissions List</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Assignment</th>
                                    <th>Uploaded File</th>
                                    <th>Status</th>
                                    <th>Marks</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(sub => (
                                    <tr key={sub.id}>
                                        <td><strong>{sub.student_name}</strong></td>
                                        <td>{sub.roll}</td>
                                        <td>{sub.title}</td>
                                        <td><a href="#" onClick={(e) => { e.preventDefault(); alert(`Viewing file: ${sub.file}`); }} style={{ color: '#14b8a6', textDecoration: 'underline' }}>{sub.file}</a></td>
                                        <td>
                                            <span style={{ 
                                                color: sub.status === 'evaluated' ? '#22c55e' : '#eab308',
                                                backgroundColor: sub.status === 'evaluated' ? '#dcfce7' : '#fef9c3',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td><strong>{sub.marks || '-'}</strong></td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => { setSelectedSubmission(sub); setMarksInput(sub.marks); }}>
                                                Evaluate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedSubmission && (
                <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
                    <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Evaluate Submission</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedSubmission(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '0.5rem' }}><strong>Student:</strong> {selectedSubmission.student_name}</p>
                            <p style={{ marginBottom: '1rem' }}><strong>Assignment:</strong> {selectedSubmission.title}</p>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Marks Obtained (Max 50) *</label>
                                <input type="number" className="form-input" value={marksInput} onChange={(e) => setMarksInput(e.target.value)} max="50" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Feedback</label>
                                <textarea className="form-input" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows="3" placeholder="Enter comments for student..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEvaluation} disabled={!marksInput}>Save Grades</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultySubmissions;
