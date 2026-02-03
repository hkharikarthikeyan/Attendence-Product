import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const AttendanceEntry = () => {
    const [classYear, setClassYear] = useState('');
    const [section, setSection] = useState('');
    const [subject, setSubject] = useState('');
    const [batch, setBatch] = useState('');
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Load batches when class and section change
    useEffect(() => {
        if (classYear && section) {
            loadBatches();
        }
    }, [classYear, section]);

    const loadBatches = async () => {
        try {
            const data = await facultyAPI.getBatches(classYear, section);
            setBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        }
    };

    const loadStudents = async () => {
        if (!classYear || !section) return;
        setLoading(true);
        setError('');
        try {
            console.log('Loading students for:', { classYear, section, batch });
            const data = batch
                ? await facultyAPI.getStudentsByBatch(classYear, section, batch)
                : await facultyAPI.getStudents(classYear, section);
            console.log('Students loaded:', data);
            setStudents(data.students || []);
            const initialAttendance = {};
            data.students?.forEach(s => { initialAttendance[s.id] = 'present'; });
            setAttendance(initialAttendance);
        } catch (err) {
            console.error('Error loading students:', err);
            setError('Failed to load students: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load students when required fields are filled
    useEffect(() => {
        if (classYear && section && subject) {
            loadStudents();
        }
    }, [classYear, section, subject, batch]);

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
                        {batches.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">Batch (Optional)</label>
                                <select className="form-input form-select" value={batch}
                                    onChange={(e) => setBatch(e.target.value)}>
                                    <option value="">All Students</option>
                                    {batches.map((b, i) => (
                                        <option key={i} value={b.batch}>{b.batch} ({b.count})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={loadStudents}
                            disabled={!classYear || !section || !subject}
                        >
                            Refresh Students
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : students.length > 0 ? (
                        <>
                            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Instructions:</h4>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                    ✅ Check <strong style={{ color: '#22c55e' }}>Present</strong> for students who are in class<br/>
                                    ❌ Check <strong style={{ color: '#ef4444' }}>Absent</strong> for students who are not in class
                                </p>
                            </div>
                            <form onSubmit={handleSubmit}>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Register No</th>
                                            <th style={{ textAlign: 'center' }}>Present</th>
                                            <th style={{ textAlign: 'center' }}>Absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => (
                                            <tr key={s.id}>
                                                <td>{s.roll_number}</td>
                                                <td>{s.name}</td>
                                                <td>{s.register_number}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={attendance[s.id] === 'present'}
                                                        onChange={() => setAttendance({ ...attendance, [s.id]: 'present' })}
                                                        style={{ 
                                                            width: '20px', 
                                                            height: '20px', 
                                                            accentColor: '#22c55e',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={attendance[s.id] === 'absent'}
                                                        onChange={() => setAttendance({ ...attendance, [s.id]: 'absent' })}
                                                        style={{ 
                                                            width: '20px', 
                                                            height: '20px', 
                                                            accentColor: '#ef4444',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
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
                        </>
                    ) : (
                        <p className="text-muted text-center">Select class and section to view students</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceEntry;
