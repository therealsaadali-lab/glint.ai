// script.js - Pure App Functionality (2025 INFORMATION READY - IMAGE GENERATION REMOVED)
// =========================================================
// Global variable to hold the current chat ID
let currentChatId = null;
let isChatInitialized = false; // Flag to prevent double initialization

// ==================== LANGUAGE & SYSTEM INSTRUCTION LOGIC (2025 READY) ====================
/**
 * 🚨 UPDATED: 2025 Information Ready System Instruction
 * @param {string} apiType - 'text' ya 'coding' (image removed)
 * @returns {string} - Complete instruction for the Gemini Model.
 */
function getSystemInstruction(apiType) {
    // Agar selected language Local Storage mein nahi hai, toh default 'roman-urdu' set karo.
    const selectedLang = localStorage.getItem('selectedLanguage') || 'roman-urdu';
    let languageInstruction = '';
    // 1. Language-Specific Instruction
    switch (selectedLang) {
        case 'roman-urdu':
            languageInstruction = "**hamesha** (always) aur **sirf** (only) Roman Urdu/Urdu blend (English letters) mein jawab doge. Hindi (Devanagari), Urdu (Perso-Arabic script) ya pure English use nahi karna hai.";
            break;
        case 'urdu':
            languageInstruction = "**hamesha** (always) aur **sirf** (only) Urdu (Nastaliq/Perso-Arabic script) mein jawab doge. Roman Urdu ya English use nahi karna hai.";
            break;
        case 'hindi':
            languageInstruction = "**hamesha** (always) aur **sirf** (only) Hindi (Devanagari script) mein jawab doge. Roman Urdu ya English use nahi karna hai.";
            break;
        case 'chinese':
            languageInstruction = "**hamesha** (always) aur **sirf** (only) Standard Chinese (Mandarin) mein jawab doge. Tum English, Urdu, ya Roman Urdu use nahi karoge. Tum Chinese characters (simplified ya traditional) mein jawab doge.";
            break;
        case 'arabic':
            languageInstruction = "**hamesha** (always) aur **sirf** (only) Standard Arabic (العربية) mein jawab doge. Roman Urdu ya English use nahi karna hai. Jawab hamesha saaf aur fasih Arabic mein hona chahiye.";
            break;
        case 'english':
        default:
            languageInstruction = "**always** and **only** respond in fluent English. Do not use any other language or script.";
            break;
    }
    // 2. Role-Specific Instruction (Context) - 2025 READY
    let baseInstruction = '';
    if (apiType === 'coding') {
        // 🔥 2025 READY CODING MODE
        baseInstruction = `Tum ek maahir programming teacher ho jiska naam GLINT hai. Tum 2025 tak ki latest programming trends, frameworks aur technologies ki updated information rakhte ho. Users coding screenshots bhejte hain jismein errors, code, ya programming problems hote hain. Tum image analyze karke:
1. Error identify karo (latest frameworks ke hisaab se)
2. Problem ka reason samjhao
3. Step-by-step solution do
4. 2025 ke best practices batayo
5. Code examples do (triple backticks mein)

Har jawab ${selectedLang} mein simple aur beginner-friendly tareeke se dena. Agar koi specific 2025 technology ka sawal ho toh uski latest information do.`;
    } else { // text API (image removed)
        // 🔥 FIXED: Forced greeting removed
        baseInstruction = `Tumhara naam GLINT hai. Tum ek helpful aur informative AI ho.
        Tum 2025 tak ki updated information rakhte ho. Har sawal ka jawab detail mein, examples ke saath, aur selected language mein do. Agar koi complex topic ho, toh use simple terms mein samjhaao.`;
    }
    // 3. Final Combined Instruction
    return `${baseInstruction} Tum ${languageInstruction}`;
}

// ==================== MULTI-API FUNCTIONS (IMAGE REMOVED) ====================
/**
 * Get appropriate API key based on request type
 * @param {string} type - 'text', 'voice', or 'coding'
 * @returns {string} - API key
 */
function getApiKey(type) {
    switch(type) {
        case 'text':
            return localStorage.getItem('glint_text_api') || '';
        case 'voice':
            return localStorage.getItem('glint_voice_api') || '';
        case 'coding':
            return localStorage.getItem('glint_coding_api') || '';
        default:
            // Fallback to text key if an unknown type is passed
            return localStorage.getItem('glint_text_api') || '';
    }
}

/**
 * Make API call based on type and content
 * @param {string} type - 'text', 'voice', or 'coding'
 * @param {string} content - User input or request
 * @param {Array} mediaParts - Array of media objects (for multimodal)
 * @param {object} options - Additional options
 * @returns {Promise} - API response (or demo response if key is missing)
 */
async function makeApiCall(type, content, mediaParts = [], options = {}) {
    const apiKey = getApiKey(type);
    // ✅ FIX: Agar API key nahi hai toh demo response return karo
    if (!apiKey || apiKey.trim() === '') {
        console.warn(`🔑 ${type.toUpperCase()} API Key Missing. Returning Demo Response.`);
        const selectedLang = localStorage.getItem('selectedLanguage') || 'roman-urdu'; 
        return getDemoResponse(selectedLang, type, content);
    }
    try {
        switch(type) {
            case 'text':
                return await callTextApi(content, apiKey, mediaParts, options);
            case 'voice':
                return await callVoiceApi(content, apiKey, options);
            case 'coding':
                return await callCodingApi(content, apiKey, options);
            default:
                throw new Error('Unknown API type');
        }
    } catch (error) {
        console.error(`⚠️ ${type.toUpperCase()} API Error:`, error);
        throw error;
    }
}

/**
 * Common Function for API Response Validation
 */
