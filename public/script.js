import { GoogleGenAI } from '@google/genai';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.getElementById('newChatBtn');



    // Mobile Elements
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    let isReceivingResponse = false;
    let chatHistoryTitles = [];
    let chatSession = null;
    let ai = null;

    // Initialize Gemini API
    // Replace "YOUR_API_KEY_HERE" with your actual Gemini API key
    ai = new GoogleGenAI({ apiKey: "AIzaSyAy5mG8Lhp9w4EOtNiWZIkpQuPWKsXOBUA" });

    // Theme Toggle Logic
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');

        if (document.body.classList.contains('dark-theme')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            themeText.textContent = 'Dark Mode';
        }
    });

    // Mobile Sidebar Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';

        // Enable/disable send button based on input
        if (this.value.trim() !== '') {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Handle Enter key for sending (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // New Chat button
    newChatBtn.addEventListener('click', () => {
        if (isReceivingResponse) return;

        // Reset chat session
        chatSession = null;

        // Keep only welcome screen
        chatContainer.innerHTML = '';
        chatContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'flex';

        // Reset input
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
    });

    async function sendMessage() {
        const messageText = userInput.value.trim();

        if (messageText === '' || isReceivingResponse) return;

        // Hide welcome screen on first message
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
        }

        // Add user message to UI
        appendMessage(messageText, 'user');

        // Update history sidebar for the first message of a chat session
        if (chatContainer.children.length === 2) { // welcome screen + 1st user message
            addHistoryItem(messageText);
        }

        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        isReceivingResponse = true;



        // Show loading animation
        const loadingElement = addLoadingIndicatior();

        try {
            if (!chatSession) {
                // Initialize chat session on first message
                chatSession = await ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "You are VanshuBot, a helpful, polite, and intelligent AI assistant. You provide clear, concise, and accurate answers.",
                        temperature: 0.7,
                    }
                });
            }

            const response = await chatSession.sendMessage({ message: messageText });

            // Remove loading indicator
            loadingElement.remove();

            // Add bot response with typing effect
            appendBotResponse(response.text);

        } catch (error) {
            console.error('Error:', error);
            loadingElement.remove();
            appendMessage('Sorry, I encountered an error. Please check your API key in settings or try again later.', 'bot', true);
            isReceivingResponse = false;
        }
    }

    function appendMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'message-icon';
        iconDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (isError) {
            contentDiv.style.color = '#d93025';
        }

        // For user, just set text. For bot, it will be marked down.
        if (sender === 'user') {
            contentDiv.textContent = text;
        } else {
            // Parse markdown using marked.js
            contentDiv.innerHTML = marked.parse(text);
        }

        messageDiv.appendChild(iconDiv);
        messageDiv.appendChild(contentDiv);

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addLoadingIndicatior() {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message bot loading-msg`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'message-icon';
        iconDiv.innerHTML = '<i class="fa-solid fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

        contentDiv.appendChild(loadingDiv);
        messageDiv.appendChild(iconDiv);
        messageDiv.appendChild(contentDiv);

        chatContainer.appendChild(messageDiv);
        scrollToBottom();

        return messageDiv;
    }

    function appendBotResponse(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message bot`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'message-icon';
        iconDiv.innerHTML = '<i class="fa-solid fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        messageDiv.appendChild(iconDiv);
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);

        // Typing Effect
        let i = 0;
        let speed = 10; // Typing speed in ms
        let currentHtml = '';

        // We use marked.parse to get the HTML, then we simulate typing it.
        // Doing typing effect with raw HTML tags requires careful handling, 
        // so a simpler approach is to type plain text OR render HTML instantly.
        // Gemini responses often contain markdown, so rendering instantly with a small fade is better 
        // than broken HTML tags during a typing effect.

        // For a clean implementation, we will render the HTML instantly but use CSS animation 
        // on the message bubble to make it feel smooth.
        contentDiv.innerHTML = marked.parse(text);

        // Apply syntax highlighting to code blocks if needed here

        scrollToBottom();
        isReceivingResponse = false;
    }

    function addHistoryItem(text) {
        const shortText = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        chatHistoryTitles.unshift(shortText);

        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-regular fa-message" style="margin-right: 8px;"></i> ${shortText}`;

        historyList.insertBefore(li, historyList.firstChild);
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
