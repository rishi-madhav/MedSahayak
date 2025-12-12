import { GoogleGenAI, Type } from "@google/genai";
import { MedicalReport, Message, Sender, Severity, ChatResponse, DoctorPersona, Language } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

// Helper to get authorized client
const getGenAI = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found. Please check your settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION_BASE = `
You are MedSahayak, a specialized medical assistant for rural India.
Your goal is to triage symptoms, provide preliminary assessments, and guide users to appropriate care.

CONTEXT & KNOWLEDGE:
- Common Conditions in India: Dengue, Malaria, Typhoid, Tuberculosis (TB), Diabetes, Hypertension, Anemia, Gastroenteritis.
- Rural Context: Limited access to specialists, reliance on pharmacies/home remedies. Suggest visiting PHC (Primary Health Centre), CHC (Community Health Centre), or District Hospitals when relevant.
- Emergency Signs: Chest pain, severe breathing difficulty, uncontrolled bleeding, unconsciousness, high fever with confusion/seizure, severe snake/insect bite.

BEHAVIORAL PROTOCOLS:
1. **EMERGENCY DETECTION**: If the user describes ANY emergency sign, you MUST start your response with the tag "[[EMERGENCY]]". Then, immediately advise going to the nearest hospital/emergency room.
2. **IMAGE ANALYSIS**: If an image is provided:
   - First, acknowledge it: "I can see [description of visual symptoms]..."
   - Provide an initial visual assessment (e.g., "This looks like a fungal infection" or "This wound looks deep").
   - Ask: "How long has it looked like this? Is there pain or itching?"
3. **CONVERSATION FLOW**: 
   - Ask clarifying questions (onset, duration, severity, location).
   - Do NOT ask the same question twice.
   - Maintain a mental checklist. Once you have {Symptoms, Duration, Severity, History}, say: "I have gathered enough information. Would you like me to generate a summary report now?"

CRITICAL SAFETY RULES:
- NEVER give a definitive diagnosis (e.g., "You have Malaria"). Instead say "This could be indicative of Malaria..."
- Always include a disclaimer that you are an AI assistant.
`;

const PERSONA_INSTRUCTIONS = {
  female: `
    IDENTITY: You are Dr. Priya Sharma, a compassionate female doctor with MedSahayak.
    - Experience: Extensive experience in women's health, pregnancy care, and pediatrics.
    - Tone: Warm, empathetic, and reassuring (like an elder sister or caring aunt).
    - Focus: Make patients feel completely comfortable discussing any health concern, especially sensitive women's health issues (menstruation, pregnancy, reproductive health).
  `,
  male: `
    IDENTITY: You are Dr. Rajesh Kumar, a professional and respectful doctor with MedSahayak.
    - Experience: Broad general practice experience.
    - Tone: Professional, kind, and objective.
    - SPECIAL PROTOCOL: If the conversation involves women's health topics (pregnancy, menstruation, gynecological issues), you MUST gently suggest your female colleague. Say exactly: "For this specific concern, you might feel more comfortable speaking with my colleague Dr. Priya, who specializes in women's health. You can switch to her in the settings if you prefer, or I can continue helping you."
  `,
  neutral: `
    IDENTITY: You are MedSahayak, a neutral, professional AI medical assistant.
    - Tone: Efficient, polite, and helpful.
  `
};

const LANGUAGE_PROMPTS: Record<Language, string> = {
  en: "Reply in English.",
  hi: "Reply in Hindi (Devanagari script).",
  ta: "Reply in Tamil (Tamil script).",
  te: "Reply in Telugu (Telugu script).",
  bn: "Reply in Bengali (Bengali script).",
  mr: "Reply in Marathi (Devanagari script).",
  gu: "Reply in Gujarati (Gujarati script).",
  kn: "Reply in Kannada (Kannada script).",
  ml: "Reply in Malayalam (Malayalam script).",
  pa: "Reply in Punjabi (Gurmukhi script).",
};