function validateGeminiResponse(data) {
    const candidate = data.candidates && data.candidates[0];
    if (candidate) {
        if (candidate.finishReason === 'SAFETY') {
            const safetyRatings = candidate.safetyRatings ? JSON.stringify(candidate.safetyRatings, null, 2) : 'N/A';
            throw new Error(`Response blocked due to safety settings. Finish Reason: SAFETY. Safety Details: ${safetyRatings}`);
        }
        if (candidate.finishReason === 'MAX_TOKENS') {
             throw new Error("Response incomplete! Finish Reason: MAX_TOKENS. The response exceeded the set token limit (4096). Please rephrase or try a simpler query.");
        }
        if (candidate.content && candidate.content.parts && candidate.content.parts[0].text) {
            return candidate.content.parts[0].text.trim();
        }
    }
    const finishReason = candidate && candidate.finishReason ? candidate.finishReason : 'Unknown Reason (No Candidate)';
    const promptFeedback = data.promptFeedback ? JSON.stringify(data.promptFeedback, null, 2) : 'N/A';
    throw new Error(`API returned an incomplete or invalid response structure. Finish Reason: ${finishReason}. Prompt Feedback: ${promptFeedback}`);
}

// 🚨 MEMORY FIX: Text API Call - WITH CONVERSATION HISTORY
/**
 * Text API Call - Gemini (gemini-2.5-flash-lite) - WITH MEMORY FIX
 * @param {string} message - The user prompt
 * @param {string} apiKey - API key
 * @param {Array} mediaParts - Array of media objects (Base64)
 */
