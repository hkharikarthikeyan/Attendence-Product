// Minimal API for Excel Upload & Attendance
const API_BASE_URL = 'http://localhost:8000/api';

const fetchAPI = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }
    return response.json();
};

export const minimalAPI = {
    // Upload students from Excel
    uploadStudents: async (file, classYear, section, batch) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('class_year', classYear);
        formData.append('section', section);
        formData.append('batch', batch);

        const response = await fetch(`${API_BASE_URL}/upload-students`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }
        return response.json();
    },

    // Get students for attendance
    getStudents: async (classYear, section, batch = null) => {
        const params = new URLSearchParams({ class_year: classYear, section });
        if (batch) params.append('batch', batch);
        return fetchAPI(`/students?${params}`);
    },

    // Get batches
    getBatches: async (classYear = null, section = null) => {
        const params = new URLSearchParams();
        if (classYear) params.append('class_year', classYear);
        if (section) params.append('section', section);
        return fetchAPI(`/batches${params.toString() ? `?${params}` : ''}`);
    }
};
