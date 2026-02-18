import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiEndpoints } from '../config/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const dropdownRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch(apiEndpoints.notifications.list(10), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(apiEndpoints.notifications.unreadCount, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await fetch(apiEndpoints.notifications.markRead(notificationId), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local state
            setNotifications(notifications.map(n =>
                n._id === notificationId ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch(apiEndpoints.notifications.markAllRead, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
        setLoading(false);
    };

    // Format timestamp to relative time
    const formatTime = (timestamp) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifTime.toLocaleDateString();
    };

    // Initial fetch and polling
    useEffect(() => {
        if (token) {
            fetchNotifications();
            fetchUnreadCount();

            // Poll every 30 seconds
            const interval = setInterval(() => {
                fetchUnreadCount();
                if (showDropdown) {
                    fetchNotifications();
                }
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [token, showDropdown]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            fetchNotifications();
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={handleBellClick}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: '#374151' }}
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    width: '380px',
                    maxHeight: '500px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #E5E7EB'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '500'
                                }}
                            >
                                {loading ? 'Marking...' : 'Mark all read'}
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '3rem 2rem',
                                textAlign: 'center',
                                color: '#9CA3AF'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid #F3F4F6',
                                        cursor: notif.isRead ? 'default' : 'pointer',
                                        background: notif.isRead ? 'white' : '#F0F9FF',
                                        transition: 'background 0.2s',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => !notif.isRead && (e.currentTarget.style.background = '#DBEAFE')}
                                    onMouseLeave={(e) => !notif.isRead && (e.currentTarget.style.background = '#F0F9FF')}
                                >
                                    {/* Unread Indicator */}
                                    {!notif.isRead && (
                                        <div style={{
                                            position: 'absolute',
                                            left: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#3B82F6'
                                        }} />
                                    )}

                                    <div style={{ marginLeft: notif.isRead ? 0 : '1rem' }}>
                                        <p style={{
                                            margin: '0 0 0.25rem 0',
                                            fontSize: '0.9rem',
                                            color: '#374151',
                                            fontWeight: notif.isRead ? 'normal' : '500'
                                        }}>
                                            {notif.message}
                                        </p>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            color: '#9CA3AF'
                                        }}>
                                            {formatTime(notif.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
