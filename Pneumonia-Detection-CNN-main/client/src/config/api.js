// Centralized API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getApiUrl = () => API_URL;

export const apiEndpoints = {
    auth: {
        login: `${API_URL}/api/auth/login`,
        register: `${API_URL}/api/auth/register`,
        profile: `${API_URL}/api/auth/profile`,
        updatePassword: `${API_URL}/api/auth/password`,
    },
    reports: {
        analyze: `${API_URL}/api/reports/analyze`,
        create: `${API_URL}/api/reports`,
        myReports: `${API_URL}/api/reports/my-reports`,
        patients: `${API_URL}/api/reports/patients`,
        patientReports: (patientId) => `${API_URL}/api/reports/patient/${patientId}`,
        update: (reportId) => `${API_URL}/api/reports/${reportId}`,
        delete: (reportId) => `${API_URL}/api/reports/${reportId}`,
    },
    chat: {
        analyze: `${API_URL}/api/chat`,
    },
    admin: {
        users: `${API_URL}/api/admin/users`,
        updateUserRole: (userId) => `${API_URL}/api/admin/users/${userId}/role`,
        resetPassword: (userId) => `${API_URL}/api/admin/users/${userId}/reset-password`,
        deleteUser: (userId) => `${API_URL}/api/admin/users/${userId}`,
    },
    notifications: {
        list: (limit = 10) => `${API_URL}/api/notifications?limit=${limit}`,
        unreadCount: `${API_URL}/api/notifications/unread-count`,
        markRead: (notificationId) => `${API_URL}/api/notifications/${notificationId}/read`,
        markAllRead: `${API_URL}/api/notifications/read-all`,
    },
    uploads: {
        image: (imagePath) => `${API_URL}${imagePath}`,
    },
};

export default API_URL;