async function callTextApi(message, apiKey, mediaParts = [], options = {}) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    // 🚨 MEMORY FIX: Pehle se stored conversation history load karo
    let conversationHistory = JSON.parse(localStorage.getItem(`conversation_history_${currentChatId}`)) || [];
    // 🚨 SYSTEM INSTRUCTION FIX: Sirf pehli baar bhejo
    if (conversationHistory.length === 0) {
        const systemInstruction = getSystemInstruction('text');
        conversationHistory.push({
            role: "user",
            parts: [{ text: systemInstruction }]
        });
    }
    // Current message add karo
    const userParts = [{ text: message }];
    mediaParts.forEach(media => {
        if (media.type === 'photo' && media.data) {
            userParts.unshift({ 
                inlineData: {
                    mimeType: media.mimeType || 'image/jpeg', 
                    data: media.data.split(',')[1]
                }
            });
        }
    });
    conversationHistory.push({
        role: "user",
        parts: userParts
    });
    // Payload with COMPLETE history
    const payload = {
        contents: conversationHistory, // 🚨 PURANI HISTORY SAATH BHEJO
        generationConfig: {
            maxOutputTokens: options.max_tokens || 2048, 
            temperature: options.temperature || 0.7
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };
    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown Gemini API error' }));
        throw new Error(`Gemini Text API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    const botResponse = validateGeminiResponse(data);
    // 🚨 MEMORY FIX: Bot ka response bhi history mein save karo
    conversationHistory.push({
        role: "model", 
        parts: [{ text: botResponse }]
    });
    // History save karo (last 20 messages tak limit karo)
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    localStorage.setItem(`conversation_history_${currentChatId}`, JSON.stringify(conversationHistory));
    return botResponse;
}

// 🚨 MEMORY FIX: Coding API Call - WITH PROPER HISTORY HANDLING
/**
 * Coding API Call - Gemini (gemini-2.5-flash-lite) - WITH MEMORY FIX
 */
async function callCodingApi(message, apiKey, options = {}) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    // 🚨 MEMORY FIX: Pehle se stored conversation history load karo
    let conversationHistory = JSON.parse(localStorage.getItem(`conversation_history_${currentChatId}`)) || [];
    // 🚨 SYSTEM INSTRUCTION FIX: Sirf pehli baar bhejo
    if (conversationHistory.length === 0) {
        const systemInstruction = getSystemInstruction('coding');
        conversationHistory.push({
            role: "user",
            parts: [{ text: systemInstruction }]
        });
    }
    // Current message add karo
    conversationHistory.push({
        role: "user",
        parts: [{ text: message }]  // 🚨 FIX: "User Request:" hata diya
    });
    // Payload for coding WITH HISTORY
    const payload = {
        contents: conversationHistory, // 🚨 PURANI HISTORY SAATH BHEJO
        generationConfig: {
            maxOutputTokens: options.max_tokens || 4096,
            temperature: options.temperature || 0.3 // Low temperature for code accuracy
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };
    console.log('🔧 Coding API Payload:', JSON.stringify(payload, null, 2));
    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown Gemini API error' }));
        throw new Error(`Gemini Coding API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    const botResponse = validateGeminiResponse(data);
    // 🚨 MEMORY FIX: Bot ka response bhi history mein save karo
    conversationHistory.push({
        role: "model", 
        parts: [{ text: botResponse }]
    });
    // History save karo (last 20 messages tak limit karo)
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    localStorage.setItem(`conversation_history_${currentChatId}`, JSON.stringify(conversationHistory));
    return botResponse;
}

/**
 * Voice API Call - Play.ht/EdenAI Placeholder (Needs Backend Proxy)
 */
async function callVoiceApi(textToSpeak, apiKey, options = {}) {
    console.error("Play.ht/Voice API needs backend integration for full functionality.");
    const language = localStorage.getItem('selectedLanguage') || 'roman-urdu';
    let errorMessage;
    if (language === 'roman-urdu' || language === 'urdu' || language === 'hindi' || language === 'arabic') {
        errorMessage = '❌ Voice API (Play.ht/EdenAI) browser se direct kaam nahi karta. Iske liye aapko backend proxy ya special SDK ki zaroorat padegi.';
    } else {
        errorMessage = '❌ Voice API (Play.ht/EdenAI) cannot be called directly from the browser. A backend proxy or specialized SDK is required.';
    }
    throw new Error(errorMessage);
}

/**
 * Smart API Router - Automatically detects which API to use
 * 🔥 IMPROVED: Better coding detection for screenshot analysis
 */
function detectApiType(message) {
    const lowerMsg = message.toLowerCase();
    const voiceKeywords = ['voice', 'speech', 'audio', 'record', 'listen', 'speak', 'microphone', 'sound', 'text to speech', 'tts', 'awaz'];
    // 🔥 IMPROVED: Coding keywords expanded for better screenshot detection
    const codingKeywords = ['code', 'function', 'program', 'script', 'algorithm', 'debug', 'error', 'fix', 'build', 'create', 'develop', 'write', 'make', 'javascript', 'python', 'html', 'css', 'react', 'node', 'api', 'loop', 'array', 'object', 'class', 'component', 'database', 'variable', 'syntax', 'coding', 'chahiye', 'index.html', 'programming', 'screenshot', 'photo', 'image', 'mistake', 'problem', 'issue', 'not working', 'error', 'bug'];
    // 1. Coding ko sabse pehle check karo (Kyunki yeh specific hai)
    if (codingKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'coding';
    } 
    // 2. Phir Voice ko check karo
    else if (voiceKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'voice';
    } 
    // 3. Baqi sab Text hain
    else {
        return 'text';
    }
}

/**
 * Get demo response when API is not configured - UPDATED for 2025
 */
function getDemoResponse(language, apiType, userMessage) {
  const responses = {
    text: {
      'roman-urdu': `Main tumhara message receive kar liya! "${userMessage}" - Yeh 2025 ke latest information ke mutabiq jawab hai. Actual AI responses ke liye Gemini API key configure karein.`,
      'urdu': `میں نے آپ کا پیغام وصول کر لیا ہے! "${userMessage}" - یہ 2025 کی تازہ ترین معلومات کے مطابق جواب ہے۔ حقیقی AI جوابات کے لیے جیمنی API کنفیگر کریں۔`,
      'hindi': `मैंने आपका संदेश प्राप्त कर लिया है! "${userMessage}" - यह 2025 की नवीनतम जानकारी के अनुसार उत्तर है। वास्तविक AI जवाबों के लिए जेमिनी API कॉन्फ़िगर करें।`,
      'chinese': `我已收到您的消息！"${userMessage}" - 这是根据2025年最新信息的回复。请配置Gemini API密钥以获取实际的AI回复。`,
      'arabic': `لقد استلمت رسالتك! "${userMessage}" - هذا رد وفق أحدث معلومات 2025. قم بتهيئة مفتاح API الخاص بـ Gemini للحصول على ردود الذكاء الاصطناعي الفعلية.`,
      'english': `I have received your message! "${userMessage}" - This is a response based on 2025 latest information. Configure Gemini API key for actual AI responses.`
    },
    voice: {
      'roman-urdu': `🎤 Gemini Voice Processing Demo
Request: "${userMessage}"
(Actual voice processing ke liye Voice API key configure karein)`,
      'urdu': `🎤 جیمنی وائس پروسیسنگ ڈیمو
درخواست: "${userMessage}"
(حقیقی وائس پروسیسنگ کے لیے وائس API کنفیگر کریں)`,
      'hindi': `🎤 जेमिनी वॉयस प्रोसेसिंग डेमو
अनुरोध: "${userMessage}"
(वास्तविक वॉयस प्रोसेसिंग के लिए वॉयस API कॉन्फ़िगर करें)`,
      'chinese': `🎤 Gemini 语音处理演示
请求: "${userMessage}"
(请配置 Voice API 密钥以进行实际的语音处理)`,
      'arabic': `🎤 عرض توضيحي لمعالجة الصوت Gemini
الطلب: "${userMessage}"
(قم بتهيئة مفتاح Voice API الخاص بك لمعالجة الصوت الفعلي)`,
      'english': `🎤 Gemini Voice Processing Demo
Request: "${userMessage}"
(Configure Voice API key for actual voice processing)`
    },
    coding: {
      'roman-urdu': `💻 Gemini Code Generation Demo
Request: "${userMessage}"
(Actual code generation aur 2025 ke latest programming solutions ke liye Gemini API key configure karein)`,
      'urdu': `💻 جیمنی کوڈ جنریشن ڈیمو
درخواست: "${userMessage}"
(حقیقی کوڈ جنریشن اور 2025 کے لیٹیسٹ پروگرامنگ سولوشنز کے لیے جیمنی API کنفیگر کریں)`,
      'hindi': `💻 जेमिनी कोड जनरेशन डेमو
अनुरोध: "${userMessage}"
(वास्तविक कोड जनरेशन और 2025 के नवीनतम प्रोग्रामिंग समाधानों के लिए जेमिनी API कॉन्फ़िगर करें)`,
      'chinese': `💻 Gemini 代码生成演示
请求: "${userMessage}"
(请配置 Gemini API 密钥以进行实际的代码生成和2025年最新编程解决方案)`,
      'arabic': `💻 عرض توضيحي لتوليد رمز Gemini
الطلب: "${userMessage}"
(قم بتهيئة مفتاح API الخاص بـ Gemini لإنشاء التعليمات البرمجية الفعلية وحلول البرمجة الأحدث لعام 2025)`,
      'english': `💻 Gemini Code Generation Demo
Request: "${userMessage}"
(Configure Gemini API key for actual code generation and 2025 latest programming solutions)`
    }
  };
  // Sahi language response ya English fallback
  return responses[apiType][language] || responses[apiType]['english'];
}

// ==================== MEDIA STORAGE FUNCTIONS ====================
/**
 * 1. Save Photo to Local Storage
 */
function savePhotoToStorage(imageData, fileName) {
    try {
        if (!currentChatId) {
            console.error("Cannot save photo: No current chat ID");
            return null;
        }
        const photoId = 'photo-' + Date.now();
        const photoData = {
            id: photoId,
            chatId: currentChatId,
            data: imageData,
            fileName: fileName,
            type: 'photo',
            mimeType: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg', // Simple mimeType guess
            timestamp: new Date().toISOString()
        };
        let mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
        if (!mediaStorage[currentChatId]) {
            mediaStorage[currentChatId] = [];
        }
        mediaStorage[currentChatId].push(photoData);
        localStorage.setItem('glintMediaStorage', JSON.stringify(mediaStorage));
        console.log(`✅ Photo saved: ${fileName} (ID: ${photoId})`);
        return photoId;
    } catch (error) {
        console.error('⚠️ Error saving photo:', error);
        return null;
    }
}

/**
 * 2. Save Voice Recording to Local Storage
 */
function saveVoiceToStorage(audioBlob, fileName) {
    return new Promise((resolve, reject) => {
        try {
            if (!currentChatId) {
                reject("Cannot save voice: No current chat ID");
                return;
            }
            const reader = new FileReader();
            reader.onload = function() {
                const voiceId = 'voice-' + Date.now();
                const voiceData = {
                    id: voiceId,
                    chatId: currentChatId,
                    data: reader.result, // Base64 audio data
                    fileName: fileName,
                    type: 'voice',
                    mimeType: 'audio/wav',
                    timestamp: new Date().toISOString(),
                    duration: 0 
                };
                let mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
                if (!mediaStorage[currentChatId]) {
                    mediaStorage[currentChatId] = [];
                }
                mediaStorage[currentChatId].push(voiceData);
                localStorage.setItem('glintMediaStorage', JSON.stringify(mediaStorage));
                console.log(`✅ Voice saved: ${fileName} (ID: ${voiceId})`);
                resolve(voiceId);
            };
            reader.onerror = () => reject('File reading failed');
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('⚠️ Error saving voice:', error);
            reject(error);
        }
    });
}

/**
 * 3. Get All Media for Current Chat
 */
function getChatMedia() {
    try {
        if (!currentChatId) {
            console.warn("No current chat ID to get media");
            return [];
        }
        const mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
        const chatMedia = mediaStorage[currentChatId] || [];
        return chatMedia;
    } catch (error) {
        console.error('⚠️ Error getting chat media:', error);
        return [];
    }
}

/**
 * 4. Get a Specific Media Item
 */
function getMediaItem(mediaId) {
    const chatMedia = getChatMedia();
    return chatMedia.find(item => item.id === mediaId);
}

/**
 * 5. Display Media in Chat
 */
function displayMediaInChat(mediaId, mediaType) {
    try {
        const mediaItem = getMediaItem(mediaId);
        if (!mediaItem) {
            console.error('Media item not found:', mediaId);
            return;
        }
        const messagesEl = document.getElementById('messages');
        if (!messagesEl) return;
        // Check if the media message already exists to avoid duplication on load/save
        if (messagesEl.querySelector(`[data-media-id="${mediaId}"]`)) {
            return;
        }
        const mediaDiv = document.createElement('div');
        mediaDiv.className = `bubble user media-message`;
        mediaDiv.setAttribute('data-media-id', mediaId);
        if (mediaType === 'photo') {
            mediaDiv.innerHTML = `
                <div class="media-header">
                    <strong>📸 Coding Screenshot: ${mediaItem.fileName}</strong>
                </div>
                <img src="${mediaItem.data}" alt="${mediaItem.fileName}" class="media-preview" />
                <div class="media-time">${new Date(mediaItem.timestamp).toLocaleTimeString()}</div>
            `;
        } else if (mediaType === 'voice') {
            mediaDiv.innerHTML = `
                <div class="media-header">
                    <strong>🎤 Voice: ${mediaItem.fileName}</strong>
                </div>
                <audio controls class="voice-player">
                    <source src="${mediaItem.data}" type="audio/wav">
                    Your browser does not support audio element.
                </audio>
                <div class="media-time">${new Date(mediaItem.timestamp).toLocaleTimeString()}</div>
            `;
        }
        messagesEl.prepend(mediaDiv);
        messagesEl.scrollTop = 0;
        saveCurrentChat(); 
    } catch (error) {
        console.error('⚠️ Error displaying media:', error);
    }
}

// ==================== VOICE/MEDIA PANEL AND LOGIC ====================
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
function initializeVoiceRecording() {
    try {
        const voiceBtn = document.getElementById('voiceBtn');
        const voicePanel = document.getElementById('voicePanel');
        const startRecordBtn = document.getElementById('startRecordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');
        const recordingTimer = document.getElementById('recordingTimer');
        const playRecordedBtn = document.getElementById('playRecordedBtn');
        const saveRecordedBtn = document.getElementById('saveRecordedBtn');
        const recordedAudio = document.getElementById('recordedAudio');
        if (!voiceBtn) return;
        let recordingStartTime = 0;
        let timerInterval = null;
        voiceBtn.addEventListener('click', () => {
            if (voicePanel) voicePanel.classList.toggle('show');
        });
        // Start Recording
        if (startRecordBtn) {
            startRecordBtn.addEventListener('click', async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioChunks = [];
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };
                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        if (recordedAudio) {
                            recordedAudio.src = audioUrl;
                        }
                        if (playRecordedBtn) playRecordedBtn.disabled = false;
                        if (saveRecordedBtn) saveRecordedBtn.disabled = false;
                        stream.getTracks().forEach(track => track.stop());
                    };
                    mediaRecorder.start();
                    isRecording = true;
                    startRecordBtn.disabled = true;
                    if (stopRecordBtn) stopRecordBtn.disabled = false;
                    recordingStartTime = Date.now();
                    if (recordingTimer) {
                        recordingTimer.style.display = 'block';
                        timerInterval = setInterval(updateRecordingTimer, 1000);
                    }
                    console.log('🎤 Recording started...');
                } catch (error) {
                    console.error('⚠️ Error starting recording:', error);
                    addMessage('Microphone access denied. Please allow microphone permissions.', 'bot');
                }
            });
        }
        // Stop Recording
        if (stopRecordBtn) {
            stopRecordBtn.addEventListener('click', () => {
                if (mediaRecorder && isRecording) {
                    mediaRecorder.stop();
                    isRecording = false;
                    if (startRecordBtn) startRecordBtn.disabled = false;
                    stopRecordBtn.disabled = true;
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    console.log('⏹️ Recording stopped');
                }
            });
        }
        // Play Recorded Audio
        if (playRecordedBtn) {
            playRecordedBtn.addEventListener('click', () => {
                if (recordedAudio && recordedAudio.src) {
                    recordedAudio.play();
                }
            });
        }
        // Save Recorded Audio
        if (saveRecordedBtn) {
            saveRecordedBtn.addEventListener('click', async () => {
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const fileName = `voice-message-${Date.now()}.wav`;
                    try {
                        const voiceId = await saveVoiceToStorage(audioBlob, fileName);
                        // Add to chat and tell AI to process (using voice API type in message)
                        addMessage(`Voice message uploaded: ${fileName} [MEDIA_ID:${voiceId}]`, 'user', voiceId);
                        displayMediaInChat(voiceId, 'voice');
                        // Reset UI
                        voicePanel.classList.remove('show');
                        if (recordedAudio) recordedAudio.src = '';
                        playRecordedBtn.disabled = true;
                        saveRecordedBtn.disabled = true;
                        if (recordingTimer) recordingTimer.style.display = 'none';
                    } catch (error) {
                        console.error('Error saving voice:', error);
                        addMessage('Error saving voice message.', 'bot');
                    }
                }
            });
        }
        function updateRecordingTimer() {
            if (recordingTimer) {
                const seconds = Math.floor((Date.now() - recordingStartTime) / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                recordingTimer.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        }
    } catch (error) {
        console.error('⚠️ Error initializing voice recording:', error);
    }
}

