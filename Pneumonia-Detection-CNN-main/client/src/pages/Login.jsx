import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            // Redirect based on role
            const role = result.role;
            if (role === 'admin') navigate('/admin');
            else if (role === 'doctor') navigate('/doctor-dashboard');
            else navigate('/patient-dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem'
        }}>
            {/* Logo/Home Link */}
            <Link to="/" style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
                fontSize: '1.5rem',
                fontWeight: '800',
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s ease'
            }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                PneumoDetect
            </Link>

            <div style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                padding: '3rem',
                maxWidth: '450px',
                width: '100%',
                animation: 'slideUp 0.5s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                    }}>
                        <span style={{ fontSize: '2.5rem' }}>🔐</span>
                    </div>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>Welcome Back</h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Login to access your dashboard</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1.5rem',
                        border: '1px solid #FCA5A5',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.9rem'
                        }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                            style={{
                                width: '100%',
                                padding: '0.9rem 1rem',
                                borderRadius: '10px',
                                border: '2px solid #E5E7EB',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.9rem'
                        }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            style={{
                                width: '100%',
                                padding: '0.9rem 1rem',
                                borderRadius: '10px',
                                border: '2px solid #E5E7EB',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        Sign In
                    </button>
                </form>

                <p style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '0.95rem'
                }}>
                    Don't have an account? <Link to="/register" style={{
                        color: '#667eea',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}>Sign Up</Link>
                </p>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
