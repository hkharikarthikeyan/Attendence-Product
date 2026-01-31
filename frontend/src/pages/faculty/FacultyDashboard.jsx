import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { facultyAPI } from '../../services/api';
import '../hod/HODDashboard.css';

const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
    { path: '/faculty', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { path: '/faculty/attendance', label: 'Mark Attendance', icon: <CheckIcon /> },
    { path: '/faculty/marks', label: 'Enter Marks', icon: <EditIcon /> },
    { path: '/faculty/events', label: 'Events', icon: <CalendarIcon /> },
];

const FacultyLayout = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar role="faculty" menuItems={menuItems} />
            <main className="main-content"><Outlet /></main>
        </div>
    );
};

const FacultyDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [profileData, eventsData] = await Promise.all([
                facultyAPI.getProfile(),
                facultyAPI.getEvents(),
            ]);
            setProfile(profileData);
            setEvents(eventsData.events?.slice(0, 5) || []);
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
                    <h1>Welcome, {profile?.name || 'Faculty'}</h1>
                    <p>Here's your dashboard overview for today.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><CheckIcon /></div>
                    <div className="stat-content">
                        <h3>Today</h3>
                        <p>Mark Attendance</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent"><EditIcon /></div>
                    <div className="stat-content">
                        <h3>Pending</h3>
                        <p>Marks Entry</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sky"><CalendarIcon /></div>
                    <div className="stat-content">
                        <h3>{events.length}</h3>
                        <p>Upcoming Events</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Quick Actions</h3></div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <a href="/faculty/attendance" className="action-btn">
                                <CheckIcon /><span>Mark Attendance</span>
                            </a>
                            <a href="/faculty/marks" className="action-btn">
                                <EditIcon /><span>Enter Marks</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Recent Events</h3></div>
                    <div className="card-body">
                        {events.length > 0 ? (
                            <ul className="event-list">
                                {events.map((event) => (
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
                            <p className="text-muted text-center">No events</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { FacultyLayout, FacultyDashboard };
export default FacultyDashboard;
