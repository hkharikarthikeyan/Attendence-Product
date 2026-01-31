import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../hod/FacultyManagement.css';
import './StudentDashboard.css';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            const data = await studentAPI.getAttendance();
            setAttendance(data);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPercentageColor = (percentage) => {
        if (percentage >= 75) return 'success';
        if (percentage >= 60) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading attendance...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Attendance</h1>
                    <p>View your attendance records and percentages</p>
                </div>
            </header>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>Overall Attendance</h3>
                </div>
                <div className="card-body">
                    <div className="progress-container">
                        <div className="progress-header">
                            <span>Total Attendance</span>
                            <span className={`text-${getPercentageColor(attendance?.overall?.percentage || 0)}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {attendance?.overall?.percentage || 0}%
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: '12px' }}>
                            <div
                                className={`progress-bar-fill ${getPercentageColor(attendance?.overall?.percentage || 0)}`}
                                style={{ width: `${attendance?.overall?.percentage || 0}%` }}
                            ></div>
                        </div>
                        <div className="progress-stats">
                            <span>Present: {attendance?.overall?.present || 0}</span>
                            <span>Absent: {attendance?.overall?.absent || 0}</span>
                            <span>Late: {attendance?.overall?.late || 0}</span>
                            <span>Total Classes: {attendance?.overall?.total_classes || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Subject-wise Breakdown</h3>
                </div>
                <div className="card-body">
                    {attendance?.subject_breakdown?.length > 0 ? (
                        <div className="attendance-table">
                            {attendance.subject_breakdown.map((subject, index) => (
                                <div key={index} className="subject-row">
                                    <span className="subject-name">{subject.subject}</span>
                                    <div className="subject-stats">
                                        <span>{subject.present}/{subject.total}</span>
                                        <span className={`badge badge-${getPercentageColor(subject.percentage)}`}>
                                            {subject.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center">No attendance records found</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
