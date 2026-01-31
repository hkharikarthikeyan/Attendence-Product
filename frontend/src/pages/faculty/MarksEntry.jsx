import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const MarksEntry = () => {
    const [classYear, setClassYear] = useState('');
    const [section, setSection] = useState('');
    const [subject, setSubject] = useState('');
    const [examType, setExamType] = useState('internal1');
    const [maxMarks, setMaxMarks] = useState(50);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadStudents = async () => {
        if (!classYear || !section) return;
        setLoading(true);
        try {
            const data = await facultyAPI.getStudents(classYear, section);
            setStudents(data.students || []);
            const initialMarks = {};
            data.students?.forEach(s => { initialMarks[s.id] = ''; });
            setMarks(initialMarks);
        } catch (err) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (classYear && section) loadStudents(); }, [classYear, section]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject) {
            setError('Please select a subject');
            return;
        }
        setLoading(true);
        try {
            const entries = Object.entries(marks)
                .filter(([_, m]) => m !== '')
                .map(([student_id, marks_obtained]) => ({
                    student_id, marks_obtained: parseFloat(marks_obtained)
                }));

            await facultyAPI.enterMarks({
                class_year: classYear, section, subject, exam_type: examType, max_marks: maxMarks, entries
            });
            setSuccess('Marks entered successfully!');
        } catch (err) {
            setError(err.message || 'Failed to enter marks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Enter Marks</h1>
                    <p>Enter marks for students</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-body">
                    <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Class/Year</label>
                            <select className="form-input form-select" value={classYear}
                                onChange={(e) => setClassYear(e.target.value)}>
                                <option value="">Select</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Section</label>
                            <select className="form-input form-select" value={section}
                                onChange={(e) => setSection(e.target.value)}>
                                <option value="">Select</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <select className="form-input form-select" value={subject}
                                onChange={(e) => setSubject(e.target.value)}>
                                <option value="">Select Subject</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Computer Science">Computer Science</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Exam Type</label>
                            <select className="form-input form-select" value={examType}
                                onChange={(e) => setExamType(e.target.value)}>
                                <option value="internal1">Internal 1</option>
                                <option value="internal2">Internal 2</option>
                                <option value="internal3">Internal 3</option>
                                <option value="external">External</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Marks</label>
                            <input type="number" className="form-input" value={maxMarks}
                                onChange={(e) => setMaxMarks(parseInt(e.target.value))} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : students.length > 0 ? (
                        <form onSubmit={handleSubmit}>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Marks (Max: {maxMarks})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => (
                                            <tr key={s.id}>
                                                <td>{s.roll_number}</td>
                                                <td>{s.name}</td>
                                                <td>
                                                    <input type="number" className="form-input" style={{ width: '100px' }}
                                                        min="0" max={maxMarks} value={marks[s.id]}
                                                        onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                                                        placeholder="0" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Marks'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-muted text-center">Select class and section to view students</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarksEntry;
