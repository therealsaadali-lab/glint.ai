// script.js - Pure App Functionality (Theme Logic Removed)
// =========================================================

// Global variable to hold the current chat ID
let currentChatId = null;
let isChatInitialized = false; // Flag to prevent double initialization

// ==================== MULTI-API FUNCTIONS ====================

/**
 * Get appropriate API key based on request type
 * @param {string} type - 'text', 'image', 'voice', or 'coding'
 * @returns {string} - API key
 */
function getApiKey(type) {
    switch(type) {
        case 'text':
            return localStorage.getItem('glint_text_api') || '';
        case 'image':
            return localStorage.getItem('glint_image_api') || '';
        case 'voice':
            return localStorage.getItem('glint_voice_api') || '';
        case 'coding':
            return localStorage.getItem('glint_coding_api') || '';
        default:
            return localStorage.getItem('glint_text_api') || '';
    }
}

/**
 * Make API call based on type and content
 * @param {string} type - 'text', 'image', 'voice', or 'coding'
 * @param {string} content - User input or request
 * @param {object} options - Additional options
 * @returns {Promise} - API response
 */
async function makeApiCall(type, content, options = {}) {
    const apiKey = getApiKey(type);
    
    // Agar API key nahi hai, toh Demo Response ke liye error throw nahi hoga.
    // Error sirf tab throw hoga jab `addMessage` function mein API call ho aur key na ho.
    if (!apiKey) {
        throw new Error(`${type.toUpperCase()} API key not configured. Please check settings.`);
    }
    
    try {
        switch(type) {
            case 'text':
                return await callTextApi(content, apiKey, options);
            case 'image':
                return await callImageApi(content, apiKey, options);
            case 'voice':
                // Voice API mein, content woh text hoga jise speech mein convert karna hai.
                return await callVoiceApi(content, apiKey, options);
            case 'coding':
                return await callCodingApi(content, apiKey, options);
            default:
                throw new Error('Unknown API type');
        }
    } catch (error) {
        // Console mein error log karo
        console.error(`⚠️ ${type.toUpperCase()} API Error:`, error);
        // Aur isko aage badha do taake 'addMessage' function isko user ko dikha sake.
        throw error;
    }
}

/**
 * Text API Call - DeepSeek (deepseek-chat)
 */
