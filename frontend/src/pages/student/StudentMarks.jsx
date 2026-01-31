import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../hod/FacultyManagement.css';
import './StudentDashboard.css';

const StudentMarks = () => {
    const [marks, setMarks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarks();
    }, []);

    const loadMarks = async () => {
        try {
            const data = await studentAPI.getMarks();
            setMarks(data);
        } catch (error) {
            console.error('Failed to load marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'info';
        if (percentage >= 60) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading marks...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Marks</h1>
                    <p>View your academic performance</p>
                </div>
            </header>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>Overall Performance</h3>
                </div>
                <div className="card-body">
                    <div className="progress-container">
                        <div className="progress-header">
                            <span>Total Marks</span>
                            <span className={`text-${getGradeColor(marks?.overall?.percentage || 0)}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {marks?.overall?.percentage || 0}%
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: '12px' }}>
                            <div
                                className={`progress-bar-fill ${getGradeColor(marks?.overall?.percentage || 0)}`}
                                style={{ width: `${marks?.overall?.percentage || 0}%` }}
                            ></div>
                        </div>
                        <div className="progress-stats">
                            <span>Obtained: {marks?.overall?.total_obtained || 0}</span>
                            <span>Maximum: {marks?.overall?.total_max || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Subject-wise Marks</h3>
                </div>
                <div className="card-body">
                    {marks?.subject_breakdown?.length > 0 ? (
                        <div className="marks-table">
                            {marks.subject_breakdown.map((subject, index) => (
                                <div key={index} className="subject-card" style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <span className="subject-name" style={{ fontWeight: 600 }}>{subject.subject}</span>
                                        <span className={`badge badge-${getGradeColor(subject.percentage)}`}>
                                            {subject.percentage}%
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                                        {subject.exams?.map((exam, i) => (
                                            <span key={i}>
                                                {exam.exam_type}: {exam.marks_obtained}/{exam.max_marks}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center">No marks records found</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentMarks;
