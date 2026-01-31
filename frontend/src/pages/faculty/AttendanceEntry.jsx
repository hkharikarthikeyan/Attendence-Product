import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const AttendanceEntry = () => {
    const [classYear, setClassYear] = useState('');
    const [section, setSection] = useState('');
    const [subject, setSubject] = useState('');
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadStudents = async () => {
        if (!classYear || !section) return;
        setLoading(true);
        try {
            const data = await facultyAPI.getStudents(classYear, section);
            setStudents(data.students || []);
            const initialAttendance = {};
            data.students?.forEach(s => { initialAttendance[s.id] = 'present'; });
            setAttendance(initialAttendance);
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
            const entries = Object.entries(attendance).map(([student_id, status]) => ({
                student_id, status
            }));
            await facultyAPI.markAttendance({
                class_year: classYear, section, subject,
                date: new Date().toISOString().split('T')[0],
                entries
            });
            setSuccess('Attendance marked successfully!');
        } catch (err) {
            setError(err.message || 'Failed to mark attendance');
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
                    <h1>Mark Attendance</h1>
                    <p>Select class and mark attendance for students</p>
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
                                <option value="English">English</option>
                            </select>
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
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => (
                                            <tr key={s.id}>
                                                <td>{s.roll_number}</td>
                                                <td>{s.name}</td>
                                                <td>
                                                    <div className="attendance-buttons">
                                                        {['present', 'absent', 'late'].map(status => (
                                                            <button key={status} type="button"
                                                                className={`btn btn-sm ${attendance[s.id] === status ?
                                                                    (status === 'present' ? 'btn-success' : status === 'absent' ? 'btn-danger' : 'btn-warning')
                                                                    : 'btn-secondary'}`}
                                                                onClick={() => setAttendance({ ...attendance, [s.id]: status })}>
                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Attendance'}
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

export default AttendanceEntry;