// 🚨 IMPROVED: initializeMediaPanel - Better messages for coding screenshots
function initializeMediaPanel() {
    try {
        const mediaBtn = document.getElementById('mediaBtn');
        const mediaPanel = document.getElementById('mediaPanel');
        const photosBtn = document.getElementById('photosBtn');
        const fileBtn = document.getElementById('fileBtn');
        const photosInput = document.getElementById('photosInput');
        const fileInput = document.getElementById('fileInput');
        const cameraBtn = document.getElementById('cameraBtn');
        const cameraModal = document.getElementById('cameraModal');
        const closeCamera = document.getElementById('closeCamera');
        const cameraVideo = document.getElementById('cameraVideo');
        const captureBtn = document.getElementById('captureBtn');
        if (!mediaBtn || !mediaPanel) {
            return;
        }
        mediaBtn.addEventListener('click', () => {
            mediaPanel.classList.toggle('show');
        });
        // Photos functionality - IMPROVED FOR CODING SCREENSHOTS
        if (photosBtn && photosInput) {
            photosBtn.addEventListener('click', () => {
                photosInput.click();
            });
            photosInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const photoId = savePhotoToStorage(event.target.result, file.name);
                        if (photoId) {
                            // 🔥 IMPROVED: Better message for coding screenshots
                            addMessage(`Coding screenshot uploaded: ${file.name}. Is image mein jo code error ya problem dikh raha hai use analyze karo aur 2025 ke latest solutions ke saath meri selected language mein step-by-step solution do.`, 'user', photoId);
                            displayMediaInChat(photoId, 'photo');
                        }
                    };
                    reader.readAsDataURL(file);
                }
                mediaPanel.classList.remove('show');
            });
        }
        // File functionality (Placeholder for file upload)
        if (fileBtn && fileInput) {
            fileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    addMessage(`File uploaded: ${file.name}. Is file ke bare mein 2025 ki latest information ke saath meri selected language mein jawab do.`, 'user'); // Text only for generic files
                }
                mediaPanel.classList.remove('show');
            });
        }
        // Camera functionality - IMPROVED FOR CODING SCREENSHOTS
        if (cameraBtn && cameraModal) {
            cameraBtn.addEventListener('click', async () => {
                mediaPanel.classList.remove('show');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    cameraVideo.srcObject = stream;
                    cameraModal.classList.add('show');
                } catch (err) {
                    console.error('⚠️ Camera access failed:', err);
                    addMessage('Camera access denied. Please allow camera permissions.', 'bot');
                }
            });
            closeCamera.addEventListener('click', () => {
                if (cameraVideo.srcObject) {
                    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                cameraModal.classList.remove('show');
            });
            captureBtn.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = cameraVideo.videoWidth;
                canvas.height = cameraVideo.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(cameraVideo, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                const fileName = `coding-screenshot-${Date.now()}.png`;
                const photoId = savePhotoToStorage(imageData, fileName);
                if (photoId) {
                    // 🔥 IMPROVED: Better message for coding screenshots
                    addMessage('Coding screenshot captured! Is image mein jo code error ya problem dikh raha hai use analyze karo aur 2025 ke latest solutions ke saath meri selected language mein step-by-step solution do.', 'user', photoId);
                    displayMediaInChat(photoId, 'photo');
                }
                if (cameraVideo.srcObject) {
                    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                cameraModal.classList.remove('show');
            });
        }
    } catch (err) {
        console.error("⚠️ Error in initializeMediaPanel:", err);
    }
}

