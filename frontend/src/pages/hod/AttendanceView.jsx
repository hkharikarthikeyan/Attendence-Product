import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const AttendanceView = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ class_year: '', section: '' });
    const [error, setError] = useState('');

    const loadAttendanceReport = async () => {
        if (!filters.class_year || !filters.section) return;
        setLoading(true);
        setError('');
        try {
            const data = await hodAPI.getAttendanceReport(filters);
            setAttendanceData(data.report || []);
        } catch (err) {
            setError('Failed to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Attendance Report</h1>
                    <p>View attendance statistics for all students</p>
                </div>
            </header>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-body">
                    <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Class/Year</label>
                            <select
                                className="form-input form-select"
                                value={filters.class_year}
                                onChange={(e) => setFilters({ ...filters, class_year: e.target.value })}
                            >
                                <option value="">Select</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Section</label>
                            <select
                                className="form-input form-select"
                                value={filters.section}
                                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                            >
                                <option value="">Select</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={loadAttendanceReport}
                            disabled={!filters.class_year || !filters.section || loading}
                        >
                            {loading ? 'Loading...' : 'Load Report'}
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : attendanceData.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Register No</th>
                                        <th>Total Classes</th>
                                        <th>Present</th>
                                        <th>Absent</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((student) => (
                                        <tr key={student.student_id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">{student.name.charAt(0)}</div>
                                                    <span>{student.name}</span>
                                                </div>
                                            </td>
                                            <td>{student.register_number}</td>
                                            <td>{student.total_classes}</td>
                                            <td style={{ color: '#22c55e', fontWeight: 'bold' }}>{student.present}</td>
                                            <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{student.absent}</td>
                                            <td>
                                                <span style={{ 
                                                    color: student.percentage >= 75 ? '#22c55e' : '#ef4444',
                                                    fontWeight: 'bold',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: student.percentage >= 75 ? '#dcfce7' : '#fef2f2'
                                                }}>
                                                    {student.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center">Select class and section to view attendance report</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceView;