import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        // Navbar
        dashboard: 'Dashboard',
        logout: 'Logout',
        hi: 'Hi',

        // Patient Dashboard - Main
        myMedicalReports: 'My Medical Reports',
        historyOfAnalysis: 'History of X-Ray Analysis',
        doctor: 'Doctor',
        date: 'Date',
        notes: 'Notes',
        notesPrefix: 'Notes:',
        unknown: 'Unknown',
        noReportsFound: 'No reports found',
        noReportsMsg: "Your doctor hasn't submitted any reports yet.",

        // Report Card
        pneumonia: 'Pneumonia',
        normal: 'Normal',
        confidence: 'Confidence',
        analyze: 'Analyze',
        download: 'Download',
        medicalReportDetails: 'Medical Report Details',
        diagnosis: 'Diagnosis',
        clinicalNotes: 'Clinical Notes',
        noNotes: 'No clinical notes provided by the doctor.',
        patient: 'Patient',
        askAiAssistant: 'Ask AI Assistant',
        downloadPdf: 'Download PDF',

        // Chatbot
        aiAssistant: 'AI Assistant',
        online: 'Online',
        askHealthQuestion: 'Ask a health question...',
        askAboutReport: 'Ask about this report...',
        analyzingNewReport: '--- Analyzing New Report... ---',
        welcomeMessage: "Hello! I'm your AI health assistant. I can help explain your reports and provide general health wellness tips.",
        clickToTalk: 'Click to tell me about your symptoms...',
        listening: 'Listening...',

        // Misc
        loading: 'Loading...'
    },
    np: {
        // Navbar
        dashboard: 'ड्यासबोर्ड',
        logout: 'लगआउट',
        hi: 'नमस्ते',

        // Patient Dashboard - Main
        myMedicalReports: 'मेरो चिकित्सा प्रतिवेदन',
        historyOfAnalysis: 'एक्स–रे विश्लेषणको इतिहास',
        doctor: 'डाक्टर',
        date: 'मिति',
        notes: 'टिप्पणी',
        notesPrefix: 'टिप्पणी:',
        unknown: 'अज्ञात',
        noReportsFound: 'कुनै रिपोर्ट भेटिएन',
        noReportsMsg: 'तपाईंको डाक्टरले अहिलेसम्म कुनै रिपोर्ट पेस गर्नुभएको छैन।',

        // Report Card
        pneumonia: 'निमोनिया',
        normal: 'सामान्य',
        confidence: 'विश्वसनीयता',
        analyze: 'विश्लेषण गर्नुहोस्',
        download: 'डाउनलोड गर्नुहोस्',
        medicalReportDetails: 'चिकित्सा रिपोर्ट विवरण',
        diagnosis: 'निदान',
        clinicalNotes: 'क्लिनिकल टिप्पणीहरू',
        noNotes: 'डाक्टरद्वारा कुनै टिप्पणी प्रदान गरिएको छैन।',
        patient: 'बिरामी',
        askAiAssistant: 'एआई सहायकलाई सोध्नुहोस्',
        downloadPdf: 'PDF डाउनलोड गर्नुहोस्',

        // Chatbot
        aiAssistant: 'एआई स्वास्थ्य सहायक',
        online: 'अनलाइन',
        askHealthQuestion: 'स्वास्थ्य सम्बन्धी प्रश्न सोध्नुहोस्...',
        askAboutReport: 'यो रिपोर्ट बारे सोध्नुहोस्...',
        analyzingNewReport: '--- नयाँ रिपोर्ट विश्लेषण गर्दै... ---',
        welcomeMessage: 'नमस्ते! म तपाईंको एआई स्वास्थ्य सहायक हुँ। म तपाईंको रिपोर्ट बुझ्न र सामान्य स्वास्थ्य सुझाव दिन सहयोग गर्न सक्छु।',
        clickToTalk: 'तपाईंको लक्षणहरू बताउन क्लिक गर्नुहोस्...',
        listening: 'सुन्दै छु...',

        // Misc
        loading: 'लोड हुँदैछ...'
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'np' : 'en');
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
