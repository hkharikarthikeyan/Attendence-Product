import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { hodAPI } from '../../services/api';
import './HODDashboard.css';

const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const GraduationIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ReportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const menuItems = [
    { path: '/hod', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { path: '/hod/faculty', label: 'Faculty Management', icon: <UsersIcon /> },
    { path: '/hod/students', label: 'Student Management', icon: <GraduationIcon /> },
    { path: '/hod/assignments', label: 'Assignment Tracking', icon: <FileIcon /> },
    { path: '/hod/projects', label: 'Project Allocation', icon: <FileIcon /> },
    { path: '/hod/events', label: 'Events', icon: <CalendarIcon /> },
    { path: '/hod/leaves', label: 'Leave Approvals', icon: <FileIcon /> },
    { path: '/hod/reports', label: 'Reports', icon: <ReportIcon /> },
];

const HODLayout = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar role="hod" menuItems={menuItems} />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

const HODDashboard = () => {
    const [stats, setStats] = useState({
        totalFaculty: 0,
        totalStudents: 0,
        totalEvents: 0,
        avgAttendance: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentEvents, setRecentEvents] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [facultyData, studentsData, eventsData] = await Promise.all([
                hodAPI.getFaculty(),
                hodAPI.getStudents(),
                hodAPI.getEvents(),
            ]);

            setStats({
                totalFaculty: facultyData.length,
                totalStudents: studentsData.length,
                totalEvents: eventsData.length,
                avgAttendance: 85, // Placeholder
            });

            setRecentEvents(eventsData.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
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
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's an overview of your department.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <UsersIcon />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalFaculty}</h3>
                        <p>Total Faculty</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon accent">
                        <GraduationIcon />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalStudents}</h3>
                        <p>Total Students</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon sky">
                        <CalendarIcon />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalEvents}</h3>
                        <p>Active Events</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <ReportIcon />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.avgAttendance}%</h3>
                        <p>Avg Attendance</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Events</h3>
                    </div>
                    <div className="card-body">
                        {recentEvents.length > 0 ? (
                            <ul className="event-list">
                                {recentEvents.map((event) => (
                                    <li key={event.id} className="event-item">
                                        <div className="event-icon">
                                            <CalendarIcon />
                                        </div>
                                        <div className="event-details">
                                            <h4>{event.title}</h4>
                                            <p>{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`badge badge-${event.event_type === 'academic' ? 'info' : 'success'}`}>
                                            {event.event_type}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center">No events yet</p>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <a href="/hod/faculty" className="action-btn">
                                <UsersIcon />
                                <span>Add Faculty</span>
                            </a>
                            <a href="/hod/students" className="action-btn">
                                <GraduationIcon />
                                <span>Add Student</span>
                            </a>
                            <a href="/hod/events" className="action-btn">
                                <CalendarIcon />
                                <span>Create Event</span>
                            </a>
                            <a href="/hod/reports" className="action-btn">
                                <ReportIcon />
                                <span>View Reports</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { HODLayout, HODDashboard };
export default HODDashboard;