async function callTextApi(message, apiKey, options = {}) {
    const deepSeekUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    const response = await fetch(deepSeekUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat', // DeepSeek Text Model
            messages: [
                { role: 'system', content: `You are GLINT, an AI assistant built by Guru (an app developer). You respond concisely in Roman Urdu. ${options.systemPrompt || ''}` },
                { role: 'user', content: message }
            ],
            max_tokens: options.max_tokens || 512,
            temperature: options.temperature || 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown DeepSeek Text API error' }));
        throw new Error(`DeepSeek Text API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Image API Call - DeepAI (text2img)
 */
async function callImageApi(prompt, apiKey, options = {}) {
    const deepAiUrl = 'https://api.deepai.org/api/text2img';
    
    // DeepAI requires a FormData body and the API key in the 'api-key' header
    const form = new FormData();
    form.append('text', prompt);
    
    const response = await fetch(deepAiUrl, {
        method: 'POST',
        headers: {
            // Note: Content-Type is typically not set when using FormData
            'api-key': apiKey,
        },
        body: form,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepAI Image API Error: ${response.status} - ${errorText.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    return data.output_url; // DeepAI output is { id: '...', output_url: '...' }
}

/**
 * Voice API Call - Play.ht/EdenAI Placeholder (Needs Backend Proxy)
 */
async function callVoiceApi(textToSpeak, apiKey, options = {}) {
    // ⚠️ ZAROORI NOTE: Play.ht (Text-to-Speech) APIs client-side se direct call karna mushkil hai 
    // (CORS aur complex streaming ki wajah se). Iske liye backend proxy ki zaroorat padegi.

    console.error("Play.ht/Voice API needs backend integration for full functionality.");

    // Hum abhi ke liye ek clear error message denge
    const language = localStorage.getItem('selectedLanguage') || 'roman-urdu';
    let errorMessage;
    
    if (language === 'roman-urdu') {
        errorMessage = '❌ Voice API (Play.ht/EdenAI) browser se direct kaam nahi karta. Iske liye aapko backend proxy ya special SDK ki zaroorat padegi. Jab tak yeh fix nahi hota, Voice feature kaam nahi karega.';
    } else {
        errorMessage = '❌ Voice API (Play.ht/EdenAI) cannot be called directly from the browser. A backend proxy or specialized SDK is required. The Voice feature will not work until then.';
    }

    throw new Error(errorMessage);
}

/**
 * Coding API Call - DeepSeek (deepseek-coder)
 */
async function callCodingApi(message, apiKey, options = {}) {
    const deepSeekUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    const response = await fetch(deepSeekUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-coder', // DeepSeek Coding Model
            messages: [
                { 
                    role: 'system', 
                    content: 'You are an expert programming assistant named GLINT. Provide clean, efficient code with explanations in a Roman Urdu/Urdu blend where possible. Always use proper syntax highlighting and code formatting.'
                },
                { role: 'user', content: message }
            ],
            max_tokens: options.max_tokens || 2048,
            temperature: options.temperature || 0.3
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown DeepSeek Coding API error' }));
        throw new Error(`DeepSeek Coding API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Smart API Router - Automatically detects which API to use
 */
function detectApiType(message) {
    const lowerMsg = message.toLowerCase();
    
    // Image-related keywords
    const imageKeywords = ['image', 'photo', 'picture', 'generate image', 'create image', 'draw', 'visual', 'painting', 'artwork'];
    // Voice-related keywords  
    const voiceKeywords = ['voice', 'speech', 'audio', 'record', 'listen', 'speak', 'microphone', 'sound', 'text to speech', 'tts'];
    // Coding-related keywords
    const codingKeywords = ['code', 'function', 'program', 'script', 'algorithm', 'debug', 'error', 'fix', 'build', 'create', 'develop', 'write', 'make', 'javascript', 'python', 'html', 'css', 'react', 'node', 'api', 'loop', 'array', 'object', 'class', 'component', 'database', 'variable', 'syntax'];
    
    if (imageKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'image';
    } else if (voiceKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'voice';
    } else if (codingKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'coding';
    } else {
        return 'text';
    }
}

/**
 * Get demo response when API is not configured
 */
function getDemoResponse(language, apiType, userMessage) {
  const responses = {
    text: {
      'roman-urdu': 'Main tumhara message receive kar liya! Yeh Text API ka demo response hai, Guru. Text API key configure karein actual AI responses ke liye.',
      'urdu': 'میں نے آپ کا پیغام وصول کر لیا ہے! یہ ٹیکسٹ API کا ڈیمو جواب ہے، گرو۔ حقیقی AI جوابات کے لیے ٹیکسٹ API کنفیگر کریں۔',
      'english': 'I have received your message! This is a Text API demo response. Configure Text API key for actual AI responses.'
    },
    image: {
      'roman-urdu': `🖼️ Image Generation Demo\n\nPrompt: "${userMessage}"\n\n(Actual image generation ke liye Image API key configure karein)`,
      'urdu': `🖼️ امیج جنریشن ڈیمو\n\nپرامپٹ: "${userMessage}"\n\n(حقیقی امیج جنریشن کے لیے امیج API کنفیگر کریں)`,
      'english': `🖼️ Image Generation Demo\n\nPrompt: "${userMessage}"\n\n(Configure Image API key for actual image generation)`
    },
    voice: {
      'roman-urdu': `🎤 Voice Processing Demo\n\nRequest: "${userMessage}"\n\n(Actual voice processing ke liye Voice API key configure karein)`,
      'urdu': `🎤 وائس پروسیسنگ ڈیمو\n\nدرخواست: "${userMessage}"\n\n(حقیقی وائس پروسیسنگ کے لیے وائس API کنفیگر کریں)`,
      'english': `🎤 Voice Processing Demo\n\nRequest: "${userMessage}"\n\n(Configure Voice API key for actual voice processing)`
    },
    coding: {
      'roman-urdu': `💻 Code Generation Demo\n\nRequest: "${userMessage}"\n\n(Actual code generation ke liye Coding API key configure karein)`,
      'urdu': `💻 کوڈ جنریشن ڈیمو\n\nدرخواست: "${userMessage}"\n\n(حقیقی کوڈ جنریشن کے لیے کوڈنگ API کنفیگر کریں)`,
      'english': `💻 Code Generation Demo\n\nRequest: "${userMessage}"\n\n(Configure Coding API key for actual code generation)`
    }
  };
  
  return responses[apiType][language] || responses[apiType]['english'];
}

// ==================== MEDIA STORAGE FUNCTIONS ====================

/**
 * 1. Save Photo to Local Storage
 * @param {string} imageData - Base64 encoded image data
 * @param {string} fileName - Name of the file
 * @returns {string} - Unique ID for the saved photo
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
            timestamp: new Date().toISOString()
        };

        // Get existing media storage or create new
        let mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
        
        // Initialize chat media array if not exists
        if (!mediaStorage[currentChatId]) {
            mediaStorage[currentChatId] = [];
        }

        // Add new photo
        mediaStorage[currentChatId].push(photoData);
        
        // Save back to localStorage
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
 * @param {Blob} audioBlob - Audio blob from recorder
 * @param {string} fileName - Name of the file
 * @returns {string} - Unique ID for the saved voice
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
                    timestamp: new Date().toISOString(),
                    duration: 0 // You can calculate this if needed
                };

                // Get existing media storage
                let mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
                
                // Initialize chat media array if not exists
                if (!mediaStorage[currentChatId]) {
                    mediaStorage[currentChatId] = [];
                }

                // Add new voice recording
                mediaStorage[currentChatId].push(voiceData);
                
                // Save back to localStorage
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
 * @returns {Array} - Array of media objects for current chat
 */
function getChatMedia() {
    try {
        if (!currentChatId) {
            console.warn("No current chat ID to get media");
            return [];
        }

        const mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
        const chatMedia = mediaStorage[currentChatId] || [];
        
        console.log(`📁 Found ${chatMedia.length} media files for chat ${currentChatId}`);
        return chatMedia;
    } catch (error) {
        console.error('⚠️ Error getting chat media:', error);
        return [];
    }
}

/**
 * 4. Display Media in Chat
 * @param {string} mediaId - ID of media to display
 * @param {string} mediaType - 'photo' or 'voice'
 */
function displayMediaInChat(mediaId, mediaType) {
    try {
        const mediaStorage = JSON.parse(localStorage.getItem('glintMediaStorage')) || {};
        const chatMedia = mediaStorage[currentChatId] || [];
        
        const mediaItem = chatMedia.find(item => item.id === mediaId);
        if (!mediaItem) {
            console.error('Media item not found:', mediaId);
            return;
        }

        const messagesEl = document.getElementById('messages');
        if (!messagesEl) return;

        const mediaDiv = document.createElement('div');
        mediaDiv.className = `bubble user media-message`;

        if (mediaType === 'photo') {
            mediaDiv.innerHTML = `
                <div class="media-header">
                    <strong>📸 Photo: ${mediaItem.fileName}</strong>
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

        // Prepend for column-reverse layout
        messagesEl.prepend(mediaDiv);
        
        // 🛠️ JOKER FIX: Direct scroll
        messagesEl.scrollTop = 0;
        saveCurrentChat(); // Save chat after adding media

        console.log(`✅ Media displayed: ${mediaId}`);

    } catch (error) {
        console.error('⚠️ Error displaying media:', error);
    }
}

// ==================== VOICE RECORDING FUNCTIONALITY ====================

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

/**
 * Initialize Voice Recording
 */
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
            voicePanel.classList.toggle('show');
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
                        
                        // Enable play and save buttons
                        if (playRecordedBtn) playRecordedBtn.disabled = false;
                        if (saveRecordedBtn) saveRecordedBtn.disabled = false;
                        
                        // Stop all tracks
                        stream.getTracks().forEach(track => track.stop());
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    
                    // Update UI
                    startRecordBtn.disabled = true;
                    if (stopRecordBtn) stopRecordBtn.disabled = false;
                    
                    // Start timer
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
                    
                    // Update UI
                    if (startRecordBtn) startRecordBtn.disabled = false;
                    stopRecordBtn.disabled = true;
                    
                    // Stop timer
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
                        
                        // Add to chat
                        addMessage(`Voice message: ${fileName}`, 'user');
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

// ==================== UPDATED MEDIA PANEL ====================

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
        const voiceBtn = document.getElementById('voiceBtn');

        if (!mediaBtn || !mediaPanel) {
            return;
        }

        mediaBtn.addEventListener('click', () => {
            mediaPanel.classList.toggle('show');
        });

        // Photos functionality - UPDATED WITH STORAGE
        if (photosBtn && photosInput) {
            photosBtn.addEventListener('click', () => {
                photosInput.click();
            });

            photosInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        // Save photo to storage
                        const photoId = savePhotoToStorage(event.target.result, file.name);
                        
                        if (photoId) {
                            // Add message and display photo
                            addMessage(`Photo uploaded: ${file.name}`, 'user');
                            displayMediaInChat(photoId, 'photo');
                        }
                    };
                    reader.readAsDataURL(file);
                }
                mediaPanel.classList.remove('show');
            });
        }

        // File functionality
        if (fileBtn && fileInput) {
            fileBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    addMessage(`File uploaded: ${file.name}`, 'user'); 
                }
                mediaPanel.classList.remove('show');
            });
        }

        // Camera functionality - UPDATED WITH STORAGE
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
                
                // Save captured photo to storage
                const fileName = `camera-photo-${Date.now()}.png`;
                const photoId = savePhotoToStorage(imageData, fileName);
                
                if (photoId) {
                    // Add message and display photo
                    addMessage('Photo captured from camera!', 'user');
                    displayMediaInChat(photoId, 'photo');
                }
                
                // Stop camera and close modal
                if (cameraVideo.srcObject) {
                    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                cameraModal.classList.remove('show');
            });
        }

        // Voice button - already handled in initializeVoiceRecording

    } catch (err) {
        console.error("⚠️ Error in initializeMediaPanel:", err);
    }
}

// ==================== CHAT HISTORY MANAGEMENT ====================

/**
 * 1. Generates a new unique ID.
 * 2. Updates the chatList in Local Storage.
 * 3. Loads the new empty chat.
 * @param {boolean} shouldReload - Agar true ho toh page ko reload karega (New Chat button se).
 */
function startNewChat(shouldReload = false) {
    // Unique ID banao (timestamp is simple)
    const newId = 'chat-' + Date.now();
    
    // Date ke format ko thoda Urdu-style bana dete hain for flavor
    const chatName = 'Nai Chat ' + new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
    });

    let chatList = JSON.parse(localStorage.getItem('glintChatList')) || [];
    
    // Nayi chat list mein daalo (unshift = uper daalna, taake latest uper rahe)
    chatList.unshift({ 
        id: newId, 
        name: chatName, 
        date: new Date().toISOString() 
    });

    localStorage.setItem('glintChatList', JSON.stringify(chatList));

    // 🛑 JOKER'S FIX: Agar New Chat button se aaye hain toh force reload karo 🛑
    if (shouldReload) {
        window.location.replace('index.html?chatId=' + newId);
        return; // Redirect ke baad function yahin ruk jaega
    }
    // -------------------------------------------------------------------------
    
    // URL ko change karo taake naya chatId reflect ho, but page reload na ho (PushState)
    if (window.history.pushState) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?chatId=' + newId;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // Current chat ID ko update karke, naye chat ko load karo
    currentChatId = newId; 
    loadChat(currentChatId);
    console.log(`🚀 New chat started: ${newId}.`);

    // Drawer band karo
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("drawerOverlay");
    if (drawer && overlay) {
         drawer.classList.remove("open");
         overlay.classList.remove("show");
    }
}

/**
 * Load Chat History from Local Storage using the given ID and renders it.
 * @param {string} chatId - The unique ID of the conversation.
 */
function loadChat(chatId) {
    const messagesEl = document.getElementById("messages");
    if (!messagesEl) {
        console.error("⚠️ Messages element (#messages) not found.");
        return;
    }
    
    // Chat ID ko global mein set karo
    currentChatId = chatId;
    
    const chatHistoryHTML = localStorage.getItem('messages_html_' + chatId);
    
    if (chatHistoryHTML) {
        messagesEl.innerHTML = chatHistoryHTML;
        
        // Load and display media for this chat
        const chatMedia = getChatMedia();
        chatMedia.forEach(media => {
            // Media already included in HTML, no need to re-add
        });
    } else {
        // Agar pehla message available ho (jaise welcome message)
        messagesEl.innerHTML = document.querySelector('.welcome-message') ? document.querySelector('.welcome-message').outerHTML : ''; 
    }
    
    // Chat ka naam header mein update karo
    const chatList = JSON.parse(localStorage.getItem('glintChatList')) || [];
    const currentChatData = chatList.find(c => c.id === chatId);
    const chatTitleEl = document.getElementById('chatTitle');
    
    if (chatTitleEl) {
        if (currentChatData) {
            chatTitleEl.innerText = currentChatData.name;
        } else {
            // Agar ID invalid ho lekin hum load kar rahe hain, toh default naam
            chatTitleEl.innerText = "Glint Chat";
        }
    }

    fixMessagePosition(); // Fix scroll
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
        // Sirf HTML ko save karein
        localStorage.setItem('messages_html_' + currentChatId, messagesEl.innerHTML);
    }
    console.log(`✅ Chat ${currentChatId} saved!`);
}

// ==================== CODING ASSISTANT FUNCTION (OBSOLETE AFTER API INTEGRATION) ====================
/**
 * Checks if user message is coding-related and provides intelligent response
 * NOTE: This function is now OBSOLETE as the primary coding response comes from the makeApiCall in addMessage
 * It remains here as a fallback/example.
 * @param {string} userMessage - The user's input message
 * @returns {string} - AI-generated coding response
 */
function handleCodingRequest(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  
  // Common coding keywords
  const codingKeywords = [
    'code', 'function', 'program', 'script', 'algorithm', 'debug', 
    'error', 'fix', 'build', 'create', 'develop', 'write', 'make',
    'javascript', 'python', 'html', 'css', 'react', 'node', 'api',
    'loop', 'array', 'object', 'class', 'component', 'database'
  ];
  
  // Check if message is coding-related
  const isCoding = codingKeywords.some(keyword => lowerMsg.includes(keyword));
  
  if (!isCoding) {
    return null; // Not a coding request
  }
  
  // NOTE: Ab hum yahan se API call karenge, isliye yeh sirf fallback demo hai
  return null;
}

// ==================== APP FUNCTIONALITY ====================

// Drawer functionality - ULTIMATE FIXED VERSION
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

        // --- New Chat Button Logic ---
        if (newChatBtn) {
            newChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                startNewChat(true);
            });
        }
        // ------------------------------------------
        
        // Open drawer
        openDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawer.classList.add("open");
            overlay.classList.add("show");
        });

        // Close drawer via overlay
        overlay.addEventListener('click', () => {
            drawer.classList.remove("open");
            overlay.classList.remove("show");
            closeAllSubmenus();
        });

        // SUBMENU TOGGLE - ULTIMATE FIX
        const setupSubmenu = (linkId, submenuId) => {
            const link = document.getElementById(linkId);
            const submenu = document.getElementById(submenuId);
            
            if (link && submenu) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Toggle current submenu
                    const isOpen = submenu.style.display === 'block';
                    submenu.style.display = isOpen ? 'none' : 'block';
                    
                    // Close all other submenus
                    closeOtherSubmenus(submenuId);
                });
            }
        };

        // Close all other submenus except current
        function closeOtherSubmenus(currentSubmenuId) {
            document.querySelectorAll('.submenu').forEach(otherSubmenu => {
                if (otherSubmenu.id !== currentSubmenuId) {
                    otherSubmenu.style.display = 'none';
                }
            });
        }

        // Close all submenus
        function closeAllSubmenus() {
            document.querySelectorAll('.submenu').forEach(submenu => {
                submenu.style.display = 'none';
            });
        }

        // Setup all submenus
        setupSubmenu('minihubLink', 'minihubSubmenu');
        setupSubmenu('supportLink', 'supportSubmenu');
        setupSubmenu('toolsLink', 'toolsSubmenu');
        setupSubmenu('infoLink', 'infoSubmenu');

        // FIX: Allow submenu links to work properly
        document.querySelectorAll('.submenu-link').forEach(link => {
            link.addEventListener('click', function(e) {
                // Let the link work normally - don't prevent default
                // Just close the drawer and submenus
                drawer.classList.remove("open");
                overlay.classList.remove("show");
                closeAllSubmenus();
                // Link will naturally navigate to the page
            });
        });

        // Close submenus when clicking outside drawer
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.drawer') && !e.target.closest('.menu-btn')) {
                closeAllSubmenus();
            }
        });

        // Close drawer when clicking on regular links (non-submenu)
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

// Language Selection Logic (Sirf language-selection.html par hi chalega)
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
                
                if(window.showNotification) {
                    window.showNotification('✅ Language saved: ' + selectedLang + '. Redirecting...');
                } else {
                    alert('✅ Language saved: ' + selectedLang + '. Redirecting...');
                }
                
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirection is intentional here
                }, 1000);
            } else {
                 if(window.showNotification) {
                    window.showNotification('⚠️ Please select a language first!');
                } else {
                    alert('⚠️ Please select a language first!');
                }
            }
        });

    } catch (err) {
        console.error("⚠️ Error in initializeLanguageSelection:", err);
    }
}

// Message position fix
function fixMessagePosition() {
    try {
        const messagesEl = document.getElementById("messages");
        if (messagesEl) {
            // Scroll to the top (which is the newest message in column-reverse)
            messagesEl.scrollTop = 0;
            console.log('✅ Message position fixed (Scrolled to top)');
        }
    } catch (err) {
        console.error("⚠️ Error in fixMessagePosition:", err);
    }
}

// ==================== UPDATED ADD MESSAGE FUNCTION ====================

function addMessage(text, type) {
  try {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl || !currentChatId) {
      console.error('⚠️ Messages element not found or currentChatId is missing.');
      if (type === 'user') {
          startNewChat();
          setTimeout(() => addMessage(text, type), 500);
      }
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `bubble ${type}`;
    messageDiv.textContent = text;

    messagesEl.prepend(messageDiv);
    
    // 🛠️ JOKER FIX 1: Scrolling issue ka hal. Direct scroll to top (newest message).
    messagesEl.scrollTop = 0;
    
    if (type === 'user') {
      // ✅ NEW: Smart API Detection and Response
      const apiType = detectApiType(text);
      
      // Coding request check is now done inside the API call logic
      
      // Spinner/loading message daal do
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'bubble bot loading-message';
      loadingMessage.innerHTML = `<span class="spinner"></span> ${apiType.toUpperCase()} API se jawab aa raha hai...`;
      messagesEl.prepend(loadingMessage);
      
      messagesEl.scrollTop = 0;

      // Smart API Response
      setTimeout(async () => {
        try {
          let botResponse;
          
          // Check if API keys are configured
          const apiKey = getApiKey(apiType);
          if (apiKey) {
            // Use actual API
            botResponse = await makeApiCall(apiType, text);
          } else {
            // Fallback to demo response
            const selectedLang = localStorage.getItem('selectedLanguage') || 'english';
            botResponse = getDemoResponse(selectedLang, apiType, text);
          }
          
          // Loading message hatao
          loadingMessage.remove();
          
          const botMessage = document.createElement('div');
          botMessage.className = 'bubble bot';
          
          // Handle different response types
          if (apiType === 'image' && botResponse && botResponse.startsWith('http')) {
            botMessage.innerHTML = `
              <strong>🖼️ Generated Image:</strong><br>
              <img src="${botResponse}" alt="Generated image" style="max-width: 100%; border-radius: 10px; margin: 10px 0;" />
              <br><em>Prompt: "${text}"</em>
            `;
          } else {
            // Text or Coding response
            // DeepSeek se aane wale code ko pre-formatted rakhenge
            botMessage.innerHTML = botResponse.replace(/\n/g, '<br>');
          }
          
          messagesEl.prepend(botMessage);
          
          // 🛠️ JOKER FIX 3: Scroll fix
          messagesEl.scrollTop = 0;
          
          saveCurrentChat();
          
        } catch (error) {
          // Error handling
          loadingMessage.remove();
          const errorMessage = document.createElement('div');
          errorMessage.className = 'bubble bot error';
          
          // Voice API ka special error message agar aaye
          if (apiType === 'voice' && error.message.includes('backend proxy')) {
              errorMessage.textContent = error.message;
          } else {
              errorMessage.textContent = `❌ API Error: ${error.message}. Please check your API configuration.`;
          }
          
          messagesEl.prepend(errorMessage);
          // 🛠️ JOKER FIX 4: Scroll fix
          messagesEl.scrollTop = 0;
          
          saveCurrentChat();
        }
      }, 1000);
    }
    
  } catch (err) {
    console.error("⚠️ Error in addMessage:", err);
  }
}

// Chat initialization (Sirf index.html par hi chalega)
function initializeChat() {
    try {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');

        if (!sendBtn || !input) {
            return;
        }

        const sendMessage = () => {
            if (input.value.trim()) {
                addMessage(input.value, 'user');
                input.value = '';
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

// Placeholder saveMessage function is now OBSOLETE
function saveMessage(message) {
  console.log('🔰 Single message save is now deprecated. Using saveCurrentChat for full history.');
}

// Expose saveMessage globally
window.saveMessage = saveMessage; 


// ==================== API SETTINGS PAGE FUNCTIONALITY (NEW - BASED ON USER'S HTML) ====================

/**
 * Update API status indicators based on keys in localStorage
 */
function updateApiStatus() {
    const textKey = localStorage.getItem('glint_text_api');
    const imageKey = localStorage.getItem('glint_image_api');
    const voiceKey = localStorage.getItem('glint_voice_api');
    const codingKey = localStorage.getItem('glint_coding_api');
    
    const textApiStatus = document.getElementById('textApiStatus');
    const imageApiStatus = document.getElementById('imageApiStatus');
    const voiceApiStatus = document.getElementById('voiceApiStatus');
    const codingApiStatus = document.getElementById('codingApiStatus');

    if (textApiStatus) {
        textApiStatus.textContent = textKey ? '🟢 Configured' : '🔴 Not Configured';
        textApiStatus.className = textKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
    if (imageApiStatus) {
        imageApiStatus.textContent = imageKey ? '🟢 Configured' : '🔴 Not Configured';
        imageApiStatus.className = imageKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
    if (voiceApiStatus) {
        voiceApiStatus.textContent = voiceKey ? '🟢 Configured' : '🔴 Not Configured';
        voiceApiStatus.className = voiceKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
    if (codingApiStatus) {
        codingApiStatus.textContent = codingKey ? '🟢 Configured' : '🔴 Not Configured';
        codingApiStatus.className = codingKey ? 'status-indicator configured' : 'status-indicator not-configured';
    }
}

/**
 * API Settings Page ki functionality ko shuru karta hai.
 * Yeh function 'settings.html' par chalega.
 */
function initializeApiSettings() {
    // Input elements
    const textApiKeyInput = document.getElementById('textApiKeyInput');
    const imageApiKeyInput = document.getElementById('imageApiKeyInput');
    const voiceApiKeyInput = document.getElementById('voiceApiKeyInput');
    const codingApiKeyInput = document.getElementById('codingApiKeyInput');
    
    // Save buttons
    const saveTextApiBtn = document.getElementById('saveTextApiBtn');
    const saveImageApiBtn = document.getElementById('saveImageApiBtn');
    const saveVoiceApiBtn = document.getElementById('saveVoiceApiBtn');
    const saveCodingApiBtn = document.getElementById('saveCodingApiBtn');
    
    const testAllApisBtn = document.getElementById('testAllApisBtn');

    if (!textApiKeyInput) return; // Agar elements nahi mile, toh function rok do

    // Load existing keys
    textApiKeyInput.value = localStorage.getItem('glint_text_api') || '';
    imageApiKeyInput.value = localStorage.getItem('glint_image_api') || '';
    voiceApiKeyInput.value = localStorage.getItem('glint_voice_api') || '';
    codingApiKeyInput.value = localStorage.getItem('glint_coding_api') || '';

    updateApiStatus(); // Initial status update

    // --- Save Logic for Text API ---
    if(saveTextApiBtn) saveTextApiBtn.addEventListener('click', () => {
        const apiKey = textApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('glint_text_api', apiKey);
            alert("✅ Text API key saved successfully!");
        } else {
            localStorage.removeItem('glint_text_api');
            alert("⚠️ Text API key cleared.");
            textApiKeyInput.value = '';
        }
        updateApiStatus();
    });

    // --- Save Logic for Image API ---
    if(saveImageApiBtn) saveImageApiBtn.addEventListener('click', () => {
        const apiKey = imageApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('glint_image_api', apiKey);
            alert("✅ Image API key saved successfully!");
        } else {
            localStorage.removeItem('glint_image_api');
            alert("⚠️ Image API key cleared.");
            imageApiKeyInput.value = '';
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
            alert("✅ Coding API key saved successfully!");
        } else {
            localStorage.removeItem('glint_coding_api');
            alert("⚠️ Coding API key cleared.");
            codingApiKeyInput.value = '';
        }
        updateApiStatus();
    });

    // Enter key support for all inputs
    [textApiKeyInput, imageApiKeyInput, voiceApiKeyInput, codingApiKeyInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            // Find the closest parent 'input-group' and click the save button inside it
            const saveBtn = input.closest('.input-group').querySelector('.save-btn');
            if (saveBtn) saveBtn.click();
          }
        });
    });
    
    // Test All APIs Logic
    if(testAllApisBtn) testAllApisBtn.addEventListener('click', async () => {
        const results = [];
        const types = ['text', 'image', 'voice', 'coding'];
        
        types.forEach(type => {
            const key = localStorage.getItem(`glint_${type}_api`);
            const status = key ? '🟢 Configured' : '🔴 Not Configured';
            
            let label;
            switch(type) {
                case 'text': label = '🔤 Text API:'; break;
                case 'image': label = '🖼️ Image API:'; break;
                case 'voice': label = '🎤 Voice API:'; break;
                case 'coding': label = '💻 Coding API:'; break;
                default: label = `${type.toUpperCase()} API:`;
            }
            results.push(`${label} ${status}`);
        });
        
        alert('🧪 API Test Results:\n\n' + results.join('\n'));
    });
    
    console.log('✅ API Settings Logic initialized.');
}

// ==================== MAIN INITIALIZATION (The Final Flow) ====================
document.addEventListener('DOMContentLoaded', () => {
  if (isChatInitialized) return; // Double check
  isChatInitialized = true;
  
  try {
    // 1. Determine current page
    const path = window.location.pathname;
    const isChatPage = path.endsWith('index.html') || path.endsWith('/');
    const isLangPage = path.endsWith('language-selection.html');
    const isSettingsPage = path.endsWith('settings.html'); // ✅ Settings Page check

    // 2. Initialize Common Functionality (Drawer, Media, Voice) - HAR PAGE PAR
    initializeDrawer();
    initializeMediaPanel();
    initializeVoiceRecording(); // NEW: Voice recording initialization
    
    // 3. CHAT PAGE LOGIC - (SIRF index.html PAR CHALEGA)
    if (isChatPage) {
        initializeChat(); // Input and Send button logic
        
        const urlParams = new URLSearchParams(window.location.search);
        const requestedChatId = urlParams.get('chatId');

        if (requestedChatId) {
            // Loading an existing chat (if user manually shares link)
            currentChatId = requestedChatId;
            loadChat(currentChatId); 
        } else {
            // ✅ ALWAYS START FRESH — do not auto-load latest chat
            startNewChat(); 
        }
    }
    
    // 4. LANGUAGE PAGE LOGIC - (SIRF language-selection.html PAR CHALEGA)
    if (isLangPage) {
        initializeLanguageSelection(); // Language selection aur save button ki logic
    }
    
    // 5. API SETTINGS LOGIC - (SIRF settings.html PAR CHALEGA)
    if (isSettingsPage) {
        initializeApiSettings(); // ✅ API Key Save/Load Logic
    }
    
    // Final scroll fix
    fixMessagePosition(); 

    console.log('✅ All scripts initialized successfully');
  } catch (err) {
    console.error('⚠️ Error in DOMContentLoaded:', err);
  }
});

// =========================================================

