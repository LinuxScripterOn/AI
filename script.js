// Initialize conversation history for the AI
let conversationHistory = [];
let uploadedImageDataUrl = null;
let isAITyping = false;
let shouldStopTyping = false;

/* global configuration for conversation and UI behavior */
const globalConfig = {
    /* @tweakable maximum number of messages in conversation history */
    maxConversationHistory: 50,
    
    /* @tweakable minimum number of messages to keep when pruning history */
    minConversationHistoryToKeep: 10,
    
    /* @tweakable whether to keep context of first interaction */
    preserveInitialContext: true,
    
    /* @tweakable typing animation speed (lower = faster) */
    defaultTypingSpeed: 10,
    
    /* @tweakable enable/disable syntax highlighting */
    enableSyntaxHighlighting: true,
    
    /* @tweakable enable/disable AI message action icons */
    showMessageActionIcons: true,
    
    /* @tweakable theme color palette */
    themeColors: {
        primary: '#8D67F8',
        secondary: '#FF6600',
        background: '#2c2c2c',
        text: '#e1e1e6'
    }
};

/* AI configuration settings with default values */
const aiConfig = {
    /* @tweakable instructions for AI behavior */
    instructions: "Você é o Claude Sonnet 3.7, um assistente de IA desenvolvido pela Anthropic. Você foi projetado para ser útil, inofensivo e honesto. Quando um arquivo for anexado, analise-o cuidadosamente e incorpore suas informações na resposta. Responda sempre em português brasileiro. Use o contexto de data e hora atual quando solicitado. Não use emojis em suas respostas em hipótese alguma.",
    /* @tweakable user nickname (leave empty if none) */
    nickname: "",
    /* @tweakable AI response style */
    responseStyle: "default",
    /* @tweakable typing speed (lower = faster) */
    typingSpeed: 10,
    /* @tweakable maximum file size in bytes */
    maxFileSize: 1024 * 1024,
    /* @tweakable maximum file content length */
    maxFileContentLength: 1000000
};

/* UI interaction settings */
const uiSettings = {
    /* @tweakable delay before showing upload menu (ms) */
    uploadMenuDelay: 100,
    /* @tweakable animation duration for menu (ms) */
    menuAnimationDuration: 200,
    /* @tweakable upload button size (px) */
    uploadButtonSize: 36
};

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const stopButton = document.getElementById('stop-button');
const imageUploadButton = document.getElementById('image-upload-button');
const imageUploadInput = document.getElementById('image-upload');
const textUploadInput = document.getElementById('text-upload');
const cameraInput = document.getElementById('camera-capture');
const uploadMenu = document.getElementById('upload-menu');
const overlay = document.getElementById('overlay');
const textUploadOption = document.getElementById('text-upload-option');
const cameraOption = document.getElementById('camera-option');
const galleryOption = document.getElementById('gallery-option');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const resetSettings = document.getElementById('reset-settings');
const aiInstructions = document.getElementById('ai-instructions');
const aiNickname = document.getElementById('ai-nickname');
const responseStyle = document.getElementById('response-style');

// Load settings from localStorage if available
function loadSettings() {
    const savedSettings = localStorage.getItem('aiConfig');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            Object.keys(aiConfig).forEach(key => {
                if (parsedSettings[key] !== undefined) {
                    aiConfig[key] = parsedSettings[key];
                }
            });
            
            // Update form values
            aiInstructions.value = aiConfig.instructions;
            aiNickname.value = aiConfig.nickname;
            responseStyle.value = aiConfig.responseStyle;
        } catch (error) {
            console.error('Error parsing saved settings:', error);
            // If there's an error, use default settings
        }
    }
}

// Save settings to localStorage
function saveSettingsToStorage() {
    try {
        aiConfig.instructions = aiInstructions.value;
        aiConfig.nickname = aiNickname.value;
        aiConfig.responseStyle = responseStyle.value;
        
        localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
        
        // Create and show notification
        /* notification message */
        const notificationMessage = "✓Configurações salvas com sucesso!";
        
        /* notification duration */
        const notificationDuration = 2000;
        
        const notification = document.createElement('div');
        notification.classList.add('settings-save-notification');
        notification.textContent = notificationMessage;
        
        document.body.appendChild(notification);
        
        // Trigger show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 50);
        
        // Remove notification after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, notificationDuration);
        
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Reset settings to default
function resetSettingsToDefault() {
    /* reset confirmation message */
    const resetConfirmation = confirm("Tem certeza que deseja redefinir as configurações para o padrão?");
    
    if (resetConfirmation) {
        aiConfig.instructions = "Você é o Claude Sonnet 3.7, um assistente de IA desenvolvido pela Anthropic. Você foi projetado para ser útil, inofensivo e honesto. Quando um arquivo for anexado, analise-o cuidadosamente e incorpore suas informações na resposta. Responda sempre em português brasileiro. Use o contexto de data e hora atual quando solicitado. Não use emojis em suas respostas em hipótese alguma.";
        aiConfig.nickname = "";
        aiConfig.responseStyle = "default";
        aiConfig.typingSpeed = 10;
        aiConfig.maxFileSize = 1024 * 1024;
        aiConfig.maxFileContentLength = 1000000;
        
        // Update form values
        aiInstructions.value = aiConfig.instructions;
        aiNickname.value = aiConfig.nickname;
        responseStyle.value = aiConfig.responseStyle;
        
        // Save to localStorage
        localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
        
        // Create and show notification similar to save settings
        /* reset notification message */
        const notificationMessage = "⟲ Configurações redefinidas para padrão!";
        
        /* reset notification duration */
        const notificationDuration = 2000;
        
        const notification = document.createElement('div');
        notification.classList.add('settings-save-notification');
        notification.textContent = notificationMessage;
        
        document.body.appendChild(notification);
        
        // Trigger show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 50);
        
        // Remove notification after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, notificationDuration);
    }
}

// Settings button event listeners
settingsButton.addEventListener('click', () => {
    settingsPanel.classList.add('active');
    overlay.classList.add('active');
    
    // Add subtle entrance animation for settings groups
    const settingsGroups = document.querySelectorAll('.settings-group');
    settingsGroups.forEach((group, index) => {
        group.style.animationDelay = `${index * 0.1}s`;
    });
});

closeSettings.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
    overlay.classList.remove('active');
});

