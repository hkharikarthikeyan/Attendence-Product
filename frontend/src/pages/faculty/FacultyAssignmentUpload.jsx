import { useEffect, useState } from 'react';
import { assignmentsAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const FacultyAssignmentUpload = () => {
    const [form, setForm] = useState({
        title: '', description: '', class_year: '', section: '', subject: '',
        deadline: '', max_marks: 50
    });
    const [studentCount, setStudentCount] = useState(null);
    const [postedAssignments, setPostedAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!form.class_year || !form.section) {
            setStudentCount(null);
            return;
        }
        assignmentsAPI.getClassStudentCount(form.class_year, form.section)
            .then((result) => setStudentCount(result.count || 0))
            .catch((err) => setError(err.message || 'Failed to load student count'));
    }, [form.class_year, form.section]);

    const updateField = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await assignmentsAPI.createAssignment({ ...form, max_marks: Number(form.max_marks) });
            setSuccess('Assignment posted. Students in the selected class can now view it.');
            await loadPostedAssignments();
            setForm({ title: '', description: '', class_year: '', section: '', subject: '', deadline: '', max_marks: 50 });
            setStudentCount(null);
        } catch (err) {
            setError(err.message || 'Failed to post assignment');
        } finally {
            setLoading(false);
        }
    };

    const loadPostedAssignments = async () => {
        try {
            const response = await assignmentsAPI.getAssignments();
            setPostedAssignments(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load posted assignments');
        }
    };

    useEffect(() => {
        loadPostedAssignments();
    }, []);

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Upload Assignment</h1>
                    <p>Post work for a specific year, section, and subject</p>
                </div>
            </header>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="toast toast-success">{success}</div>}
            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="filters-bar">
                            <div className="form-group">
                                <label className="form-label">Class/Year *</label>
                                <select className="form-input form-select" name="class_year" value={form.class_year} onChange={updateField} required>
                                    <option value="">Select</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Section *</label>
                                <select className="form-input form-select" name="section" value={form.section} onChange={updateField} required>
                                    <option value="">Select</option>
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <select className="form-input form-select" name="subject" value={form.subject} onChange={updateField} required>
                                    <option value="">Select Subject</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Physics">Physics</option>
                                    <option value="Chemistry">Chemistry</option>
                                    <option value="Computer Science">Computer Science</option>
                                </select>
                            </div>
                        </div>
                        {studentCount !== null && <p style={{ marginBottom: '1.5rem', color: '#1e3a5f', fontWeight: 600 }}>{studentCount} student(s) will receive this assignment.</p>}
                        <div className="form-group">
                            <label className="form-label">Assignment Title *</label>
                            <input className="form-input" name="title" value={form.title} onChange={updateField} required placeholder="e.g. Unit 1 Problem Set" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" name="description" value={form.description} onChange={updateField} rows="4" placeholder="Instructions for students" />
                        </div>
                        <div className="filters-bar">
                            <div className="form-group">
                                <label className="form-label">Deadline *</label>
                                <input type="datetime-local" className="form-input" name="deadline" value={form.deadline} onChange={updateField} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Maximum Marks *</label>
                                <input type="number" min="1" className="form-input" name="max_marks" value={form.max_marks} onChange={updateField} required />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Assignment'}</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header"><h3>Posted Assignments</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr><th>Title</th><th>Class</th><th>Section</th><th>Subject</th><th>Deadline</th><th>Max Marks</th></tr>
                            </thead>
                            <tbody>
                                {postedAssignments.length > 0 ? postedAssignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td><strong>{assignment.title}</strong></td>
                                        <td>{assignment.class_year}</td>
                                        <td>{assignment.section}</td>
                                        <td>{assignment.subjects?.name || assignment.subject || 'General'}</td>
                                        <td>{new Date(assignment.deadline).toLocaleString()}</td>
                                        <td>{assignment.max_marks}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center text-muted">No assignments posted yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyAssignmentUpload;
