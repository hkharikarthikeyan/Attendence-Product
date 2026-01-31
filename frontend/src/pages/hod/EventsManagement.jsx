import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const EventsManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', event_date: '', event_type: 'general',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            const data = await hodAPI.getEvents();
            setEvents(data);
        } catch (err) {
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await hodAPI.createEvent({
                ...formData,
                event_date: new Date(formData.event_date).toISOString(),
            });
            setSuccess('Event created successfully');
            loadEvents();
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to create event');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            await hodAPI.deleteEvent(id);
            setSuccess('Event deleted successfully');
            loadEvents();
        } catch (err) {
            setError(err.message || 'Failed to delete event');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ title: '', description: '', event_date: '', event_type: 'general' });
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

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
                    <h1>Events Management</h1>
                    <p>Create and manage department events</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Event
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="events-grid">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <span className={`badge ${getEventTypeColor(event.event_type)}`}>
                                    {event.event_type}
                                </span>
                                <button
                                    className="btn btn-icon btn-danger"
                                    onClick={() => handleDelete(event.id)}
                                    title="Delete"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
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
                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
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
                        <p>No events created yet</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Event</h3>
                            <button className="btn btn-icon" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Event Title *</label>
                                    <input type="text" className="form-input" value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea className="form-input" rows="3" value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Event Date *</label>
                                        <input type="datetime-local" className="form-input" value={formData.event_date}
                                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Event Type</label>
                                        <select className="form-input form-select" value={formData.event_type}
                                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}>
                                            <option value="general">General</option>
                                            <option value="academic">Academic</option>
                                            <option value="cultural">Cultural</option>
                                            <option value="sports">Sports</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsManagement;
