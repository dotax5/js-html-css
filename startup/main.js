const API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super" },
    { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B" },
    { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 (Air)" }
];

let state = {
    chats: [],
    currentChatId: null,
    settings: {
        theme: localStorage.getItem("theme") || "light",
        model: localStorage.getItem("model") || "openai/gpt-4o-mini"
    }
};

function init() {
    loadState();
    applyTheme();
    renderModelSelect();
    setupEventListeners();
    loadChats();
    
    if (state.chats.length === 0) {
        createNewChat();
    } else {
        switchToChat(state.chats[0].id);
    }
}

function loadState() {
    const saved = localStorage.getItem("aiChatState");
    if (saved) {
        const parsed = JSON.parse(saved);
        state.chats = parsed.chats || [];
        state.currentChatId = parsed.currentChatId;
        if (parsed.settings) {
            state.settings = { ...state.settings, ...parsed.settings };
        }
    }
}

function saveState() {
    localStorage.setItem("aiChatState", JSON.stringify({
        chats: state.chats,
        currentChatId: state.currentChatId,
        settings: state.settings
    }));
}

function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.settings.theme);
}

function renderModelSelect() {
    const select = document.getElementById("modelSelect");
    select.innerHTML = '<option value="">Select Model</option>';
    MODELS.forEach(model => {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        if (model.id === state.settings.model) option.selected = true;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById("newChatBtn").addEventListener("click", createNewChat);
    document.getElementById("sendBtn").addEventListener("click", sendMessage);
    document.getElementById("clearChatBtn").addEventListener("click", clearCurrentChat);
    document.getElementById("deleteChatBtn").addEventListener("click", deleteCurrentChat);
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    document.getElementById("menuToggle").addEventListener("click", toggleSidebar);
    
    document.getElementById("modelSelect").addEventListener("change", (e) => {
        state.settings.model = e.target.value;
        localStorage.setItem("model", e.target.value);
        updateModelBadge();
    });
    
    document.getElementById("userInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById("userInput").addEventListener("input", autoResize);
}

function autoResize() {
    const textarea = document.getElementById("userInput");
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
}

function toggleTheme() {
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", state.settings.theme);
    applyTheme();
    document.getElementById("themeToggle").textContent = state.settings.theme === "light" ? "🌙" : "☀️";
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

function createNewChat() {
    const chat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now()
    };
    state.chats.unshift(chat);
    state.currentChatId = chat.id;
    saveState();
    renderChatList();
    renderMessages();
    updateChatTitle();
}

function loadChats() {
    renderChatList();
    renderMessages();
    updateModelBadge();
}

function renderChatList() {
    const list = document.getElementById("chatList");
    list.innerHTML = "";
    state.chats.forEach(chat => {
        const item = document.createElement("div");
        item.className = `chat-item ${chat.id === state.currentChatId ? "active" : ""}`;
        item.textContent = chat.title;
        item.addEventListener("click", () => switchToChat(chat.id));
        list.appendChild(item);
    });
}

function switchToChat(chatId) {
    state.currentChatId = chatId;
    saveState();
    renderChatList();
    renderMessages();
    updateChatTitle();
    document.getElementById("sidebar").classList.remove("open");
}

function clearCurrentChat() {
    const chat = getCurrentChat();
    if (chat) {
        chat.messages = [];
        saveState();
        renderMessages();
    }
}

function deleteCurrentChat() {
    const chat = getCurrentChat();
    if (!chat) return;
    
    if (confirm("Delete this chat?")) {
        state.chats = state.chats.filter(c => c.id !== chat.id);
        
        if (state.chats.length === 0) {
            createNewChat();
        } else {
            switchToChat(state.chats[0].id);
        }
        
        saveState();
        renderChatList();
    }
}

function getCurrentChat() {
    return state.chats.find(c => c.id === state.currentChatId);
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    
    if (!message) return;
    if (!state.settings.model) {
        alert("Please select a model");
        return;
    }
    
    const chat = getCurrentChat();
    if (!chat) return;
    
    if (chat.messages.length === 0) {
        chat.title = message.slice(0, 30) + (message.length > 30 ? "..." : "");
        updateChatTitle();
    }
    
    chat.messages.push({ role: "user", content: message });
    input.value = "";
    autoResize();
    renderMessages();
    
    const loadingMsg = { role: "ai", content: "", loading: true };
    chat.messages.push(loadingMsg);
    renderMessages();
    
    try {
        const history = chat.messages.filter(m => !m.loading && (m.role === "user" || m.role === "ai"));
        const response = await callAPI(message, history.slice(0, -1));
        loadingMsg.content = response;
        loadingMsg.loading = false;
    } catch (error) {
        showError(error.message);
    }
    
    chat.messages = chat.messages.filter(m => !m.loading);
    saveState();
    renderMessages();
}

function showError(message) {
    const toast = document.getElementById("errorToast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
}

async function callAPI(userMessage, history) {
    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...history.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",  // ← исправление здесь
            content: m.content
        })),
        { role: "user", content: userMessage }
    ];
    
    const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: state.settings.model,
            messages: messages
        })
    });
    
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Invalid JSON response: " + text.slice(0, 200));
    }
    
    if (!response.ok) {
        throw new Error(data.error?.message || `Error ${response.status}: ${text.slice(0, 100)}`);
    }
    
    if (!data.choices || !data.choices[0]) {
        throw new Error("No response from AI");
    }
    
    return data.choices[0].message.content;
}

function renderMessages() {
    const container = document.getElementById("messages");
    container.innerHTML = "";
    
    const chat = getCurrentChat();
    if (!chat) return;
    
    chat.messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.role}`;
        
        if (msg.loading) {
            div.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
        } else if (msg.error) {
            div.className += " error-message";
            div.textContent = msg.content;
        } else {
            div.innerHTML = formatMessage(msg.content);
            const copyBtn = document.createElement("button");
            copyBtn.className = "copy-btn";
            copyBtn.textContent = "Copy";
            copyBtn.addEventListener("click", () => navigator.clipboard.writeText(msg.content));
            div.appendChild(copyBtn);
        }
        
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

function formatMessage(content) {
    return marked.parse(content);
}

function updateChatTitle() {
    const chat = getCurrentChat();
    document.getElementById("chatTitle").textContent = chat ? chat.title : "New Chat";
}

function updateModelBadge() {
    const model = MODELS.find(m => m.id === state.settings.model);
    document.getElementById("modelBadge").textContent = model ? model.name : "";
}

init();