saveSettings.addEventListener('click', () => {
    saveSettingsToStorage();
    settingsPanel.classList.remove('active');
    overlay.classList.remove('active');
});

resetSettings.addEventListener('click', resetSettingsToDefault);

// Adjust textarea height automatically
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    toggleSendButton();
});

// Always set dark theme by default
document.documentElement.setAttribute('data-theme', 'dark');

// Function to toggle send button visibility
function toggleSendButton() {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    if (userInput.value.trim().length > 0 || uploadedImageDataUrl) {
        sendButton.classList.remove('hidden');
        sendButton.classList.add('fade-in');
        sendButton.classList.remove('fade-out');
    } else {
        sendButton.classList.add('fade-out');
        sendButton.classList.remove('fade-in');
        
        // Remove the button after fade-out animation completes
        setTimeout(() => {
            sendButton.classList.add('hidden');
        }, 300);
    }
}

// Function to animate text typing with configurable speed
function animateTyping(element, text, speed = aiConfig.typingSpeed) {
    shouldStopTyping = false;
    return new Promise(resolve => {
        let index = 0;
        let buffer = '';
        
        const typeNext = () => {
            if (index < text.length && !shouldStopTyping) {
                // Add the next character to our buffer
                buffer += text.charAt(index);
                
                // If we find a tag opening, collect the whole tag
                if (text.charAt(index) === '<') {
                    // Find the end of the tag
                    let tempIndex = index + 1;
                    while (tempIndex < text.length && text.charAt(tempIndex) !== '>') {
                        tempIndex++;
                    }
                    
                    // If we found the end, add the rest of the tag to buffer and update index
                    if (tempIndex < text.length) {
                        buffer += text.substring(index + 1, tempIndex + 1);
                        index = tempIndex;
                    }
                }
                
                // Update the HTML content
                element.innerHTML = buffer;
                
                // Scroll to bottom as text is typed
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                index++;
                setTimeout(typeNext, speed);
            } else {
                resolve();
            }
        };
        typeNext();
    });
}

// Toggle controls for typing state
function toggleTypingControls(isTyping) {
    isAITyping = isTyping;
    
    if (isTyping) {
        sendButton.classList.add('hidden-during-typing');
        stopButton.classList.add('active');
        userInput.disabled = true;
        imageUploadButton.disabled = true;
    } else {
        sendButton.classList.remove('hidden-during-typing');
        stopButton.classList.remove('active');
        userInput.disabled = false;
        imageUploadButton.disabled = false;
        
        // Check if we should show send button based on input content
        toggleSendButton();
    }
}

