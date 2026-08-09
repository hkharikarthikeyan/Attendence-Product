import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { studentAPI } from '../../services/api';
import '../hod/HODDashboard.css';
import './StudentDashboard.css';

const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const menuItems = [
    { path: '/student', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { path: '/student/profile', label: 'My Profile', icon: <UserIcon /> },
    { path: '/student/attendance', label: 'Attendance', icon: <CheckIcon /> },
    { path: '/student/marks', label: 'Marks', icon: <FileIcon /> },
    { path: '/student/assignments', label: 'My Assignments', icon: <FileIcon /> },
    { path: '/student/projects', label: 'My Projects', icon: <FileIcon /> },
    { path: '/student/events', label: 'Events', icon: <CalendarIcon /> },
];

const StudentLayout = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar role="student" menuItems={menuItems} />
            <main className="main-content"><Outlet /></main>
        </div>
    );
};

const StudentDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await studentAPI.getDashboard();
            setDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceColor = (percentage) => {
        if (percentage >= 75) return 'success';
        if (percentage >= 60) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Welcome, {dashboard?.profile?.name || 'Student'}</h1>
                    <p>Track your academic progress and stay updated.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><CheckIcon /></div>
                    <div className="stat-content">
                        <h3>{dashboard?.attendance?.percentage || 0}%</h3>
                        <p>Attendance</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent"><FileIcon /></div>
                    <div className="stat-content">
                        <h3>{dashboard?.marks?.percentage || 0}%</h3>
                        <p>Overall Marks</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sky"><CalendarIcon /></div>
                    <div className="stat-content">
                        <h3>{dashboard?.recent_events?.length || 0}</h3>
                        <p>Upcoming Events</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Attendance Overview</h3></div>
                    <div className="card-body">
                        <div className="progress-container">
                            <div className="progress-header">
                                <span>Overall Attendance</span>
                                <span className={`text-${getAttendanceColor(dashboard?.attendance?.percentage || 0)}`}>
                                    {dashboard?.attendance?.percentage || 0}%
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-bar-fill ${getAttendanceColor(dashboard?.attendance?.percentage || 0)}`}
                                    style={{ width: `${dashboard?.attendance?.percentage || 0}%` }}
                                ></div>
                            </div>
                            <div className="progress-stats">
                                <span>Present: {dashboard?.attendance?.present || 0}</span>
                                <span>Total: {dashboard?.attendance?.total_classes || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Recent Events</h3></div>
                    <div className="card-body">
                        {dashboard?.recent_events?.length > 0 ? (
                            <ul className="event-list">
                                {dashboard.recent_events.map((event) => (
                                    <li key={event.id} className="event-item">
                                        <div className="event-icon"><CalendarIcon /></div>
                                        <div className="event-details">
                                            <h4>{event.title}</h4>
                                            <p>{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center">No upcoming events</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { StudentLayout, StudentDashboard };
export default StudentDashboard;
