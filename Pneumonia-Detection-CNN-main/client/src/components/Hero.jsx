import React from 'react';
import NeuralNetwork from './NeuralNetwork';
import { useAuth } from '../context/AuthContext';

const Hero = () => {
    const { openAuthModal } = useAuth();

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            // bg-gradient-to-br from-[hsl(var(--hero-gradient-start))] via-[hsl(var(--primary-deep))] to-[hsl(var(--hero-gradient-end))]
            background: 'linear-gradient(135deg, hsl(var(--hero-gradient-start)), hsl(var(--primary-deep)), hsl(var(--hero-gradient-end)))',
            paddingTop: '80px' // Navbar height
        }}>
            {/* Background decorative blobs */}
            <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10rem',
                    left: '-10rem',
                    width: '24rem',
                    height: '24rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    filter: 'blur(64px)',
                    animation: 'float 8s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '5rem',
                    right: '2.5rem',
                    width: '18rem',
                    height: '18rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    filter: 'blur(64px)',
                    animation: 'float 8s ease-in-out infinite',
                    animationDelay: '2s'
                }} />
            </div>

            <div className="container" style={{
                position: 'relative',
                zIndex: 10,
                padding: '0 1.5rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '3rem',
                    alignItems: 'center'
                }}>
                    {/* Left: Text */}
                    <div style={{
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        textAlign: 'left' // Explicitly align left
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.375rem 1rem',
                            borderRadius: '9999px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(4px)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            alignSelf: 'flex-start'
                        }}>
                            AI-Powered Diagnostics
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            fontWeight: '800',
                            lineHeight: '1.1',
                            letterSpacing: '-0.025em',
                            margin: 0
                        }}>
                            Pneumonia Detection<br />
                            <span style={{ color: 'hsl(var(--primary-glow))' }}>Reimagined</span>
                        </h1>

                        <p style={{
                            fontSize: '1.125rem',
                            color: 'rgba(255, 255, 255, 0.75)',
                            maxWidth: '32rem',
                            lineHeight: '1.625',
                            margin: 0
                        }}>
                            Leveraging Deep Learning CNNs trained on thousands of chest X-rays to deliver fast, accurate pneumonia screening — empowering clinicians with AI-driven insights.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                            <button style={{
                                backgroundColor: 'white',
                                color: 'hsl(var(--primary-deep))', // Use deep primary for text
                                padding: '0.75rem 2rem',
                                borderRadius: '9999px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                                onClick={() => openAuthModal('register')}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.backgroundColor = 'white';
                                }}>
                                Get Started <span>→</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Neural Network Illustration */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <NeuralNetwork />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                
                @media (max-width: 900px) {
                    .container > div {
                        grid-template-columns: 1fr !important;
                        text-align: center;
                    }
                    /* Center items on mobile */
                    .container > div > div:first-child { 
                        align-items: center; 
                        text-align: center;
                    }
                    /* Center badge on mobile */
                    .container > div > div:first-child > div:first-child {
                        align-self: center !important;
                    }
                }
            `}</style>
        </section >
    );
};

export default Hero;