// Modified function to add AI message with typing animation
async function addMessageToChat(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    if (isUser) {
        // Get the current user's avatar from websim
        try {
            const user = await websim.getUser();
            const userAvatar = document.createElement('img');
            userAvatar.src = user && user.avatar_url ? `https://images.websim.ai/avatar/${user.username}` : '/Logo.png';
            userAvatar.alt = 'User Profile';
            userAvatar.classList.add('user-avatar');
            avatarDiv.appendChild(userAvatar);
        } catch (error) {
            // Fallback to default avatar if unable to get user info
            const userAvatar = document.createElement('img');
            userAvatar.src = '/Logo.png';
            userAvatar.alt = 'User Profile';
            userAvatar.classList.add('user-avatar');
            avatarDiv.appendChild(userAvatar);
        }
    } else {
        const aiAvatar = document.createElement('img');
        aiAvatar.src = '/1000005173-removebg-preview.png';
        aiAvatar.alt = 'Claude AI Profile';
        aiAvatar.classList.add('ai-avatar');
        avatarDiv.appendChild(aiAvatar);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (isUser) {
        // For user messages, just add content normally
        const formattedContent = parseMarkdown(content);
        contentDiv.innerHTML = formattedContent;
    } else {
        // For AI messages, animate typing
        const formattedContent = parseMarkdown(content);
        
        // Create a wrapper for the content to be animated
        const textWrapper = document.createElement('div');
        textWrapper.style.width = "100%"; // Ensure text wrapper uses full width
        contentDiv.appendChild(textWrapper);
        
        // Add timestamp for AI messages
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = formatMessageTimestamp();
        contentDiv.appendChild(timestampDiv);
        
        // Add action icons to AI messages
        const actionIcons = addMessageActionIcons(content);
        contentDiv.appendChild(actionIcons);

        contentDiv.addEventListener('click', () => {
            if (actionIcons.style.display === 'none' || actionIcons.style.display === '') {
                actionIcons.style.display = 'flex';
            } else {
                actionIcons.style.display = 'none';
            }
        });
        
        // Enable stop button and disable send button during typing
        toggleTypingControls(true);
        
        // Animate typing
        await animateTyping(textWrapper, formattedContent);
        
        // Re-enable inputs after typing is done
        toggleTypingControls(false);
    }
    
    // After adding message and formatting content
    if (!isUser) {
        // Add copy buttons to code blocks for AI messages
        setTimeout(addCodeBlockCopyButtons, 100);
    }
    
    // Add timestamp to the most recent message in conversation history
    if (conversationHistory.length > 0) {
        const latestMessage = conversationHistory[conversationHistory.length - 1];
        if (!latestMessage.timestamp) {
            latestMessage.timestamp = new Date().toISOString();
        }
    }
}

// Function to add copy and regenerate icons for AI messages
function addMessageActionIcons(messageContent) {
    const actionContainer = document.createElement('div');
    actionContainer.classList.add('message-action-icons');
    actionContainer.style.display = 'none';  // Initially hidden

    // Copy icon
    const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    copyIcon.classList.add('copy-message-icon');
    copyIcon.setAttribute('viewBox', '0 0 24 24');
    copyIcon.setAttribute('fill', 'none');
    copyIcon.setAttribute('stroke', 'white');  
    copyIcon.setAttribute('stroke-width', '2');
    copyIcon.setAttribute('width', '20');
    copyIcon.setAttribute('height', '20');

    const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect1.setAttribute('x', '9');
    rect1.setAttribute('y', '9');
    rect1.setAttribute('width', '13');
    rect1.setAttribute('height', '13');
    rect1.setAttribute('rx', '2');
    rect1.setAttribute('ry', '2');
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
    
    copyIcon.appendChild(rect1);
    copyIcon.appendChild(path);

    // Checkmark icon (non-interactive)
    const checkmarkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    checkmarkIcon.classList.add('checkmark-icon');
    checkmarkIcon.setAttribute('viewBox', '0 0 24 24');
    checkmarkIcon.setAttribute('fill', 'none');
    checkmarkIcon.setAttribute('stroke', 'white');
    checkmarkIcon.setAttribute('stroke-width', '3');
    
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute('points', '20 6 9 17 4 12');
    
    checkmarkIcon.appendChild(polyline);

    // Regenerate icon
    const regenerateIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    regenerateIcon.classList.add('regenerate-message-icon');
    regenerateIcon.setAttribute('viewBox', '0 0 24 24');
    regenerateIcon.setAttribute('fill', 'none');
    regenerateIcon.setAttribute('stroke', 'white');  
    regenerateIcon.setAttribute('stroke-width', '2');
    regenerateIcon.setAttribute('width', '20');
    regenerateIcon.setAttribute('height', '20');

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute('d', 'M23 4v6h-6');
    
    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute('d', 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10');
    
    regenerateIcon.appendChild(path1);
    regenerateIcon.appendChild(path2);

    // Copy functionality
    copyIcon.addEventListener('click', (e) => {
        e.stopPropagation();  // Prevent message click event
        const messageContainer = e.target.closest('.message.ai');
        const messageTextContent = messageContainer.querySelector('.message-content').textContent.trim();
        navigator.clipboard.writeText(messageTextContent).then(() => {
            // Replace copy icon with checkmark
            actionContainer.innerHTML = '';
            actionContainer.appendChild(checkmarkIcon);
            
            // Automatically hide checkmark after 2 seconds
            setTimeout(() => {
                actionContainer.style.display = 'none';
            }, 2000);
        });
    });

    // Regenerate functionality
    regenerateIcon.addEventListener('click', async (e) => {
        e.stopPropagation();  // Prevent message click event
        
        // Remove the last AI message
        const messages = document.querySelectorAll('.message.ai');
        if (messages.length > 0) {
            messages[messages.length - 1].remove();
        }

        // Remove the last AI message from conversation history
        if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant') {
            conversationHistory.pop();
        }

        // Trigger regeneration by sending the last user message again
        if (conversationHistory.length > 0) {
            const lastUserMessage = conversationHistory[conversationHistory.length - 1];
            await getAIResponse(lastUserMessage);
        }
    });

    actionContainer.appendChild(copyIcon);
    actionContainer.appendChild(regenerateIcon);

    return actionContainer;
}

// Function to add copy and regenerate icons for AI messages
function addCodeBlockCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(codeBlock => {
        // Ensure no duplicate copy buttons
        if (codeBlock.querySelector('.copy-code-button')) return;

        // Create copy button with minimal, clean SVG icon
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-code-button');
        copyButton.setAttribute('title', 'Copiar código');
        
        // Create SVG for copy icon - clean, minimal design
        const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        copyIcon.setAttribute('viewBox', '0 0 24 24');
        copyIcon.setAttribute('fill', 'none');
        copyIcon.setAttribute('stroke', '#D4D4D4');
        copyIcon.setAttribute('stroke-width', '2');
        copyIcon.setAttribute('stroke-linecap', 'round');
        copyIcon.setAttribute('stroke-linejoin', 'round');
        
        const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect1.setAttribute('x', '9');
        rect1.setAttribute('y', '9');
        rect1.setAttribute('width', '13');
        rect1.setAttribute('height', '13');
        rect1.setAttribute('rx', '2');
        rect1.setAttribute('ry', '2');
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
        
        copyIcon.appendChild(rect1);
        copyIcon.appendChild(path);
        
        // Create SVG for checkmark icon - clean, traditional design
        const checkmarkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        checkmarkIcon.setAttribute('viewBox', '0 0 24 24');
        checkmarkIcon.setAttribute('fill', 'none');
        checkmarkIcon.setAttribute('stroke', 'white');  
        checkmarkIcon.setAttribute('stroke-width', '3');  
        checkmarkIcon.setAttribute('stroke-linecap', 'round');
        checkmarkIcon.setAttribute('stroke-linejoin', 'round');
        
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline.setAttribute('points', '20 6 9 17 4 12');  
        
        checkmarkIcon.appendChild(polyline);
        
        // Add copy functionality
        copyButton.addEventListener('click', () => {
            // If button is already disabled, do nothing
            if (copyButton.classList.contains('disabled')) return;
            
            const code = codeBlock.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                // Temporarily replace icon with checkmark and disable
                copyButton.innerHTML = '';
                copyButton.appendChild(checkmarkIcon);
                copyButton.classList.add('copied', 'disabled');
                
                // Revert back to copy icon after 2 seconds
                setTimeout(() => {
                    copyButton.innerHTML = '';
                    copyButton.appendChild(copyIcon);
                    copyButton.classList.remove('copied', 'disabled');
                }, 2000);
            });
        });
        
        // Add button to code block
        codeBlock.appendChild(copyButton);
    });
}

