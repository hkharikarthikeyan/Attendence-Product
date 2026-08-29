import { useState } from 'react';
import FacultyAssignmentUpload from './FacultyAssignmentUpload';
import FacultySubmissions from './FacultySubmissions';
import '../hod/FacultyManagement.css';

const FacultyAssignments = () => {
    const [activeTab, setActiveTab] = useState('upload');

    return (
        <div>
            <div className="assignment-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('upload')}
                >
                    Upload Assignment
                </button>
                <button
                    className={`btn ${activeTab === 'evaluate' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('evaluate')}
                >
                    Evaluate Assignment
                </button>
            </div>
            {activeTab === 'upload' ? <FacultyAssignmentUpload /> : <FacultySubmissions />}
        </div>
    );
};

export default FacultyAssignments;
