import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../hod/FacultyManagement.css';
import './StudentDashboard.css';

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await studentAPI.getProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>View your personal and academic information</p>
                </div>
            </header>

            <div className="profile-card">
                <div className="profile-avatar">
                    {profile?.name?.charAt(0) || 'S'}
                </div>
                <div className="profile-info">
                    <h2>{profile?.name}</h2>
                    <p>{profile?.email}</p>
                    <p>{profile?.register_number} • {profile?.class_year} {profile?.section}</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Personal Information</h3>
                </div>
                <div className="card-body">
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Full Name</label>
                            <span>{profile?.name || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Register Number</label>
                            <span>{profile?.register_number || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Roll Number</label>
                            <span>{profile?.roll_number || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Email</label>
                            <span>{profile?.email || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Mobile</label>
                            <span>{profile?.mobile || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Class/Year</label>
                            <span>{profile?.class_year || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Section</label>
                            <span>{profile?.section || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Batch</label>
                            <span>{profile?.batch || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Father's Name</label>
                            <span>{profile?.father_name || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>Mother's Name</label>
                            <span>{profile?.mother_name || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