// Maximum file size for text uploads (in bytes)
const MAX_FILE_SIZE = aiConfig.maxFileSize;

// Truncate long file contents to prevent overwhelming the AI
const MAX_FILE_CONTENT_LENGTH = aiConfig.maxFileContentLength;

// Delay before showing file preview (in milliseconds)
const FILE_PREVIEW_DELAY = 200;

// Number of recent messages to keep in conversation history
const MAX_CONVERSATION_HISTORY = globalConfig.maxConversationHistory;

// Close button size for file preview
const FILE_PREVIEW_CLOSE_BUTTON_SIZE = 20;

// Close button color
const FILE_PREVIEW_CLOSE_BUTTON_COLOR = 'rgba(255, 0, 0, 0.6)';

// Close button hover color
const FILE_PREVIEW_CLOSE_BUTTON_HOVER_COLOR = 'rgba(255, 0, 0, 0.8)';

// File upload handling
textUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            alert(`Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024} KB`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let content = e.target.result;
            
            // Truncate content if too long
            if (content.length > MAX_FILE_CONTENT_LENGTH) {
                content = content.substring(0, MAX_FILE_CONTENT_LENGTH) + 
                          `\n\n[Conteúdo truncado. Arquivo original tem ${content.length} caracteres]`;
            }
            
            // Store the file content in a variable to use when sending
            const fileContent = content;
            
            // Create and display file preview icon with modern styling
            const filePreview = document.createElement('div');
            filePreview.classList.add('file-preview');
            
            // Create close button with improved styling
            const closeButton = document.createElement('div');
            closeButton.classList.add('file-preview-close-btn');
            
            // Create SVG close icon
            const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            closeIcon.setAttribute('viewBox', '0 0 24 24');
            closeIcon.setAttribute('fill', 'none');
            closeIcon.setAttribute('stroke', 'white');
            closeIcon.setAttribute('stroke-width', '2.5');
            
            const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path1.setAttribute('d', 'M18 6L6 18');
            
            const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path2.setAttribute('d', 'M6 6l12 12');
            
            closeIcon.appendChild(path1);
            closeIcon.appendChild(path2);
            
            // Add close button functionality
            closeButton.appendChild(closeIcon);
            closeButton.addEventListener('click', () => {
                filePreview.remove();
                
                // Clear the file input to allow re-uploading
                textUploadInput.value = '';
                
                // Toggle send button visibility
                toggleSendButton();
            });
            
            const fileIcon = document.createElement('div');
            fileIcon.classList.add('file-icon');
            
            const fileName = document.createElement('div');
            fileName.classList.add('file-name');
            fileName.textContent = file.name;
            
            filePreview.appendChild(closeButton);
            filePreview.appendChild(fileIcon);
            filePreview.appendChild(fileName);
            
            // Store file content as data attribute
            filePreview.dataset.content = fileContent;
            
            // Remove any existing preview with a slight delay for smoother UX
            setTimeout(() => {
                const existingPreview = document.querySelector('.file-preview, .uploaded-image-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // Insert preview above the textarea
                const chatInput = document.querySelector('.chat-input');
                chatInput.insertAdjacentElement('afterbegin', filePreview);
                
                // Trigger send button visibility
                toggleSendButton();
            }, FILE_PREVIEW_DELAY);
        };
        reader.readAsText(file);
    }
});