export const sendMessageToGemini = async (
  history: Message[],
  currentInput: string,
  image: string | null,
  language: Language,
  persona: DoctorPersona = 'neutral'
): Promise<ChatResponse> => {
  
  try {
    const ai = getGenAI();

    const langInstruction = `${LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en} Keep the language simple and conversational, appropriate for rural users in India.`;

    const historyContents = history.map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'model',
      parts: [
        ...(msg.image ? [{
          inlineData: {
            mimeType: 'image/jpeg',
            data: msg.image.split(',')[1] 
          }
        }] : []),
        { text: msg.text }
      ]
    }));

    const userParts: any[] = [{ text: currentInput }];
    if (image) {
      userParts.unshift({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.split(',')[1]
        }
      });
    }

    const personaInstruction = PERSONA_INSTRUCTIONS[persona];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...historyContents,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION_BASE}\n${personaInstruction}\n${langInstruction}`,
        thinkingConfig: { thinkingBudget: 16384 } // High thinking budget for medical reasoning
      }
    });

    const rawText = response.text || "I am having trouble connecting. Please check your internet or API Key.";
    
    // Check for emergency tag
    const isEmergency = rawText.includes("[[EMERGENCY]]");
    const cleanText = rawText.replace("[[EMERGENCY]]", "").trim();

    return {
      text: cleanText,
      isEmergency
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API Key")) {
      return { text: "API Key Error. Please check settings.", isEmergency: false };
    }
    return { text: "I encountered a network error. Please try again.", isEmergency: false };
  }
};

export const analyzeMedicalReport = async (
  images: string[],
  language: Language
): Promise<string> => {
  try {
    const ai = getGenAI();
    const languageName = LANGUAGE_PROMPTS[language] || "English";

    // Prepare image parts
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg/png handling
        data: img.split(',')[1]
      }
    }));

    const prompt = `
      You are analyzing a medical document (prescription, lab report, scan, X-ray) for a patient who speaks ${languageName}.
   
      Your tasks:
      1. Identify the document type
      2. Extract all key information (medicines, test values, diagnoses)
      3. Explain findings in simple terms (avoid medical jargon)
      4. Highlight any concerning values or findings
      5. Provide clear next steps
      
      Respond in ${languageName} language using simple words.
      
      Format your response with these sections (translate section headers to ${languageName} if appropriate):
      📋 Document Type: [prescription/blood test/X-ray/etc]
      
      🔍 Key Findings:
      [List main findings, medications, or test results]
      
      💡 What This Means:
      [Explain in simple language what the findings indicate]
      
      ⚠️ Important Notes:
      [Any concerning values or warnings]
      
      ✅ Next Steps:
      [Clear actions the patient should take]
      
      💊 Medications (if prescription):
      [List medicines with timing: 'Take [medicine] [when] [how often]']
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: prompt }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "I could not analyze the report. Please try again with a clearer image.";

  } catch (error: any) {
    console.error("Report Analysis Error:", error);
    return "Error analyzing report. Please check your API key or internet connection.";
  }
};

export const generateMedicalReport = async (
  history: Message[],
  language: Language
): Promise<MedicalReport> => {
  try {
    const ai = getGenAI();
    const conversationText = history.map(m => `${m.sender}: ${m.text}`).join('\n');

    // Force English for Report Generation to ensure PDF compatibility
    const langInstruction = "IMPORTANT: Regardless of the conversation language, the Output JSON fields (summary, recommendations, potentialConditions) MUST be in ENGLISH. Do not use Hindi or other regional scripts in the JSON output to ensure system compatibility.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this consultation history and generate a structured medical summary:\n\n${conversationText}`,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION_BASE}\n${langInstruction}\nAnalyze the conversation and output a JSON object. IMPORTANT: Return the 'severity' field strictly as one of these lowercase strings: 'low', 'medium', 'high', 'emergency'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Brief summary of symptoms and assessment in English" },
            potentialConditions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of possible conditions (non-definitive) in English"
            },
            severity: { 
              type: Type.STRING, 
              enum: ["low", "medium", "high", "emergency"],
              description: "Triage level"
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable next steps (e.g., see a doctor, rest, hydration) in English"
            },
            disclaimer: { type: Type.STRING, description: "Standard medical disclaimer" }
          },
          required: ["summary", "potentialConditions", "severity", "recommendations", "disclaimer"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as MedicalReport;
      // Defensive coding: ensure severity is lowercase to match frontend enums
      if (parsed.severity) {
        parsed.severity = parsed.severity.toLowerCase() as Severity;
      }
      return parsed;
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Report Generation Error:", error);
    return {
      summary: "Could not generate report. Please check API Key.",
      potentialConditions: [],
      severity: Severity.LOW,
      recommendations: ["Please consult a doctor manually."],
      disclaimer: "System error or Missing API Key."
    };
  }
};