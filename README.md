<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DfKtZw2RR_OrqnykLWfWnr4Lt3BJlChc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
**# Title: "MedSahayak Demo - AI Healthcare for Rural India"**

## The Problem
Rural India faces a severe healthcare crisis that leaves 900 million people with critically limited access to medical care. While 65% of India's population lives in rural areas, only 25% of doctors serve these regions, resulting in a doctor-to-patient ratio of 1:1,445—far worse than the WHO-recommended 1:1,000.
Beyond geographic barriers, language and cultural factors create additional obstacles. Medical consultations typically occur in English or Hindi, yet 70% of rural populations speak regional languages as their primary tongue. Women face particularly acute challenges: traditional cultural norms in many communities make it uncomfortable or impossible for women to discuss health concerns with male doctors, leading to delayed treatment and preventable complications.
The result is a healthcare desert where basic medical guidance is simply out of reach for millions who need it most.

## Our Solution: MedSahayak
MedSahayak ("Health Helper" in Hindi) is an AI-powered health assistant built on Gemini 3 Pro that breaks down three critical barriers to healthcare access: language, gender sensitivity, and geography.
Cultural Intelligence: Users can choose between Dr. Priya Sharma (female specialist), Dr. Rajesh Kumar (male physician), or a neutral AI assistant. This gender-appropriate consultation option respects traditional preferences while ensuring everyone receives professional care. The AI adapts its communication style to match the selected persona, creating a comfortable, culturally-sensitive experience.
Language Accessibility: MedSahayak provides native support for 10 Indian languages—Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and English—with natural conversation flow. Users can type, speak (voice recognition), or upload images, and receive responses in their chosen language. This eliminates the comprehension gap that often leads to misdiagnosis.
Intelligent Medical Analysis: Powered by Gemini 3 Pro's multimodal reasoning, MedSahayak processes text descriptions, voice recordings, and medical images simultaneously to provide comprehensive symptom assessment. The AI automatically classifies severity (Low, Medium, High, Emergency) and generates structured medical reports with potential conditions and recommended actions.
Actionable Healthcare Navigation: Emergency cases trigger immediate alerts with 108/112 calling and location-based hospital routing via Google Maps. Non-emergency cases receive detailed recommendations, downloadable PDF reports (shareable via WhatsApp), and medication reminder systems with browser notifications.

## Technical Architecture
**Frontend**: Built entirely in Google AI Studio using React and TypeScript, optimized for mobile-first responsive design

**AI Models**: Gemini 3 Pro - Primary model for medical consultation, multimodal reasoning, emergency detection, and report generation
Gemini 2.5 Flash - Supporting tasks like document analysis and quick translations

**Backend**: Vercel serverless functions proxy API calls, securing keys server-side while enabling scalable request handling

**Database**: Firebase provides authentication and Firestore stores consultation history, medication reminders, and user preferences with security rules for data isolation

**Maps Integration**: Google Maps Geocoding API converts user locations to coordinates; Places API searches nearby healthcare facilities filtered by severity level

**Security**: All API keys stored as Vercel environment variables, HTTPS encryption for communications, Firebase security rules prevent unauthorized data access

## Key Features
**1. Intelligent Onboarding**
Users complete a guided setup flow: select language from 10 options, provide location (with autocomplete suggestions), enter basic details (name, age, optional phone), choose doctor persona, and review their profile before starting consultations. The onboarding data personalizes every interaction.

**2. Multimodal Consultation**
- Text input: Describe symptoms in natural language
- Voice input: Speech recognition in all 10 supported languages
- Image analysis: Upload photos of rashes, wounds, swelling—Gemini 3 Pro's vision capabilities analyze visual symptoms alongside text descriptions
- Real-time responses: AI processes multimodal context and responds in the user's language
- Emergency detection: Automatically identifies life-threatening symptoms and triggers emergency protocols

**3. Medical Report Generation**
After consultation, users can generate comprehensive reports including:
- Symptom summary with severity classification (color-coded badges)
- Potential conditions based on symptoms
- Recommended actions and next steps
- Professional disclaimer
- One-click PDF download for medical records
- WhatsApp sharing to send reports to family members or doctors

**4. Location-Based Healthcare Navigation**
The facility finder geocodes the user's location (e.g., "Patna, Bihar") and searches for nearby hospitals, clinics, or pharmacies based on symptom severity. Results show distance, ratings, opening hours, and direct Google Maps integration for navigation. Emergency cases prioritize trauma centers and emergency rooms.

**5. Health Dashboard**
Timeline Tab: Visual history of all consultations with severity indicators
Medications Tab: Active medication reminders with frequency scheduling (once/twice/thrice daily), custom dose times, duration tracking, and "Mark Taken" buttons
Risk Summary Tab: Bar chart visualization showing severity distribution across consultations (Emergency/High/Medium/Low percentages)
Quick Access Tab: Saved facilities, recent shares, app statistics

