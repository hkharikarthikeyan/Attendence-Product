// ==========================================
// API Service - Direct Backend Integration
// ==========================================

const API_BASE_URL = 'http://localhost:8000/api';

const getToken = () => {
    const activeSession = sessionStorage.getItem('active_session');
    if (activeSession) {
        try {
            const parsed = JSON.parse(activeSession);
            if (parsed?.access_token) {
                return parsed.access_token;
            }
        } catch {
            // ignore malformed session data and fall back to the legacy single-token value
        }
    }
    return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:8000');
        }
        throw error;
    }
};

// Auth API
export const authAPI = {
    login: async (email, password, role) => {
        return fetchWithAuth('/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ email, password, role }) 
        });
    },
    logout: async () => {
        return fetchWithAuth('/auth/logout', { method: 'POST' });
    },
};

// HOD API
export const hodAPI = {
    // Faculty
    getFaculty: async () => {
        return fetchWithAuth('/hod/faculty');
    },
    createFaculty: async (data) => {
        return fetchWithAuth('/hod/faculty', { method: 'POST', body: JSON.stringify(data) });
    },
    updateFaculty: async (id, data) => {
        return fetchWithAuth(`/hod/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteFaculty: async (id) => {
        return fetchWithAuth(`/hod/faculty/${id}`, { method: 'DELETE' });
    },

    // Students
    getStudents: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const data = await fetchWithAuth(`/hod/students${params ? `?${params}` : ''}`);
        return data.students || data;
    },
    createStudent: async (data) => {
        return fetchWithAuth('/hod/students', { method: 'POST', body: JSON.stringify(data) });
    },
    updateStudent: async (id, data) => {
        return fetchWithAuth(`/hod/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteStudent: async (id) => {
        return fetchWithAuth(`/hod/students/${id}`, { method: 'DELETE' });
    },

    // Events
    getEvents: async () => {
        return fetchWithAuth('/hod/events');
    },
    createEvent: async (data) => {
        return fetchWithAuth('/hod/events', { method: 'POST', body: JSON.stringify(data) });
    },
    updateEvent: async (id, data) => {
        return fetchWithAuth(`/hod/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteEvent: async (id) => {
        return fetchWithAuth(`/hod/events/${id}`, { method: 'DELETE' });
    },


    // Reports
    getAttendanceReport: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchWithAuth(`/hod/reports/attendance${params ? `?${params}` : ''}`);
    },
    getPerformanceReport: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchWithAuth(`/hod/reports/performance${params ? `?${params}` : ''}`);
    },

    // Leave Management
    getFacultyLeaves: async () => {
        return fetchWithAuth('/hod/faculty-leaves');
    },
    updateLeaveStatus: async (id, data) => {
        return fetchWithAuth(`/hod/faculty-leaves/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    getStudentLeaves: async () => {
        return fetchWithAuth('/hod/student-leaves');
    },
    updateStudentLeaveStatus: async (id, data) => {
        return fetchWithAuth(`/hod/student-leaves/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
};

// Faculty API
export const facultyAPI = {
    getProfile: async () => {
        return fetchWithAuth('/faculty/profile');
    },
    updateProfile: async (data) => {
        return fetchWithAuth('/faculty/profile', { method: 'PUT', body: JSON.stringify(data) });
    },
    getClasses: async () => {
        return fetchWithAuth('/faculty/classes');
    },
    getStudents: async (classYear, section) => {
        return fetchWithAuth(`/faculty/students?class_year=${classYear}&section=${section}`);
    },
    getStudentsByBatch: async (classYear, section, batch = null) => {
        const params = new URLSearchParams({ class_year: classYear, section });
        if (batch) params.append('batch', batch);
        return fetchWithAuth(`/faculty/students?${params}`);
    },

    // Attendance
    markAttendance: async (data) => {
        return fetchWithAuth('/faculty/attendance', { method: 'POST', body: JSON.stringify(data) });
    },
    getAttendance: async (classYear, section, filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchWithAuth(`/faculty/attendance/${classYear}/${section}${params ? `?${params}` : ''}`);
    },
    getAttendanceSummary: async (classYear, section) => {
        return fetchWithAuth(`/faculty/attendance/summary/${classYear}/${section}`);
    },

    // Marks
    enterMarks: async (data) => {
        return fetchWithAuth('/faculty/marks', { method: 'POST', body: JSON.stringify(data) });
    },
    updateMarks: async (id, marksObtained) => {
        return fetchWithAuth(`/faculty/marks/${id}?marks_obtained=${marksObtained}`, { method: 'PUT' });
    },
    getMarks: async (classYear, section, filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchWithAuth(`/faculty/marks/${classYear}/${section}${params ? `?${params}` : ''}`);
    },

    // Events
    getEvents: async () => {
        return fetchWithAuth('/faculty/events');
    },

    // Student Management
    downloadStudentTemplate: async () => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/faculty/students/template`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to download template');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    uploadStudents: async (file, classYear, section, batch) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('class_year', classYear);
        formData.append('section', section);
        formData.append('batch', batch);

        const response = await fetch(`${API_BASE_URL}/faculty/students/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }
        return response.json();
    },
    getBatches: async (classYear = null, section = null) => {
        const params = new URLSearchParams();
        if (classYear) params.append('class_year', classYear);
        if (section) params.append('section', section);
        return fetchWithAuth(`/faculty/students/batches${params.toString() ? `?${params}` : ''}`);
    },
    createStudent: async (data) => {
        return fetchWithAuth('/faculty/students', { method: 'POST', body: JSON.stringify(data) });
    },
    updateStudent: async (id, data) => {
        return fetchWithAuth(`/faculty/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteStudent: async (id) => {
        return fetchWithAuth(`/faculty/students/${id}`, { method: 'DELETE' });
    },

    // Leave Requests
    applyLeave: async (data) => {
        return fetchWithAuth('/faculty/my-leaves', { method: 'POST', body: JSON.stringify(data) });
    },
    getLeaves: async () => {
        return fetchWithAuth('/faculty/my-leaves');
    },
    getStudentLeaves: async () => {
        return fetchWithAuth('/faculty/student-leaves');
    },
    updateStudentLeave: async (id, status, rejectionReason = '') => {
        return fetchWithAuth(`/faculty/student-leaves/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status, rejection_reason: rejectionReason })
        });
    },
};

// Student API
export const studentAPI = {
    getProfile: async () => {
        return fetchWithAuth('/student/profile');
    },
    getAttendance: async (subject = null) => {
        return fetchWithAuth(`/student/attendance${subject ? `?subject=${subject}` : ''}`);
    },
    getMarks: async (subject = null, examType = null) => {
        const params = new URLSearchParams();
        if (subject) params.append('subject', subject);
        if (examType) params.append('exam_type', examType);
        const queryString = params.toString();
        return fetchWithAuth(`/student/marks${queryString ? `?${queryString}` : ''}`);
    },
    getEvents: async () => {
        return fetchWithAuth('/student/events');
    },
    getDashboard: async () => {
        return fetchWithAuth('/student/dashboard');
    },
    getMyProjects: async () => {
        return fetchWithAuth('/projects/my-projects');
    },
    applyLeave: async (data) => {
        return fetchWithAuth('/student/leaves', { method: 'POST', body: JSON.stringify(data) });
    },
    getLeaves: async () => {
        return fetchWithAuth('/student/leaves');
    },
};
// Assignments API
export const assignmentsAPI = {
    getAssignments: async (classYear = '', section = '') => {
        const params = new URLSearchParams();
        if (classYear) params.append('class_year', classYear);
        if (section) params.append('section', section);
        const queryString = params.toString();
        return fetchWithAuth(`/assignments${queryString ? `?${queryString}` : ''}`);
    },
    createAssignment: async (data) => {
        return fetchWithAuth('/assignments', { method: 'POST', body: JSON.stringify(data) });
    },
    getClassStudentCount: async (classYear, section) => {
        return fetchWithAuth(`/assignments/class-count?class_year=${encodeURIComponent(classYear)}&section=${encodeURIComponent(section)}`);
    },
    getSubmissions: async (assignmentId = null, classYear = '', section = '') => {
        const params = new URLSearchParams();
        if (assignmentId) params.append('assignment_id', assignmentId);
        if (classYear) params.append('class_year', classYear);
        if (section) params.append('section', section);
        const queryString = params.toString();
        return fetchWithAuth(`/assignments/submissions${queryString ? `?${queryString}` : ''}`);
    },
    evaluateSubmission: async (submissionId, marksObtained, feedback) => {
        return fetchWithAuth('/assignments/evaluate', {
            method: 'POST',
            body: JSON.stringify({
                submission_id: submissionId,
                marks_obtained: Number(marksObtained),
                feedback: feedback || null
            })
        });
    },
    submitAssignment: async (assignmentId, studentId, fileBase64) => {
        return fetchWithAuth('/assignments/submit', {
            method: 'POST',
            body: JSON.stringify({
                assignment_id: assignmentId,
                student_id: studentId,
                file_url: fileBase64
            })
        });
    }
};

export const projectsAPI = {
    getProjects: async () => {
        return fetchWithAuth('/projects');
    },
    getMyProjects: async () => {
        return fetchWithAuth('/projects/my-projects');
    },
    getProjectStatus: async (projectId) => {
        return fetchWithAuth(`/projects/progress/${projectId}`);
    },
    createProjectTeam: async (data) => {
        return fetchWithAuth('/projects/create-team', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    takeLead: async (projectId) => {
        return fetchWithAuth(`/projects/${projectId}/take-lead`, {
            method: 'POST'
        });
    },
    updateProjectPhase: async (projectId, data) => {
        return fetchWithAuth(`/projects/${projectId}/phase-update`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    submitFacultyReview: async (projectId, data) => {
        return fetchWithAuth(`/projects/progress/${projectId}/faculty-review`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    submitHODMarks: async (projectId, data) => {
        return fetchWithAuth(`/projects/progress/${projectId}/hod-review`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

export default { authAPI, hodAPI, facultyAPI, studentAPI, assignmentsAPI, projectsAPI };

