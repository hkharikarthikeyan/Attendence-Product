
import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css'; // Reusing dashboard styles for consistency

const StudentProfileSetup = () => {
    const [formData, setFormData] = useState({
        name: '',
        roll_number: '',
        register_number: '',
        class_year: '',
        section: '',
        batch: '',
        profile_photo: ''
    });
    const [status, setStatus] = useState('initial'); // initial, submitting, pending, approved
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const profile = await studentAPI.getProfile();
            if (profile.approval_status === 'approved') {
                navigate('/student');
            } else if (profile.approval_status === 'pending') {
                setStatus('pending');
                // Pre-fill if they want to edit? For now, just show pending screen.
                setFormData({
                    name: profile.name || '',
                    roll_number: profile.roll_number || '',
                    register_number: profile.register_number || '',
                    class_year: profile.class_year || '',
                    section: profile.section || '',
                    batch: profile.batch || '',
                    profile_photo: profile.profile_photo || ''
                });
            }
        } catch (err) {
            console.error("Error checking status:", err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setError(null);
        try {
            await studentAPI.requestProfileUpdate(formData);
            setStatus('pending');
        } catch (err) {
            setError("Failed to submit profile. Please try again.");
            setStatus('initial');
        }
    };

    if (status === 'pending') {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="login-logo" style={{ margin: '0 auto 1.5rem', background: '#fef3c7', color: '#d97706' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 32, height: 32 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Verification Pending</h2>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                        Your profile details have been submitted and are waiting for HOD approval.
                        You will be able to access the dashboard once approved.
                    </p>
                    <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                        Check Status Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Complete Profile</h1>
                    <p>Enter your academic details to continue</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Register Number</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                name="register_number"
                                value={formData.register_number}
                                onChange={handleChange}
                                placeholder="e.g. 9123456789"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Roll Number</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                name="roll_number"
                                value={formData.roll_number}
                                onChange={handleChange}
                                placeholder="e.g. 20CSE101"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Batch</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                name="batch"
                                value={formData.batch}
                                onChange={handleChange}
                                placeholder="e.g. 2020-2024"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Class Year</label>
                            <select
                                className="form-input"
                                name="class_year"
                                value={formData.class_year}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Section</label>
                            <select
                                className="form-input"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Section</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Profile Photo URL (Optional)</label>
                        <div className="input-wrapper">
                            <input
                                type="url"
                                className="form-input"
                                name="profile_photo"
                                value={formData.profile_photo}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={status === 'submitting'}
                    >
                        {status === 'submitting' ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentProfileSetup;