// Update the existing image upload handler to work with both gallery and camera
imageUploadInput.addEventListener('change', handleImageUpload);
cameraInput.addEventListener('change', handleImageUpload);

// Function to handle image uploads from both camera and gallery
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageDataUrl = e.target.result;
            
            // Create and display image preview
            const imagePreview = document.createElement('img');
            imagePreview.src = uploadedImageDataUrl;
            imagePreview.classList.add('uploaded-image-preview');
            
            // Remove any existing preview
            const existingPreview = document.querySelector('.file-preview, .uploaded-image-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
            
            // Insert preview above the input
            const chatInput = document.querySelector('.chat-input');
            const textareaWrapper = document.querySelector('.textarea-wrapper');
            
            // Place the preview above the input
            chatInput.insertAdjacentElement('afterbegin', imagePreview);
            
            // Trigger send button visibility
            toggleSendButton();
            
            // Optionally focus the textarea
            userInput.focus();
        };
        reader.readAsDataURL(file);
    }
}

// Handle upload button menu
imageUploadButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadMenu.classList.toggle('active');
    overlay.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    if (uploadMenu.classList.contains('active') && !uploadMenu.contains(e.target) && e.target !== imageUploadButton) {
        uploadMenu.classList.remove('active');
        overlay.classList.remove('active');
    }
});

