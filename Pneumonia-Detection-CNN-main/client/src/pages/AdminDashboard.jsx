import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiEndpoints } from '../config/api';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const response = await fetch(apiEndpoints.admin.users, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const user = users.find(u => u._id === userId);
        if (!window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) {
            return;
        }

        try {
            const response = await fetch(apiEndpoints.admin.updateUserRole(userId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(users.map(user => user._id === userId ? { ...user, role: data.role } : user));
            } else {
                alert('Error updating role');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleResetPassword = async (userId) => {
        if (!window.confirm('Are you sure you want to reset this user\'s password to "password123"?')) return;

        try {
            const response = await fetch(apiEndpoints.admin.resetPassword(userId), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Password reset successfully to: password123');
            } else {
                alert('Error resetting password');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetch(apiEndpoints.admin.deleteUser(userId), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(users.filter(user => user._id !== userId));
            } else {
                alert('Error deleting user');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '120px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                <p style={{ color: '#6B7280', fontSize: '1rem' }}>Manage system users and their roles</p>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Role</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users
                            .filter(user => {
                                const query = searchQuery.toLowerCase();
                                return user.name.toLowerCase().includes(query) ||
                                    user.email.toLowerCase().includes(query);
                            })
                            .map(user => (
                                <tr key={user._id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '600',
                                                fontSize: '1rem'
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '500', color: '#1F2937' }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#6B7280' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #D1D5DB',
                                                background: 'white',
                                                fontSize: '0.9rem',
                                                cursor: user.email === 'admin@pneumodetect.com' ? 'not-allowed' : 'pointer',
                                                color: '#374151'
                                            }}
                                            disabled={user.email === 'admin@pneumodetect.com'}
                                        >
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.email !== 'admin@pneumodetect.com' ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleResetPassword(user._id)}
                                                    style={{
                                                        background: '#F59E0B',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#D97706'}
                                                    onMouseLeave={(e) => e.target.style.background = '#F59E0B'}
                                                >
                                                    🔄 Reset
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    style={{
                                                        background: '#EF4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#DC2626'}
                                                    onMouseLeave={(e) => e.target.style.background = '#EF4444'}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <span style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#DBEAFE',
                                                    color: '#1E40AF',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500'
                                                }}>Super Admin</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
