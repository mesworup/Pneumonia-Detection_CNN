import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiEndpoints } from '../config/api';

const Chatbot = ({ reportId, isOpen, onClose, onOpen, onClearReport, autoAnalyze = false }) => {
    const { t, language } = useLanguage();

    // Initial greeting message
    // Note: We use t() inside the component render or effect to get dynamic initial message,
    // but here in state initialization we might need a fixed one or handle it in useEffect.
    // For simplicity, we'll set it in useEffect to respect language changes on load.
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);

    // Track the last report we successfully analyzed to prevent re-analysis on re-open
    const lastAnalyzedReportId = useRef(null);
    const messagesEndRef = useRef(null);
    const { token } = useAuth();

    // Set initial greeting
    useEffect(() => {
        if (isOpen && !hasGreeted && messages.length === 0) {
            setMessages([{
                text: t('welcomeMessage'),
                isUser: false
            }]);
            setHasGreeted(true);
        }
    }, [isOpen, hasGreeted, t, messages.length]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, loading]);

    // Reusable function to send message
    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        setMessages(prev => [...prev, { text: messageText, isUser: true }]);
        setLoading(true);

        try {
            const response = await fetch(apiEndpoints.chat.analyze, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: messageText,
                    reportId: reportId,
                    language: language // Pass language to backend
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { text: data.reply, isUser: false }]);
            } else {
                const errorMessage = data.message ? `${data.message}${data.error ? ': ' + data.error : ''}` : "Sorry, I'm having trouble connecting right now.";
                setMessages(prev => [...prev, { text: errorMessage, isUser: false }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { text: "Network error. Please check your connection.", isUser: false }]);
        }
        setLoading(false);
    };

    // Auto-analyze Logic
    useEffect(() => {
        if (isOpen && autoAnalyze) {
            // Case 1: Specific Report Selected
            if (reportId) {
                // If this is a NEW report we haven't analyzed in this session
                if (reportId !== lastAnalyzedReportId.current) {

                    // If we have previous messages, add a visual separator
                    if (messages.length > 0) {
                        setMessages(prev => [...prev, {
                            text: `\n---\n**${t('analyzingNewReport')}**\n---`,
                            isUser: false,
                            isSystem: true
                        }]);
                    }

                    // Trigger Analysis - include reportId in message for display
                    setMessages(prev => [...prev, {
                        text: "Please analyze this report for me.",
                        isUser: true,
                        reportId: reportId // Include report ID for special rendering
                    }]);

                    // Send to backend without reportId in the message text
                    const sendAnalysisRequest = async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(apiEndpoints.chat.analyze, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    message: "Please analyze this report for me.",
                                    reportId: reportId,
                                    language: language
                                })
                            });

                            const data = await response.json();

                            if (response.ok) {
                                setMessages(prev => [...prev, { text: data.reply, isUser: false }]);
                            } else {
                                const errorMessage = data.message ? `${data.message}${data.error ? ': ' + data.error : ''}` : "Sorry, I'm having trouble connecting right now.";
                                setMessages(prev => [...prev, { text: errorMessage, isUser: false }]);
                            }
                        } catch (error) {
                            console.error('Chat error:', error);
                            setMessages(prev => [...prev, { text: "Network error. Please check your connection.", isUser: false }]);
                        }
                        setLoading(false);
                    };

                    sendAnalysisRequest();

                    // Update Ref so we don't re-analyze if user closes/opens chat
                    lastAnalyzedReportId.current = reportId;
                }
            }
            // Case 2: General Mode handled by initial greeting effect
        }
    }, [reportId, isOpen, t, token, language, autoAnalyze]); // Add dependencies

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    };

    if (!isOpen) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                fontFamily: "'Inter', sans-serif"
            }}>
                <button
                    onClick={() => {
                        onOpen();
                        if (onClearReport) onClearReport(); // Switch to General Mode on bubble click
                    }}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                        cursor: 'pointer',
                        fontSize: '1.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
                    }}
                >
                    💬
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Chat Window */}
            <div style={{
                width: '350px',
                height: '500px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                marginBottom: '15px',
                border: '1px solid #E5E7EB',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🤖</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{t('aiAssistant')}</h3>
                            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>⚡ {t('online')}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{
                            alignSelf: msg.isUser ? 'flex-end' : (msg.isSystem ? 'center' : 'flex-start'),
                            maxWidth: msg.isSystem ? '100%' : '80%',
                            padding: msg.isSystem ? '5px' : '10px 14px',
                            borderRadius: msg.isSystem ? '0' : '12px',
                            backgroundColor: msg.isUser ? '#667eea' : (msg.isSystem ? 'transparent' : 'white'),
                            color: msg.isUser ? 'white' : (msg.isSystem ? '#6B7280' : '#1F2937'),
                            boxShadow: msg.isSystem ? 'none' : (msg.isUser ? '0 2px 4px rgba(102, 126, 234, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)'),
                            borderTopRightRadius: msg.isUser ? '2px' : '12px',
                            borderTopLeftRadius: msg.isUser ? '12px' : '2px',
                            fontSize: msg.isSystem ? '0.85rem' : '0.9rem',
                            lineHeight: '1.4',
                            fontStyle: msg.isSystem ? 'italic' : 'normal',
                            textAlign: msg.isSystem ? 'center' : 'left'
                        }}>
                            {msg.isSystem ? (
                                msg.text
                            ) : (
                                <>
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                    {msg.reportId && (
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#9CA3AF',
                                            marginTop: '6px',
                                            fontStyle: 'italic'
                                        }}>
                                            Report ID: {msg.reportId}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div style={{
                            alignSelf: 'flex-start',
                            backgroundColor: 'white',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span>{t('listening')}</span>
                            <span className="dot-animate">...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{
                    padding: '1rem',
                    borderTop: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={reportId ? t('askAboutReport') : t('askHealthQuestion')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '20px',
                            border: '1px solid #E5E7EB',
                            outline: 'none',
                            fontSize: '0.9rem',
                            backgroundColor: '#F9FAFB'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;
