import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const EventsManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', event_date: '', event_type: 'general', image_url: ''
    });
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Only image files (PNG, JPG, JPEG, GIF, WEBP) are allowed');
            return;
        }

        setUploadingImage(true);
        setError('');
        try {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => ({ ...prev, image_url: reader.result }));
                setUploadingImage(false);
            };
            reader.onerror = () => {
                setError('Failed to read image file');
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to process image');
            setUploadingImage(false);
        }
    };
    const [success, setSuccess] = useState('');

    useEffect(() => { 
        loadEvents();
        const interval = setInterval(loadEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadEvents = async () => {
        try {
            const data = await hodAPI.getEvents();
            setEvents(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load events');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingEvent) {
                await hodAPI.updateEvent(editingEvent.id, {
                    ...formData,
                    event_date: new Date(formData.event_date).toISOString(),
                });
                setSuccess('Event updated successfully');
            } else {
                await hodAPI.createEvent({
                    ...formData,
                    event_date: new Date(formData.event_date).toISOString(),
                });
                setSuccess('Event created successfully');
            }
            loadEvents();
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to save event');
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

    const openModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description,
                event_date: new Date(event.event_date).toISOString().slice(0, 16),
                event_type: event.event_type,
                image_url: event.image_url || ''
            });
        } else {
            setEditingEvent(null);
            setFormData({ title: '', description: '', event_date: '', event_type: 'general', image_url: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setFormData({ title: '', description: '', event_date: '', event_type: 'general', image_url: '' });
    };

    const isEventCompleted = (eventDate) => {
        return new Date(eventDate) < new Date();
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
                <button className="btn btn-primary" onClick={() => openModal()}>
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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        onClick={() => openModal(event)}
                                        title="Edit"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={() => handleDelete(event.id)}
                                        title="Delete"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                </div>
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
                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                })}</span>
                                {isEventCompleted(event.event_date) && (
                                    <span className="badge" style={{ background: '#6b7280', marginLeft: '0.5rem' }}>Completed</span>
                                )}
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
                            <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
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
                                <div className="form-group">
                                    <label className="form-label">Event Banner Image</label>
                                    {formData.image_url ? (
                                        <div style={{ position: 'relative', marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <img src={formData.image_url} alt="Event Preview" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                style={{
                                                    position: 'absolute', top: '10px', right: '10px',
                                                    background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                                    border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'background 0.2s'
                                                }}
                                                title="Remove Image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            style={{
                                                border: '2px dashed #cbd5e1',
                                                borderRadius: '8px',
                                                padding: '1.5rem',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                backgroundColor: '#f8fafc',
                                                transition: 'all 0.2s',
                                                marginTop: '0.5rem',
                                                position: 'relative'
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files?.[0];
                                                if (file) {
                                                    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
                                                    if (!validTypes.includes(file.type)) {
                                                        setError('Only image files (PNG, JPG, JPEG, GIF, WEBP) are allowed');
                                                        return;
                                                    }
                                                    setUploadingImage(true);
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setFormData(prev => ({ ...prev, image_url: reader.result }));
                                                        setUploadingImage(false);
                                                    };
                                                    reader.onerror = () => {
                                                        setError('Failed to read image file');
                                                        setUploadingImage(false);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        >
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload} 
                                                style={{
                                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                    opacity: 0, cursor: 'pointer'
                                                }} 
                                                disabled={uploadingImage}
                                            />
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ width: '40px', height: '40px', margin: '0 auto 0.5rem' }}>
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                                                {uploadingImage ? 'Uploading Image...' : 'Click or Drag image here to upload'}
                                            </p>
                                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '4px 0 0' }}>
                                                Supports PNG, JPG, JPEG, WEBP, GIF
                                            </p>
                                        </div>
                                    )}
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
                                <button type="submit" className="btn btn-primary">{editingEvent ? 'Update' : 'Create'} Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsManagement;
