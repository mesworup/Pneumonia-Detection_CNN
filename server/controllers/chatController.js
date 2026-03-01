const { GoogleGenerativeAI } = require("@google/generative-ai");
const Report = require('../models/Report');

// Initialize Gemini API - require API key from environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required in environment variables');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Analyze report and chat with patient
// @route   POST /api/chat
// @access  Private (Patient)
exports.analyzeReport = async (req, res) => {
    try {
        const { reportId, message, language } = req.body; // Extract language

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Define language instruction
        const langInstruction = language === 'np'
            ? "respond in Nepali language (Devanagari script). Be polite, simple, and patient-friendly."
            : "respond in English. Be polite, simple, and patient-friendly.";

        // Fetch the report details to provide context
        let reportContext = "";
        if (reportId) {
            const report = await Report.findById(reportId).populate('doctorId', 'name');
            if (report) {
                reportContext = `
Current Patient Report Context:
- Condition: ${report.prediction}
- Confidence: ${(report.confidence * 100).toFixed(1)}%
- Doctor's Notes: ${report.notes || 'No notes provided'}
- Doctor Name: ${report.doctorId?.name || 'Unknown'}
- Date: ${new Date(report.createdAt).toLocaleDateString()}
`;
            }
        }

        // Explicit logging for terminal visibility
        console.log(`\n--- START AI ANALYSIS ---`);
        console.log(`Processing request for Report ID: ${reportId || 'N/A'}`);
        console.log(`Language: ${language}`);
        console.log(`User Query: ${message}`);

        let prompt;

        if (reportContext) {
            // SCENARIO 1: Report Analysis Mode
            prompt = `
You are a friendly, professional, and empathetic AI Medical Health Assistant.
You have access to a patient's medical report details below.

${reportContext}

User Question: "${message}"

**GUIDELINES:**
1.  **Language:** ${langInstruction}
2.  **Formatting:** Use **Bold Headings** and *bullet points* for readability.
3.  **Conciseness:** Keep the response **SHORT and CONCISE**.
4.  **Content:**
    - If the user asks to **analyze the report**, **explain the result**, or asks **"What does this mean?"**:
      - Provide a structured "Report Analysis" as defined below.
    - If the user asks a **specific follow-up question** (e.g., "What is pneumonia?", "Can I go to work?", "What foods should I eat?"):
      - Answer ONLY that question directly.
      - Use the report context to personalize the answer (e.g., "Since your report shows Pneumonia, you should avoid...") but **DO NOT** output the full "Report Analysis" structure unless asked.
5.  **CRITICAL RESTRICTION:** Do **NOT** prescribe specific medications or dosages.
6.  **DOMAIN RESTRICTION:** Only answer questions related to **Health, Medical Advice, and the current report**.
7.  **Disclaimer:** Always imply you are an AI and they should consult a doctor.

**Structure for "Analyze Report" Requests ONLY:**
If (and only if) the user asks for a report analysis, use this format:
### 📋 Report Analysis
(Explain the result simply)

### 🌿 Recovery & Lifestyle Tips
(Bulleted list of tips)

### ⚠️ When to See a Doctor
(Clear warning signs)

### 🩺 Important Note
(Disclaimer)

**Structure for Specific Questions:**
(Answer the question naturally and concisely. Do NOT use the headers above unless relevant to the specific answer.)
`;
        } else {
            // SCENARIO 2: General Chat Mode (No specific report)
            prompt = `
You are a friendly, professional, and empathetic AI Medical Health Assistant.
The user is asking a general health question or engaging in conversation. You do NOT have a specific medical report to analyze right now.

User Question: "${message}"

**GUIDELINES:**
1.  **Language:** ${langInstruction}
2.  **Formatting:** Use **Bold Headings** and *bullet points* for readability.
3.  **Conciseness:** Keep the response **SHORT and CONCISE**.
4.  **Content:** Answer the user's question directly **ONLY IF it is health-related**. Provide general health advice if asked.
5.  **CRITICAL RESTRICTION:** Do **NOT** prescribe specific medications or dosages.
6.  **DOMAIN RESTRICTION (TOKEN SAVING):** You are strictly limited to **Medical and Health-related** topics. If the question is NOT related to health (e.g., "how is the weather", "write a code", "who is the prime minister"), gracefully explain that you are a medical assistant and cannot answer non-health related queries. This is to ensure you remain efficient and helpful in your designated field.
7.  **Disclaimer:** If giving medical advice, remind them that you are an AI and they should consult a doctor.

**Response Structure:**
(Answer the question naturally. Do NOT use headers like "Report Analysis" if it's not relevant.)
`;
        }

        // Use Gemini 2.5 Flash model
        console.log("Attempting generation with gemini-2.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success with gemini-2.5-flash");

        console.log(`AI Response Generated: ${text.substring(0, 50)}...`);
        console.log(`--- END AI ANALYSIS ---\n`);

        res.json({ reply: text });

    } catch (error) {
        console.error('Chat Error:', error);
        // Return specific error message for debugging
        res.status(500).json({
            message: 'Error processing your request',
            error: error.message || 'Unknown error'
        });
    }
};
