import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const StudentEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await studentAPI.getEvents();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'academic': return 'badge-info';
            case 'cultural': return 'badge-success';
            case 'sports': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading events...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Events</h1>
                    <p>Stay updated with department events</p>
                </div>
            </header>

            <div className="events-grid">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <span className={`badge ${getEventTypeColor(event.event_type)}`}>
                                    {event.event_type}
                                </span>
                            </div>
                            {event.image_url && (
                                <div className="event-image-container" style={{ margin: '0.75rem 0', borderRadius: '6px', overflow: 'hidden', height: '140px' }}>
                                    <img
                                        src={event.image_url.startsWith('http') ? event.image_url : `http://localhost:8000${event.image_url}`}
                                        alt={event.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            <h3>{event.title}</h3>
                            <p className="event-description">{event.description}</p>
                            <div className="event-meta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{new Date(event.event_date).toLocaleDateString('en-US', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <p>No events available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentEvents;