// ==================== CODE COPY FUNCTIONALITY ====================
/**
 * 🆕 GLOBAL COPY FUNCTION - FIXED
 */
function copyCode(buttonElement) {
    const codeBlock = buttonElement.previousElementSibling;
    const codeText = codeBlock.textContent || codeBlock.innerText;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = codeText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        buttonElement.textContent = 'Copied!';
        setTimeout(() => {
            buttonElement.textContent = 'Copy';
        }, 2000);
    });
}

/**
 * Code blocks mein copy buttons add karta hai
 */
function initializeCodeCopyButtons() {
    try {
        console.log('🔄 Initializing code copy buttons...');
        // Pehle existing code blocks mein copy buttons add karo
        addCopyButtonsToExistingCodeBlocks();
        // MutationObserver for new code blocks
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // Check for new code blocks
                            if (node.classList && node.classList.contains('bubble') && node.classList.contains('bot')) {
                                setTimeout(() => {
                                    addCopyButtonsToCodeBlocks(node);
                                }, 100);
                            }
                            // Check for pre elements inside new nodes
                            if (node.querySelector && node.querySelector('pre')) {
                                setTimeout(() => {
                                    addCopyButtonsToCodeBlocks(node);
                                }, 100);
                            }
                        }
                    });
                }
            });
        });
        const messagesEl = document.getElementById('messages');
        if (messagesEl) {
            observer.observe(messagesEl, {
                childList: true,
                subtree: true
            });
        }
        console.log('✅ Code copy buttons initialized');
    } catch (error) {
        console.error('⚠️ Error initializing code copy buttons:', error);
    }
}

/**
 * Existing code blocks mein copy buttons add karta hai
 */
function addCopyButtonsToExistingCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.bubble.bot pre');
    console.log(`🔧 Found ${codeBlocks.length} existing code blocks`);
    codeBlocks.forEach((preElement, index) => {
        addCopyButtonToCodeBlock(preElement, index);
    });
}

/**
 * Specific container ke andar ke code blocks mein copy buttons add karta hai
 */
function addCopyButtonsToCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll ? container.querySelectorAll('pre') : [];
    console.log(`🔧 Found ${codeBlocks.length} code blocks to process`);
    codeBlocks.forEach((preElement, index) => {
        // Check if already has copy button
        if (!preElement.parentElement.classList.contains('code-block-container')) {
            setTimeout(() => {
                addCopyButtonToCodeBlock(preElement, index);
            }, 50);
        }
    });
}

