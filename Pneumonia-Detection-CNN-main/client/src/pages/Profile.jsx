import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiEndpoints } from '../config/api';

const Profile = () => {
    const { user, token } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch(apiEndpoints.auth.updatePassword, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Server Error');
        }
    };

    if (!user) return <div className="container" style={{ paddingTop: '100px' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '120px' }}>
            <h1>My Profile</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem' }}>
                <div className="card" style={{ padding: '2rem', borderRadius: '15px' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>User Details</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Name:</strong> {user.name}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Email:</strong> {user.email}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', borderRadius: '15px' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Change Password</h2>
                    {message && <div style={{ marginBottom: '1rem', color: 'green' }}>{message}</div>}
                    {error && <div style={{ marginBottom: '1rem', color: 'red' }}>{error}</div>}

                    <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
