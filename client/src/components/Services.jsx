import React from 'react';

const Services = () => {
    const services = [
        {
            icon: '🧠',
            title: 'CNN Deep Learning',
            description: 'Our Convolutional Neural Network is trained on 5000+ chest X-ray images to identify pneumonia patterns with state-of-the-art precision.',
            color: '#667eea'
        },
        {
            icon: '⚡',
            title: 'Instant Analysis',
            description: 'Upload a chest X-ray and get AI-powered pneumonia detection results in seconds, streamlining clinical workflows.',
            color: '#f5576c'
        },
        {
            icon: '✨',
            title: 'User-Friendly Design',
            description: 'A clean, intuitive interface that makes complex medical image analysis simple and accessible for everyone.',
            color: '#4ade80'
        },
        {
            icon: '📊',
            title: 'Confidence Metrics',
            description: 'Each diagnosis includes a confidence score and detailed probability analysis to assist doctors in their final assessment.',
            color: '#fb923c'
        },
        {
            icon: '👨‍⚕️',
            title: 'Doctor Oversight',
            description: 'Designed as a decision support tool - empowering medical professionals with AI insights while keeping the human in the loop.',
            color: '#a78bfa'
        },
        {
            icon: '📄',
            title: 'Smart PDF Reporting',
            description: 'Automatically generate comprehensive PDF reports with X-ray visualizations, diagnostic results, and clinical notes for patients.',
            color: '#06b6d4'
        }
    ];

    return (
        <section id="services" style={{
            padding: '6rem 0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%)',
            position: 'relative'
        }}>
            <div className="container">
                <div style={{
                    textAlign: 'center',
                    marginBottom: '4rem',
                    animation: 'fadeIn 1s ease-out'
                }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '30px',
                        marginBottom: '1rem'
                    }}>
                        <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>
                            Our Services
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: '2.8rem',
                        fontWeight: '800',
                        color: '#1e293b',
                        marginBottom: '1rem'
                    }}>
                        CNN-Powered Pneumonia Detection
                    </h2>
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#64748b',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        Advanced deep learning technology to assist medical professionals in diagnosing pneumonia from chest X-rays
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2rem',
                    animation: 'fadeInUp 1s ease-out 0.2s both'
                }}>
                    {services.map((service, index) => (
                        <div
                            key={index}
                            style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '2.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                border: '1px solid rgba(0,0,0,0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.querySelector('.service-icon').style.transform = 'scale(1.1) rotate(5deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                e.currentTarget.querySelector('.service-icon').style.transform = 'scale(1) rotate(0deg)';
                            }}
                        >
                            <div
                                className="service-icon"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '20px',
                                    background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    marginBottom: '1.5rem',
                                    boxShadow: `0 10px 30px ${service.color}40`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {service.icon}
                            </div>

                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#1e293b',
                                marginBottom: '1rem'
                            }}>
                                {service.title}
                            </h3>

                            <p style={{
                                fontSize: '1rem',
                                color: '#64748b',
                                lineHeight: '1.7'
                            }}>
                                {service.description}
                            </p>

                            {/* Decorative dot */}
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: service.color,
                                opacity: 0.3
                            }}></div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInUp {
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
        </section>
    );
};

export default Services;
