import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const { user, logout, openAuthModal } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are on the homepage
    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className={`navbar ${scrolled || !isHome ? 'scrolled' : ''}`}>
            <div className="container nav-container">
                <Link to="/" className="logo">
                    Pneumo<span style={{ color: 'hsl(var(--primary-glow))' }}>Detect</span>
                </Link>
                <ul className="nav-links">
                    {!user && (
                        <>
                            <li><Link to="/">Home</Link></li>
                            <li><a href="#services">Services</a></li>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <li><Link to="/admin">{t('dashboard')}</Link></li>
                    )}
                    {user && user.role === 'doctor' && (
                        <li><Link to="/doctor-dashboard">{t('dashboard')}</Link></li>
                    )}
                    {user && user.role === 'patient' && (
                        <li><Link to="/patient-dashboard">{t('dashboard')}</Link></li>
                    )}



                    {user ? (
                        <>
                            {/* Notification Bell */}
                            <li>
                                <NotificationBell />
                            </li>
                            <li>
                                <Link
                                    to="/profile"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                                        }}
                                    >
                                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                        {t('hi')}, {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                            </li>
                            <li><button onClick={handleLogout} className="btn-primary-small" style={{ border: 'none', cursor: 'pointer' }}>{t('logout')}</button></li>
                        </>
                    ) : (
                        <>
                            <li><button onClick={() => openAuthModal('login')} className="nav-btn">Login</button></li>
                            <li><button onClick={() => openAuthModal('register')} className="btn-primary-small" style={{ cursor: 'pointer' }}>Register</button></li>
                        </>
                    )}
                </ul>
                <div className="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