/**
 * Single code block mein copy button add karta hai
 */
function addCopyButtonToCodeBlock(preElement, index) {
    try {
        // Check karo agar pehle se wrapper nahi hai
        if (preElement.parentElement.classList.contains('code-block-container')) {
            return;
        }
        // Naya wrapper banayein
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-container';
        // Copy button banayein
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.textContent = 'Copy';
        copyButton.setAttribute('onclick', 'copyCode(this)');
        copyButton.setAttribute('data-code-index', index);
        // Replace pre element with wrapper
        preElement.parentNode.insertBefore(wrapper, preElement);
        wrapper.appendChild(preElement);
        wrapper.appendChild(copyButton);
    } catch (error) {
        console.error('⚠️ Error adding copy button to code block:', error);
    }
}

// ==================== CHAT HISTORY MANAGEMENT ====================
/**
 * Generates a new unique ID.
 */
function startNewChat(shouldReload = false) {
    const newId = 'chat-' + Date.now();
    const chatName = 'Nai Chat ' + new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
    });
    // 🚨 MEMORY FIX: Purani chat ki history clear karo
    if (currentChatId) {
        localStorage.removeItem(`conversation_history_${currentChatId}`);
    }
    let chatList = JSON.parse(localStorage.getItem('glintChatList')) || [];
    chatList.unshift({ 
        id: newId, 
        name: chatName, 
        date: new Date().toISOString() 
    });
    localStorage.setItem('glintChatList', JSON.stringify(chatList));
    if (shouldReload) {
        window.location.replace('index.html?chatId=' + newId);
        return; 
    }
    if (window.history.pushState) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?chatId=' + newId;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }
    currentChatId = newId; 
    loadChat(currentChatId);
    console.log(`🚀 New chat started: ${newId}.`);
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("drawerOverlay");
    if (drawer && overlay) {
         drawer.classList.remove("open");
         overlay.classList.remove("show");
    }
}

/**
 * Load Chat History from Local Storage using the given ID and renders it.
 */
function loadChat(chatId) {
    const messagesEl = document.getElementById("messages");
    if (!messagesEl) {
        console.error("⚠️ Messages element (#messages) not found.");
        return;
    }
    currentChatId = chatId;
    const chatHistoryHTML = localStorage.getItem('messages_html_' + chatId);
    if (chatHistoryHTML) {
        messagesEl.innerHTML = chatHistoryHTML;
        // Load hone ke baad copy buttons initialize karo
        setTimeout(() => {
            initializeCodeCopyButtons();
        }, 100);
    } else {
        messagesEl.innerHTML = document.querySelector('.welcome-message') ? document.querySelector('.welcome-message').outerHTML : ''; 
    }
    const chatList = JSON.parse(localStorage.getItem('glintChatList')) || [];
    const currentChatData = chatList.find(c => c.id === chatId);
    const chatTitleEl = document.getElementById('chatTitle');
    if (chatTitleEl) {
        if (currentChatData) {
            chatTitleEl.innerText = currentChatData.name;
        } else {
            chatTitleEl.innerText = "Glint Chat";
        }
    }
    fixMessagePosition(); 
    console.log(`💬 Loaded chat: ${chatId} successfully.`);
}

/**
 * Save current messages HTML to Local Storage.
 */
function saveCurrentChat() {
    if (!currentChatId) {
        console.warn("Cannot save chat: No currentChatId. Chat ID must be set before sending first message.");
        return;
    }
    const messagesEl = document.getElementById('messages');
    if (messagesEl) {
        localStorage.setItem('messages_html_' + currentChatId, messagesEl.innerHTML);
    }
    console.log(`✅ Chat ${currentChatId} saved!`);
}

/**
 * Drawer and Nav Logic
 */
function initializeDrawer() {
    try {
        const drawer = document.getElementById("drawer");
        const overlay = document.getElementById("drawerOverlay");
        const openDrawerBtn = document.getElementById("openDrawer");
        const newChatBtn = document.getElementById("newChatBtn"); 
        if (!drawer || !overlay || !openDrawerBtn) {
          console.error("⚠️ Drawer elements not found");
          return;
        }
        if (newChatBtn) {
            newChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                startNewChat(true); 
            });
        }
        openDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawer.classList.add("open");
            overlay.classList.add("show");
        });
        overlay.addEventListener('click', () => {
            drawer.classList.remove("open");
            overlay.classList.remove("show");
            closeAllSubmenus();
        });
        const setupSubmenu = (linkId, submenuId) => {
            const link = document.getElementById(linkId);
            const submenu = document.getElementById(submenuId);
            if (link && submenu) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const isOpen = submenu.style.display === 'block';
                    submenu.style.display = isOpen ? 'none' : 'block';
                    closeOtherSubmenus(submenuId);
                });
            }
        };
        function closeOtherSubmenus(currentSubmenuId) {
            document.querySelectorAll('.submenu').forEach(otherSubmenu => {
                if (otherSubmenu.id !== currentSubmenuId) {
                    otherSubmenu.style.display = 'none';
                }
            });
        }
        function closeAllSubmenus() {
            document.querySelectorAll('.submenu').forEach(submenu => {
                submenu.style.display = 'none';
            });
        }
        setupSubmenu('minihubLink', 'minihubSubmenu');
        setupSubmenu('supportLink', 'supportSubmenu');
        setupSubmenu('toolsLink', 'toolsSubmenu');
        setupSubmenu('infoLink', 'infoSubmenu');
        document.querySelectorAll('.submenu-link').forEach(link => {
            link.addEventListener('click', function(e) {
                drawer.classList.remove("open");
                overlay.classList.remove("show");
                closeAllSubmenus();
            });
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.drawer') && !e.target.closest('.menu-btn')) {
                closeAllSubmenus();
            }
        });
        const regularLinks = document.querySelectorAll('#savedChatsLink, #newProjectLink');
        regularLinks.forEach(link => {
            link.addEventListener('click', () => {
                drawer.classList.remove("open");
                overlay.classList.remove("show");
                closeAllSubmenus();
            });
        });
        console.log('✅ Drawer initialized successfully');
    } catch (err) {
        console.error("⚠️ Error in initializeDrawer:", err);
    }
}