// Text upload option
textUploadOption.addEventListener('click', function() {
    textUploadInput.click();
    uploadMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Camera option
cameraOption.addEventListener('click', function() {
    cameraInput.click();
    uploadMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Gallery option
galleryOption.addEventListener('click', function() {
    imageUploadInput.click();
    uploadMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Send message on button click
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-button');
    
    // Safety check to prevent duplicate event listeners and syntax errors
    if (sendBtn) {
        sendBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default form submission
            await sendMessage();
        });
    } else {
        console.error('Send button not found in the DOM');
    }

    // Existing initialization code...
});

// Enhanced error handling for event listeners
function safeAddEventListener(element, eventType, callback) {
    /* maximum retry attempts for event listener */
    const MAX_RETRY_ATTEMPTS = 3;
    
    /* retry delay between attempts (ms) */
    const RETRY_DELAY = 100;

    let attempts = 0;

    function attemptAddListener() {
        if (!element) {
            if (attempts < MAX_RETRY_ATTEMPTS) {
                attempts++;
                console.warn(`Retrying event listener for ${eventType}. Attempt ${attempts}`);
                setTimeout(attemptAddListener, RETRY_DELAY);
            } else {
                console.error(`Failed to add event listener for ${eventType} after ${MAX_RETRY_ATTEMPTS} attempts`);
            }
            return;
        }

        try {
            element.addEventListener(eventType, callback);
            console.log(`Successfully added ${eventType} event listener`);
        } catch (error) {
            console.error(`Error adding ${eventType} event listener:`, error);
        }
    }

    attemptAddListener();
}

// Example usage of the enhanced event listener
document.addEventListener('DOMContentLoaded', () => {
    const stopBtn = document.getElementById('stop-button');
    safeAddEventListener(stopBtn, 'click', () => {
        shouldStopTyping = true;
        // Additional stop typing logic
    });
});

// Function to handle sending a message
async function sendMessage() {
    if (isAITyping) return;

    const initialWelcomeContainer = document.querySelector('.initial-welcome-container');
    if (initialWelcomeContainer) {
        initialWelcomeContainer.remove();
    }

    const message = userInput.value.trim();
    
    const filePreview = document.querySelector('.file-preview');
    let fileContent = '';
    let fileName = '';
    if (filePreview && filePreview.dataset.content) {
        fileContent = filePreview.dataset.content;
        fileName = filePreview.querySelector('.file-name').textContent;
    }
    
    if (!message && !uploadedImageDataUrl && !fileContent) return;
    
    userInput.disabled = true;
    sendButton.disabled = true;
    
    const messageToSend = {
        role: "user",
        content: []
    };

    if (message) {
        messageToSend.content.push({
            type: "text",
            text: message
        });
    }

    if (uploadedImageDataUrl) {
        messageToSend.content.push({
            type: "image_url",
            image_url: { url: uploadedImageDataUrl }
        });
        
        if (!message) {
            addMessageToChat("Imagem enviada", true);
        } else {
            addMessageToChat(message, true);
        }
    }

    if (fileContent) {
        const fileInstruction = `Instruções para análise do arquivo ${fileName}: Por favor, leia e interprete o conteúdo do arquivo anexado.`;
        
        if (messageToSend.content.length === 0) {
            messageToSend.content.push({
                type: "text",
                text: fileInstruction + "\n\n" + fileContent
            });
        } else {
            messageToSend.content[0].text = 
                fileInstruction + "\n\n" + 
                messageToSend.content[0].text + 
                "\n\nConteúdo do arquivo:\n" + fileContent;
        }
        
        addMessageToChat(`Arquivo enviado: ${fileName}`, true);
    }
    
    if (message && !fileContent && !uploadedImageDataUrl) {
        addMessageToChat(message, true);
    }
    
    conversationHistory.push(messageToSend);
    
    userInput.value = '';
    userInput.style.height = 'auto';
    
    const inputImagePreviewRemove = document.querySelector('.uploaded-image-preview');
    if (inputImagePreviewRemove) {
        inputImagePreviewRemove.remove();
    }
    uploadedImageDataUrl = null;
    
    const inputFilePreviewRemove = document.querySelector('.file-preview');
    if (inputFilePreviewRemove) {
        inputFilePreviewRemove.remove();
    }
    
    try {
        await getAIResponse(messageToSend);
    } catch (error) {
        console.error('Error getting AI response:', error);
        addMessageToChat("Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.", false);
        
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.classList.remove('active');
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
        
        imageUploadInput.value = '';
    }
}

// Function to get the current year with real-time accuracy
function getCurrentYear() {
    return new Date().getFullYear();
}

// Enhanced function to get current full date with precise localization
async function getCurrentFullDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return now.toLocaleDateString('pt-BR', options);
}

// Robust location and time detection function
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`);
                        const locationData = await response.json();
                        
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            city: locationData.address.city || locationData.address.town || locationData.address.village || 'Localização desconhecida',
                            country: locationData.address.country || 'País não identificado',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        });
                    } catch (error) {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            city: 'Localização desconhecida',
                            country: 'País não identificado',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        });
                    }
                },
                (error) => {
                    console.warn(`Erro de geolocalização (${error.code}): ${error.message}`);
                    resolve({
                        latitude: null,
                        longitude: null,
                        city: 'Localização indisponível',
                        country: 'País não identificado',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            resolve({
                latitude: null,
                longitude: null,
                city: 'Geolocalização não suportada',
                country: 'País não identificado',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }
    });
}

// Precise time-based greeting with real-time detection
async function getTimeBasedGreeting() {
    const now = new Date();
    const localTime = now.toLocaleTimeString('pt-BR', { 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
    });

    const [hour] = localTime.split(':').map(Number);

    let greeting = 'Olá';
    if (hour >= 5 && hour < 12) {
        greeting = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Boa tarde';
    } else {
        greeting = 'Boa noite';
    }

    try {
        const location = await getUserLocation();
        
        if (location.city !== 'Localização desconhecida' && location.city !== 'Localização indisponível') {
            greeting += ` em ${location.city}`;
        }
        
        return `${greeting}! Como posso ajudar você hoje?`;
    } catch (error) {
        console.error('Erro ao obter localização:', error);
        return `${greeting}! Como posso ajudar você hoje?`;
    }
}

// Modify getAIResponse to handle date and time queries with precise, real-time information
async function getAIResponse(messageToSend) {
    const textContent = messageToSend.content.find(item => item.type === "text");
    const userMessage = textContent ? textContent.text.toLowerCase() : "";
    
    try {
        const location = await getUserLocation();
        const now = new Date();
        
        if (userMessage.includes('que dia é hoje') || 
            userMessage.includes('qual é a data de hoje') || 
            userMessage.includes('data atual')) {
            const fullDate = await getCurrentFullDate();
            const locationContext = location.city !== 'Localização desconhecida' 
                ? `em ${location.city}, ${location.country}` 
                : '';
            
            if (textContent) {
                textContent.text = `Hoje é ${fullDate} ${locationContext}`;
            }
        }
        
        if (userMessage.includes('que ano é esse') || 
            userMessage.includes('ano atual')) {
            const currentYear = now.getFullYear();
            const locationContext = location.city !== 'Localização desconhecida' 
                ? `em ${location.city}, ${location.country}` 
                : '';
            
            if (textContent) {
                textContent.text = `O ano atual é ${currentYear} ${locationContext}`;
            }
        }
    } catch (error) {
        console.error('Erro ao processar localização:', error);
    }

    conversationHistory = pruneConversationHistory(conversationHistory);
    
    // Create custom system message based on settings
    let systemMessage = aiConfig.instructions;
    
    // Add nickname instruction if set
    if (aiConfig.nickname) {
        systemMessage += ` Sempre se refira ao usuário como "${aiConfig.nickname}".`;
    }
    
    // Add response style instruction
    switch (aiConfig.responseStyle) {
        case "concise":
            systemMessage += " Procure ser direto e conciso em suas respostas, evitando explicações desnecessárias.";
            break;
        case "detailed":
            systemMessage += " Forneça respostas detalhadas e abrangentes, explorando todos os aspectos relevantes.";
            break;
        case "friendly":
            systemMessage += " Adote um tom amigável e conversacional, como se estivesse conversando com um amigo.";
            break;
        case "formal":
            systemMessage += " Mantenha um tom formal e profissional em todas as suas respostas.";
            break;
        default:
            // Default style, no additional instructions
            break;
    }
    
    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                ...conversationHistory
            ],
        });

        const response = completion.content;
        
        addMessageToChat(response, false);
        
        conversationHistory.push({
            role: "assistant",
            content: response
        });
        
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
}

// Precise local timestamp formatting
function formatMessageTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
    });
}

// Update initial welcome message to use async greeting
async function addInitialWelcomeMessage() {
    const chatMessages = document.getElementById('chat-messages');
    
    const logoImage = document.createElement('img');
    logoImage.src = '/1000005173-removebg-preview.png';
    logoImage.alt = 'Claude Logo';
    logoImage.classList.add('initial-welcome-logo');
    
    const welcomeMessageDiv = document.createElement('div');
    welcomeMessageDiv.className = 'initial-welcome-message';
    
    const greeting = await getTimeBasedGreeting();
    welcomeMessageDiv.textContent = greeting;
    
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'initial-welcome-container';
    welcomeContainer.appendChild(logoImage);
    welcomeContainer.appendChild(welcomeMessageDiv);
    
    chatMessages.appendChild(welcomeContainer);
}

// Function to convert Markdown-like formatting to HTML with intelligent line breaks
function parseMarkdown(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    text = text.replace(/<[^>]*>?/g, function(match) {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    
    text = text.replace(/(\*\*|__)(.*?)\1/g, function(match, delimiter, content) {
        return `<strong>${content}</strong>`;
    });
    
    text = text.replace(/(\*|_)(.*?)\1/g, function(match, delimiter, content) {
        return `<em>${content}</em>`;
    });
    
    text = text.replace(/^\*\s(.+)$/gm, '• $1');
    
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        const escapedCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const langClass = lang ? `language-${lang}` : '';
        
        return `<pre><code class="${langClass}">${syntaxHighlight(escapedCode, lang)}</code></pre>`;
    });
    
    text = text.replace(/`(.*?)`/g, function(match, code) {
        return `<code>${code}</code>`;
    });
    
    text = text.replace(/\n\s*\n/g, '__PARAGRAPH_BREAK__');
    
    text = text.replace(/\n/g, '<br>');
    
    text = text.replace(/__PARAGRAPH_BREAK__/g, '<br><br>');
    
    text = text.replace(/(<br>)*$/, '');
    
    return text.trim();
}

// Add a robust syntax highlighting function
function syntaxHighlight(code, lang) {
    switch(lang) {
        case 'javascript':
        case 'js':
            return highlightJavaScript(code);
        case 'python':
        case 'py':
            return highlightPython(code);
        case 'html':
            return highlightHTML(code);
        case 'css':
            return highlightCSS(code);
        case 'json':
            return highlightJSON(code);
        case 'ruby':
        case 'rb':
            return highlightRuby(code);
        case 'php':
            return highlightPHP(code);
        case 'typescript':
        case 'ts':
            return highlightTypeScript(code);
        case 'swift':
            return highlightSwift(code);
        case 'kotlin':
            return highlightKotlin(code);
        case 'scala':
            return highlightScala(code);
        case 'rust':
            return highlightRust(code);
        case 'go':
            return highlightGo(code);
        default:
            return code;
    }
}

// JavaScript syntax highlighting
function highlightJavaScript(code) {
    const keywords = ['let', 'const', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Python syntax highlighting
function highlightPython(code) {
    const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'in', 'is', 'and', 'or', 'not', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'break', 'continue', 'as', 'in', 'is', 'try', 'catch', 'finally', 'with', 'throw'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
    
    return code;
}

// HTML syntax highlighting
function highlightHTML(code) {
    code = code.replace(/(&lt;\/?)(\w+)([^&]*?)(&gt;)/g, '$1<span class="tag">$2</span>$3$4');
    
    code = code.replace(/(\w+)=(".*?")/g, '<span class="attribute">$1</span>=<span class="string">$2</span>');
    
    return code;
}

// CSS syntax highlighting
function highlightCSS(code) {
    code = code.replace(/^(\s*)([\w-]+):/gm, '$1<span class="property">$2</span>:');
    
    code = code.replace(/:([^;{]+)/g, ': <span class="value">$1</span>');
    
    code = code.replace(/^(\s*)([\w.#-]+)\s*{/gm, '$1<span class="selector">$2</span> {');
    
    return code;
}

// JSON syntax highlighting
function highlightJSON(code) {
    code = code.replace(/"(\w+)":/g, '"<span class="key">$1</span>":');
    
    code = code.replace(/(".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    return code;
}

// Ruby syntax highlighting
function highlightRuby(code) {
    const keywords = ['def', 'class', 'module', 'if', 'else', 'elsif', 'end', 'do', 'while', 'for', 'return', 'yield', 'include', 'require', 'begin', 'rescue', 'ensure'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(:[\w]+)/g, '<span class="symbol">$1</span>');
    
    code = code.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
    
    return code;
}

// PHP syntax highlighting
function highlightPHP(code) {
    const keywords = ['function', 'class', 'public', 'private', 'protected', 'static', 'if', 'else', 'elseif', 'endif', 'switch', 'case', 'break', 'continue', 'return', 'require', 'include', 'namespace', 'use', 'const', 'array'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/(\$[\w]+)/g, '<span class="variable">$1</span>');
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// TypeScript syntax highlighting
function highlightTypeScript(code) {
    const keywords = ['interface', 'type', 'enum', 'namespace', 'declare', 'let', 'const', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'async', 'await'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Swift syntax highlighting
function highlightSwift(code) {
    const keywords = ['let', 'var', 'func', 'class', 'struct', 'enum', 'protocol', 'extension', 'init', 'deinit', 'import', 'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', 'guard', 'return', 'break', 'continue', 'where'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Kotlin syntax highlighting
function highlightKotlin(code) {
    const keywords = ['fun', 'class', 'object', 'interface', 'val', 'var', 'data', 'when', 'if', 'else', 'for', 'while', 'do', 'return', 'import', 'package', 'break', 'continue', 'as', 'in', 'is', 'try', 'catch', 'finally', 'with', 'throw'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Scala syntax highlighting
function highlightScala(code) {
    const keywords = ['def', 'class', 'trait', 'object', 'val', 'var', 'case', 'match', 'if', 'else', 'for', 'while', 'do', 'return', 'import', 'package', 'break', 'continue', 'try', 'catch', 'finally'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Rust syntax highlighting
function highlightRust(code) {
    const keywords = ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'trait', 'impl', 'mod', 'use', 'pub', 'as', 'break', 'continue', 'if', 'else', 'match', 'loop', 'while', 'for', 'return', 'in', 'move', 'unsafe'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Go syntax highlighting
function highlightGo(code) {
    const keywords = ['func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'if', 'else', 'switch', 'case', 'for', 'range', 'break', 'continue', 'return', 'defer', 'go', 'import', 'package'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    code = code.replace(/('.*?'|".*?")/g, '<span class="string">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return code;
}

// Update the conversation history pruning logic
function pruneConversationHistory(history) {
    const maxHistory = globalConfig.maxConversationHistory;
    const minToKeep = globalConfig.minConversationHistoryToKeep;
    
    // If history exceeds max, remove older messages
    if (history.length > maxHistory) {
        // Optionally preserve initial context if configured
        if (globalConfig.preserveInitialContext && history.length > minToKeep) {
            // Keep the first message (if it exists) and the most recent messages
            const firstMessage = history[0];
            return [firstMessage, ...history.slice(-maxHistory + 1)];
        }
        
        // Simply slice to keep most recent messages
        return history.slice(-maxHistory);
    }
    
    return history;
}

// Remove all search-related functionality
document.addEventListener('DOMContentLoaded', async () => {
    /* initial loading configuration */
    const loadingConfig = {
        /* minimum loading time (ms) */
        minimumLoadTime: 500,
        
        /* loading animation type */
        animationType: 'fade',
        
        /* show initial welcome message */
        showWelcomeMessage: true,
        
        /* load settings on startup */
        autoLoadSettings: true
    };

    try {
        if (loadingConfig.autoLoadSettings) {
            loadSettings();
        }
        
        const sendBtn = document.getElementById('send-button');
        sendBtn.classList.add('hidden');
        userInput.focus();
        
        // Make sure we're always properly referencing image upload button
        const imageUploadBtn = document.getElementById('image-upload-button');
        if (imageUploadBtn) {
            console.log('Image upload button found and ready');
        } else {
            console.error('Image upload button not found!');
        }
        
        // Conditional welcome message based on configuration
        if (loadingConfig.showWelcomeMessage) {
            await addInitialWelcomeMessage();
        }
        
        addCodeBlockCopyButtons();
    } catch (error) {
        /* error handling configuration */
        const errorHandlingConfig = {
            /* log errors to console */
            logToConsole: true,
            
            /* show user-friendly error message */
            showUserFriendlyMessage: true,
            
            /* fallback behavior */
            fallbackBehavior: 'reset'
        };
        
        if (errorHandlingConfig.logToConsole) {
            console.error('Initialization error:', error);
        }
        
        if (errorHandlingConfig.showUserFriendlyMessage) {
            addMessageToChat("Desculpe, ocorreu um erro ao inicializar o aplicativo. Por favor, recarregue a página.", false);
        }
        
        if (errorHandlingConfig.fallbackBehavior === 'reset') {
            // Perform a soft reset
            userInput.disabled = false;
            sendButton.disabled = false;
        }
    }
});