**6. Medication Reminder System**
Users can set reminders for medications with customizable schedules. Browser notifications alert users at dose times. The system tracks adherence with progress bars showing doses taken vs. missed over the medication course duration (1-30 days).

## Demo Workflow
- Step 1: App loads with animated splash screen displaying "Hello" in multiple languages
- Step 2: User completes onboarding—selects Hindi, enters "Patna, Bihar" as location, provides basic details, chooses Dr. Priya Sharma
- Step 3: Chat interface loads with personalized welcome message in Hindi from Dr. Priya
- Step 4: User types symptoms in Hindi: "मुझे 3 दिन से बुखार और सिरदर्द है" (I have fever and headache for 3 days)
- Step 5: AI analyzes, responds in Hindi with follow-up questions
- Step 6: User uploads image (thermometer showing 101°F), AI incorporates visual data
- Step 7: User clicks "Generate Summary Report"—report appears with Medium severity, potential conditions (viral fever, flu), recommendations (rest, hydration, paracetamol)
- Step 8: User clicks "Find Nearby Facilities"—map shows Bihar hospitals (NOT Bangalore!), proving location-based functionality works correctly
- Step 9: User adds medication reminder: "Paracetamol 500mg, Twice daily, 3 days"—notification system activates
- Step 10: User opens dashboard to review consultation timeline and risk summary chart

## Impact & Social Good
Immediate Benefits:
- 900M+ people gain access to medical guidance in native languages
- ₹500-2000 saved per consultation (typical doctor fees + travel costs)
- 24/7 availability unlike clinic hours (9 AM - 5 PM)
- Zero cost for users—fully free AI consultation
- Gender-sensitive care improves women's healthcare access, potentially saving lives through early detection

## Use Cases:
- Preventive Care: Early symptom recognition before conditions escalate
- Triage: Severity assessment helps users determine urgency (ER vs. clinic visit vs. home care)
- Medication Adherence: Reminder systems improve treatment completion rates
- Health Literacy: Educational responses build medical knowledge in underserved communities
- Emergency Response: Rapid detection of life-threatening symptoms with immediate hospital routing

## Scale Potential:
- Target: 100M+ rural Indians in first year of deployment
- Focus: Tier 2/3 cities and rural areas with growing smartphone penetration (currently 55% and rising)
- Partnerships: Government health programs (Ayushman Bharat), NGOs (Pratham, Seva Mandir), telehealth providers


## Future Enhancements

**Phase 2 Roadmap:**
- Voice-first experience for low-literacy users (complete hands-free operation)
- Chronic disease management (diabetes, hypertension tracking with trend analysis)
- Family profiles (multi-user support with pediatric/geriatric modes)
- Telemedicine bridge (escalation to real doctors for complex cases)
- Offline mode (basic functionality with periodic sync when internet available)
- Wearable integration (real-time vitals from smartwatches/fitness bands)
- Community health worker tools (features for ASHA workers and ANMs)
- Alternative medicine integration (Ayurveda/Homeopathy recommendations)

**Technical Improvements:**
- Progressive Web App (PWA) for offline capability and app-like experience
- Flutter mobile apps for native performance on Android/iOS
- Regional language speech synthesis for audio responses (currently text-only)
- Federated learning for privacy-preserving model improvements based on usage patterns


## Technical Note
The "Reset App" button uses browser confirmation dialogs (window.confirm()) that are restricted in AI Studio's sandboxed iframe environment. For demo purposes, use the "Start New Consultation" button to begin fresh sessions—this clears the chat and starts a new consultation while preserving user profile data. All other features function fully in the public demo. When deployed outside AI Studio (e.g., Vercel, Netlify), full reset functionality is available.

## Competition Compliance
**Gemini 3 Pro Usage:**
✓ Core medical consultation reasoning
✓ Multimodal symptom analysis (text + voice + images)
✓ Emergency severity classification
✓ Structured report generation with recommendations
AI Studio Deployment:
✓ Frontend fully hosted on AI Studio
✓ Public app link accessible without login
✓ Full-screen mode enabled
✓ Demo mode available for judges without API key setup

## Conclusion
MedSahayak demonstrates that AI can be a powerful equalizer in healthcare. By combining Gemini 3 Pro's reasoning capabilities with cultural intelligence and multilingual support, we've created a tool that doesn't just translate medical consultation—it transforms access to healthcare for millions.
The app proves that advanced AI can understand not just language, but context, culture, and urgency. It shows that technology can respect traditional values (gender-appropriate care) while delivering modern solutions (AI diagnosis).
Most importantly, MedSahayak is ready to deploy today. It works on any smartphone, requires no special hardware, and costs nothing for users. This is healthcare democratization at scale.
Healthcare shouldn't depend on where you live or what language you speak. With MedSahayak and Gemini 3 Pro, it doesn't have to.