/**
 * Language Selection Page Logic
 */
function initializeLanguageSelection() {
    try {
        const languageOptions = document.querySelectorAll('.language-option');
        const saveBtn = document.getElementById('saveBtn');
        if (languageOptions.length === 0 || !saveBtn) {
            return;
        }
        console.log('✅ Initializing Language Selection Page Logic');
        const savedLang = localStorage.getItem('selectedLanguage') || 'roman-urdu'; 
        languageOptions.forEach(option => {
            if (option.getAttribute('data-lang') === savedLang) {
                option.classList.add('selected');
            }
        });
        languageOptions.forEach(option => {
            option.addEventListener('click', function() {
                languageOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        saveBtn.addEventListener('click', function() {
            const selectedOption = document.querySelector('.language-option.selected');
            if (selectedOption) {
                const selectedLang = selectedOption.getAttribute('data-lang');
                localStorage.setItem('selectedLanguage', selectedLang);
                alert('✅ Language saved: ' + selectedLang + '. Redirecting...'); 
                setTimeout(() => {
                    window.location.href = 'index.html'; 
                }, 1000);
            } else {
                alert('⚠️ Please select a language first!');
            }
        });
    } catch (err) {
        console.error("⚠️ Error in initializeLanguageSelection:", err);
    }
}

/**
 * Scroll to top on load/message add
 */
function fixMessagePosition() {
    try {
        const messagesEl = document.getElementById("messages");
        if (messagesEl) {
            messagesEl.scrollTop = 0;
            console.log('✅ Message position fixed (Scrolled to top)');
        }
    } catch (err) {
        console.error("⚠️ Error in fixMessagePosition:", err);
    }
}

/**
 * Chat Input and Send button logic
 */
function initializeChat() {
    try {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');
        if (!sendBtn || !input) {
            return;
        }

        // 🔥 CRITICAL FIX 1: Voice Button Toggle Logic
        const voiceBtn = document.getElementById('voiceBtn'); 
        if (voiceBtn && sendBtn) {
            
            // 1. Input event listener for toggling visibility
            input.addEventListener('input', () => {
                if (input.value.trim().length > 0) {
                    // Agar text hai, toh voice button ko chhipao aur send button dikhao
                    sendBtn.style.display = 'flex'; 
                    voiceBtn.style.display = 'none';
                } else {
                    // Agar text nahi hai, toh send button ko chhipao aur voice button dikhao
                    sendBtn.style.display = 'none';
                    voiceBtn.style.display = 'flex'; 
                }
            });

            // 2. Initial state set karna zaroori hai
            // Jab page load ho toh shuru mein voiceBtn dikhna chahiye
            if (input.value.trim().length === 0) {
                sendBtn.style.display = 'none';
                voiceBtn.style.display = 'flex';
            } else {
                sendBtn.style.display = 'flex';
                voiceBtn.style.display = 'none';
            }
        }
        // END OF CRITICAL FIX 1

        const sendMessage = () => {
            if (input.value.trim()) {
                // Input box se aaye hue messages mein media ID null rahegi
                addMessage(input.value, 'user');
                input.value = '';
                // Message send hone ke baad UI reset karo
                if (voiceBtn && sendBtn) {
                    sendBtn.style.display = 'none';
                    voiceBtn.style.display = 'flex';
                }
            }
        };
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    } catch (err) {
        console.error("⚠️ Error in initializeChat:", err);
    }
}

// 🚨 COMPLETELY FIXED ADD MESSAGE FUNCTION (Both Issues Solved)
function addMessage(text, type, mediaId = null) {
  try {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl || !currentChatId) {
      console.error('⚠️ Messages element not found or currentChatId is missing.');
      if (type === 'user') {
          startNewChat();
          setTimeout(() => addMessage(text, type, mediaId), 500);
      }
      return;
    }
    // 🔥 CRITICAL FIX: Text ko bilkul change nahi karenge - direct use karenge
    let displayText = text;
    // Sirf text message add karein
    if (!mediaId && type === 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `bubble ${type}`;
        messageDiv.textContent = displayText; // 🔥 textContent use karo innerHTML ki jagah
        messagesEl.prepend(messageDiv);
        messagesEl.scrollTop = 0;
    }
    if (type === 'user') {
      const apiType = detectApiType(text);
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'bubble bot loading-message';
      loadingMessage.innerHTML = `<span class="spinner"></span> Gemini ${apiType.toUpperCase()} API se jawab aa raha hai...`;
      messagesEl.prepend(loadingMessage);
      messagesEl.scrollTop = 0;
      setTimeout(async () => {
        try {
          let mediaParts = [];
          if (mediaId) {
              const mediaItem = getMediaItem(mediaId);
              if (mediaItem) {
                  mediaParts.push(mediaItem);
              }
          }
          console.log(`🔑 Calling makeApiCall for ${apiType} API...`);
          const botResponse = await makeApiCall(apiType, text, mediaParts);
          loadingMessage.remove();
          // 🔥 CRITICAL FIX: Bot response ko properly format karenge
          const botMessage = document.createElement('div');
          botMessage.className = 'bubble bot';
          // Simple HTML formatting - sirf newlines ko <br> mein convert karenge
          let formattedResponse = botResponse.replace(/\n/g, '<br>');
          // 🚨 FIXED CODE BLOCKS: Proper copy buttons ke saath
          formattedResponse = formattedResponse.replace(
              /```([\s\S]*?)```/g,
              (match, code) => {
                  const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  return `<div class="code-block-container"><pre><code>${escapedCode}</code></pre><button class="copy-code-btn" onclick="copyCode(this)">Copy</button></div>`;
              }
          );
          botMessage.innerHTML = formattedResponse;
          messagesEl.prepend(botMessage);
          messagesEl.scrollTop = 0;
          // 🆕 NEW: Copy buttons initialize karo new message ke liye
          setTimeout(() => {
              addCopyButtonsToCodeBlocks(botMessage);
          }, 100);
          saveCurrentChat();
        } catch (error) {
          loadingMessage.remove();
          const errorMessage = document.createElement('div');
          errorMessage.className = 'bubble bot error';
          errorMessage.textContent = `❌ Error: ${error.message}`;
          messagesEl.prepend(errorMessage);
          messagesEl.scrollTop = 0;
          saveCurrentChat();
        }
      }, 1000);
    }
  } catch (err) {
    console.error("⚠️ Error in addMessage:", err);
  }
}

// ... (Your original API Settings logic remains here) ...
/**
 * Update API status indicators based on keys in localStorage
 */
function updateApiStatus() {
    const textKey = localStorage.getItem('glint_text_api');
    const voiceKey = localStorage.getItem('glint_voice_api');
    const codingKey = localStorage.getItem('glint_coding_api');
    const textApiStatus = document.getElementById('textApiStatus');
    const voiceApiStatus = document.getElementById('voiceApiStatus');
    const codingApiStatus = document.getElementById('codingApiStatus');
    if (textApiStatus) {
        textApiStatus.textContent = textKey ? '🟢 Configured' : '🔴 Not Configured';
        textApiStatus.className = textKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
    if (voiceApiStatus) {
        voiceApiStatus.textContent = voiceKey ? '🟡 Configured (Note: Needs Proxy)' : '🔴 Not Configured';
        voiceApiStatus.className = voiceKey ? 'status-indicator warning' : 'status-indicator not-configured';
    }
    if (codingApiStatus) {
        codingApiStatus.textContent = codingKey ? '🟢 Configured' : '🔴 Not Configured';
        codingApiStatus.className = codingKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
}

/**
 * API Settings Page ki functionality ko shuru karta hai.
 */
function initializeApiSettings() {
    // Input elements
    const textApiKeyInput = document.getElementById('textApiKeyInput');
    const voiceApiKeyInput = document.getElementById('voiceApiKeyInput');
    const codingApiKeyInput = document.getElementById('codingApiKeyInput');
    // Save buttons
    const saveTextApiBtn = document.getElementById('saveTextApiBtn');
    const saveVoiceApiBtn = document.getElementById('saveVoiceApiBtn');
    const saveCodingApiBtn = document.getElementById('saveCodingApiBtn');
    const testAllApisBtn = document.getElementById('testAllApisBtn');
    if (!textApiKeyInput) return; 
    // Load existing keys
    textApiKeyInput.value = localStorage.getItem('glint_text_api') || '';
    voiceApiKeyInput.value = localStorage.getItem('glint_voice_api') || '';
    codingApiKeyInput.value = localStorage.getItem('glint_coding_api') || '';
    updateApiStatus(); 
    // --- Save Logic for Text API ---
    if(saveTextApiBtn) saveTextApiBtn.addEventListener('click', () => {
        const apiKey = textApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('glint_text_api', apiKey);
            alert("✅ Gemini Text API key saved successfully!");
        } else {
            localStorage.removeItem('glint_text_api');
            alert("⚠️ Gemini Text API key cleared.");
            textApiKeyInput.value = '';
        }
        updateApiStatus();
    });
    // --- Save Logic for Voice API ---
    if(saveVoiceApiBtn) saveVoiceApiBtn.addEventListener('click', () => {
        const apiKey = voiceApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('glint_voice_api', apiKey);
            alert("✅ Voice API key saved successfully!");
        } else {
            localStorage.removeItem('glint_voice_api');
            alert("⚠️ Voice API key cleared.");
            voiceApiKeyInput.value = '';
        }
        updateApiStatus();
    });
    // --- Save Logic for Coding API ---
    if(saveCodingApiBtn) saveCodingApiBtn.addEventListener('click', () => {
        const apiKey = codingApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('glint_coding_api', apiKey);
            alert("✅ Gemini Coding API key saved successfully!");
        } else {
            localStorage.removeItem('glint_coding_api');
            alert("⚠️ Gemini Coding API key cleared.");
            codingApiKeyInput.value = '';
        }
        updateApiStatus();
    });
    // Enter key support for all inputs
    [textApiKeyInput, voiceApiKeyInput, codingApiKeyInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const saveBtn = input.closest('.input-group').querySelector('.save-btn');
            if (saveBtn) saveBtn.click();
          }
        });
    });
    // Test All APIs Logic
    if(testAllApisBtn) testAllApisBtn.addEventListener('click', async () => {
        const results = [];
        const types = ['text', 'voice', 'coding'];
        types.forEach(type => {
            const key = localStorage.getItem(`glint_${type}_api`);
            let status;
            if (type === 'voice' && key) {
                 status = '🟡 Configured (Note: Needs Proxy)';
            } else {
                 status = key ? '🟢 Configured' : '🔴 Not Configured';
            }
            let label;
            switch(type) {
                case 'text': label = '🔤 Gemini Text API:'; break;
                case 'voice': label = '🎤 Voice API:'; break;
                case 'coding': label = '💻 Gemini Coding API:'; break;
                default: label = `${type.toUpperCase()} API:`;
            }
            results.push(`${label} ${status}`);
        });
        alert('🧪 API Test Results:\n' + results.join('\n'));
    });
    console.log('✅ API Settings Logic initialized.');
}

