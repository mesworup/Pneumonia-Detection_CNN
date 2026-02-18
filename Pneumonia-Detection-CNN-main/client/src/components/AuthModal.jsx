import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User, Mail, ArrowRight } from 'lucide-react';

const AuthModal = () => {
    const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // For register
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset state when mode changes or modal opens
    useEffect(() => {
        if (isAuthModalOpen) {
            setError('');
            setEmail('');
            setPassword('');
            setName('');
            document.body.style.overflow = 'hidden'; // Lock scroll
        } else {
            document.body.style.overflow = 'auto'; // Unlock scroll
        }
        return () => {
            document.body.style.overflow = 'auto'; // Cleanup
        };
    }, [isAuthModalOpen, authModalMode]);

    // Focus Trap & Click Outside
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeAuthModal();
        };

        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                closeAuthModal();
            }
        };

        if (isAuthModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAuthModalOpen, closeAuthModal]);



    console.log('AuthModal render. Open:', isAuthModalOpen);
    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (authModalMode === 'login') {
                const result = await login(email, password);
                if (result.success) {
                    closeAuthModal();
                    // Optional: Navigate if needed, but staying on current page is often better for modals
                    // checking role to redirect to dashboard if specifically required
                    const role = result.role;
                    if (role === 'admin') navigate('/admin');
                    else if (role === 'doctor') navigate('/doctor-dashboard');
                    else navigate('/patient-dashboard');
                } else {
                    setError(result.message);
                }
            } else {
                const result = await register(name, email, password);
                if (result.success) {
                    closeAuthModal();
                    navigate('/patient-dashboard');
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        openAuthModal(authModalMode === 'login' ? 'register' : 'login');
    };

    const isLogin = authModalMode === 'login';

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-container" ref={modalRef}>
                <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close modal">
                    <X size={24} />
                </button>

                <div className="auth-modal-header">
                    <div className={`auth-icon-wrapper ${isLogin ? 'login-icon' : 'register-icon'}`}>
                        {isLogin ? <Lock size={32} /> : <User size={32} />}
                    </div>
                    <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p>{isLogin ? 'Login to access your dashboard' : 'Join us to get started'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={`btn-submit ${isLogin ? 'btn-login' : 'btn-register'}`} disabled={isLoading}>
                        {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={toggleMode} className="btn-toggle">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>

        </div>

    );
};

export default AuthModal;
