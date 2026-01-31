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

            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={`badge ${getEventTypeColor(event.event_type)}`}>
                                    {event.event_type}
                                </span>
                            </div>
                            <h3 style={{ marginBottom: '0.5rem' }}>{event.title}</h3>
                            <p style={{ color: 'var(--color-gray-600)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {event.description}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{new Date(event.event_date).toLocaleDateString('en-US', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <p className="text-muted">No events available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentEvents;