// ==================== MAIN INITIALIZATION (The Final Flow) ====================
document.addEventListener('DOMContentLoaded', () => {
  if (isChatInitialized) return; 
  isChatInitialized = true;
  try {
    const path = window.location.pathname;
    const isChatPage = path.endsWith('index.html') || path.endsWith('/');
    const isLangPage = path.endsWith('language-selection.html');
    const isSettingsPage = path.endsWith('settings.html'); 
    // Common Initializations
    initializeDrawer();
    initializeMediaPanel();
    initializeVoiceRecording(); 
    if (isChatPage) {
        initializeChat(); 
        initializeCodeCopyButtons(); // 🆕 NEW: Code copy buttons initialize
        const urlParams = new URLSearchParams(window.location.search);
        const requestedChatId = urlParams.get('chatId');
        if (requestedChatId) {
            currentChatId = requestedChatId;
            loadChat(currentChatId); 
        } else {
            startNewChat(); 
        }
    }
    if (isLangPage) {
        initializeLanguageSelection(); 
    }
    if (isSettingsPage) {
        initializeApiSettings(); 
    }
    fixMessagePosition(); 
    console.log('✅ All scripts initialized successfully');
  } catch (err) {
    console.error('⚠️ Error in DOMContentLoaded:', err);
  }
});