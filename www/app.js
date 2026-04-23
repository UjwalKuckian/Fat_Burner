// DOM Elements
const foodForm = document.getElementById('food-form');
const foodInput = document.getElementById('food-input');
const imageInput = document.getElementById('image-input');
const cameraInput = document.getElementById('camera-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const submitBtn = document.getElementById('submit-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');

const caloriesDisplay = document.getElementById('calories-display');
const proteinDisplay = document.getElementById('protein-display');
const carbsDisplay = document.getElementById('carbs-display');
const fatsDisplay = document.getElementById('fats-display');
const caloriesProgress = document.getElementById('calories-progress');
const foodListEl = document.getElementById('food-list');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const datePicker = document.getElementById('date-picker');

const editModal = document.getElementById('edit-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editName = document.getElementById('edit-name');
const editCalories = document.getElementById('edit-calories');
const editProtein = document.getElementById('edit-protein');
const editCarbs = document.getElementById('edit-carbs');
const editFats = document.getElementById('edit-fats');
const editMeal = document.getElementById('edit-meal');

const foodHistoryList = document.getElementById('food-history-list');
const dbList = document.getElementById('db-list');
const dbSearch = document.getElementById('db-search');
const customFoodForm = document.getElementById('custom-food-form');

const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

const apiKeyInput = document.getElementById('api-key-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingsMsg = document.getElementById('settings-msg');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeText = document.getElementById('theme-text');
const themeIcon = document.getElementById('theme-icon');

// Initialize Theme
let currentTheme = localStorage.getItem('nutrilog_theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeUI(currentTheme);

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('nutrilog_theme', currentTheme);
    updateThemeUI(currentTheme);
});

function updateThemeUI(theme) {
    if(theme === 'light') {
        themeText.innerText = 'Dark Mode';
        themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
        themeText.innerText = 'Light Mode';
        themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
}

// Date utility
function getTodayString() {
    const today = new Date();
    // Use local date properly to get YYYY-MM-DD
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
}

// State
let currentDate = getTodayString();
let logsData = JSON.parse(localStorage.getItem('nutrilog_logs_data')) || {};
let foodHistory = JSON.parse(localStorage.getItem('nutrilog_history')) || [];

// Migration: If old flat array exists, migrate to today
const oldLogs = JSON.parse(localStorage.getItem('nutrilog_logs'));
if (oldLogs && Array.isArray(oldLogs) && oldLogs.length > 0) {
    if (!logsData[currentDate]) logsData[currentDate] = [];
    logsData[currentDate] = [...oldLogs, ...logsData[currentDate]];
    localStorage.removeItem('nutrilog_logs'); // clean up old data
    localStorage.setItem('nutrilog_logs_data', JSON.stringify(logsData));
}

// Migrate any historical logs into the foodHistory library to seed it
Object.values(logsData).forEach(dayLogs => {
    dayLogs.forEach(log => {
        const name = log.n || log.name;
        if (name && !foodHistory.find(h => h.n.toLowerCase() === name.toLowerCase())) {
            foodHistory.push({ n: name, c: log.c || log.calories, p: log.p || log.protein, cb: log.cb || log.carbs, f: log.f || log.fats });
        }
    });
});
if (foodHistory.length > 0) saveHistory();

let apiKey = localStorage.getItem('nutrilog_api_key') || 'AIzaSyCGPKZI_gnjUHLj8kA0jIDRdhj1Jm93LLk';

// Image State
let selectedImageBase64 = null;
let selectedImageMimeType = null;

const DAILY_CALORIE_GOAL = 2000;

// Initialize
function init() {
    apiKeyInput.value = apiKey;
    datePicker.value = currentDate;
    
    // Check if API key is missing
    if (!apiKey) {
        // Just show settings view instead of modal
        switchView('view-settings');
    }
    
    updateUI();
    renderDatabase();

    // Dismiss Splash Screen after 2 seconds
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'scale(1.05)';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500); // Wait for transition to finish
        }
    }, 2000);
}

// Sidebar Navigation
function toggleSidebar() {
    sidebar.classList.toggle('closed');
    sidebarOverlay.classList.toggle('hidden');
}
menuBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

function switchView(targetId) {
    views.forEach(v => v.classList.remove('active', 'hidden'));
    views.forEach(v => {
        if(v.id === targetId) v.classList.add('active');
        else v.classList.add('hidden');
    });
    
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.target === targetId) btn.classList.add('active');
    });
    if(!sidebar.classList.contains('closed')) toggleSidebar();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => switchView(e.target.dataset.target));
});

// Event Listeners
saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('nutrilog_api_key', apiKey);
    settingsMsg.classList.remove('hidden');
    setTimeout(() => settingsMsg.classList.add('hidden'), 3000);
});
clearLogsBtn.addEventListener('click', clearLogs);

dbSearch.addEventListener('input', (e) => {
    renderDatabase(e.target.value);
});

customFoodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = document.getElementById('custom-name').value.trim();
    const c = parseInt(document.getElementById('custom-cal').value, 10);
    const p = parseInt(document.getElementById('custom-p').value, 10);
    const cb = parseInt(document.getElementById('custom-c').value, 10);
    const f = parseInt(document.getElementById('custom-f').value, 10);
    
    if(!n) return;
    
    // Prevent duplicate exact names
    if (foodHistory.find(h => h.n.toLowerCase() === n.toLowerCase())) {
        alert("Food name already exists in database!");
        return;
    }
    
    foodHistory.unshift({ n, c, p, cb, f });
    saveHistory();
    renderDatabase(dbSearch.value);
    customFoodForm.reset();
});

datePicker.addEventListener('change', (e) => {
    currentDate = e.target.value;
    updateUI();
});

closeEditModalBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editId.value;
    const currentLogs = logsData[currentDate] || [];
    const logIndex = currentLogs.findIndex(l => (l.i || l.id) === id);
    if (logIndex > -1) {
        // preserve old keys if they exist, or just overwrite with short keys
        const log = currentLogs[logIndex];
        log.n = editName.value.trim();
        log.c = parseInt(editCalories.value, 10);
        log.p = parseInt(editProtein.value, 10);
        log.cb = parseInt(editCarbs.value, 10);
        log.f = parseInt(editFats.value, 10);
        log.m = editMeal.value;
        // remove old long keys to save space if we are editing an old item
        delete log.name; delete log.calories; delete log.protein; delete log.carbs; delete log.fats;
        
        saveLogs();
        updateUI();
    }
    editModal.classList.add('hidden');
});

foodForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = foodInput.value.trim();
    
    // Require either text or image
    if (!query && !selectedImageBase64) return;
    
    const mealType = document.querySelector('input[name="meal"]:checked').value;
    
    // Autocomplete/Local History Fast Path (skip API if exact match and no image)
    if (query && !selectedImageBase64) {
        const match = foodHistory.find(h => h.n.toLowerCase() === query.toLowerCase());
        if (match) {
            const result = { ...match, i: Date.now().toString(), m: mealType };
            addLog(result);
            foodInput.value = '';
            foodInput.focus();
            return;
        }
    }
    
    if (!apiKey) {
        showError('Please set your Gemini API key in settings first.');
        switchView('view-settings');
        return;
    }

    foodInput.disabled = true;
    submitBtn.disabled = true;
    imageInput.disabled = true;
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    try {
        const result = await analyzeFood(query);
        result.m = mealType; // Save meal type using short key 'm'
        addLog(result);
        foodInput.value = '';
        removeImage();
    } catch (err) {
        showError(err.message || 'Failed to analyze food. Try again.');
    } finally {
        foodInput.disabled = false;
        submitBtn.disabled = false;
        imageInput.disabled = false;
        loadingIndicator.classList.add('hidden');
        foodInput.focus();
    }
});

// Image Upload Logic
function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const dataUrl = event.target.result;
        // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const [meta, base64] = dataUrl.split(',');
        selectedImageMimeType = meta.split(':')[1].split(';')[0];
        selectedImageBase64 = base64;
        
        imagePreview.src = dataUrl;
        imagePreviewContainer.classList.remove('hidden');
        foodInput.required = false; // No longer need text if image is present
    };
    reader.readAsDataURL(file);
}

imageInput.addEventListener('change', handleImageChange);
cameraInput.addEventListener('change', handleImageChange);

removeImageBtn.addEventListener('click', removeImage);

function removeImage() {
    imageInput.value = '';
    cameraInput.value = '';
    selectedImageBase64 = null;
    selectedImageMimeType = null;
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    foodInput.required = true;
}

// Data Functions
async function analyzeFood(query) {
    const prompt = `You are an expert nutritionist. Analyze the following food/meal and estimate its nutritional value. 
    Food description: "${query || 'See image'}"
    
    Respond EXACTLY with a raw JSON object and nothing else (no markdown, no backticks). 
    To save space, use these exact short keys:
    {
        "n": "A short name for the food (string)",
        "c": estimated total calories (number),
        "p": estimated protein in grams (number),
        "cb": estimated carbohydrates in grams (number),
        "f": estimated fats in grams (number)
    }`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const parts = [{ text: prompt }];
    
    if (selectedImageBase64) {
        parts.push({
            inline_data: {
                mime_type: selectedImageMimeType,
                data: selectedImageBase64
            }
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API request failed');
    }

    const data = await response.json();
    let textResult = data.candidates[0].content.parts[0].text;
    
    // Clean up potential markdown formatting just in case
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const parsed = JSON.parse(textResult);
        parsed.i = Date.now().toString(); // Short key for id
        
        // Save to history
        const nameToSave = parsed.n || parsed.name;
        if (nameToSave) {
            const exists = foodHistory.find(h => h.n.toLowerCase() === nameToSave.toLowerCase());
            if (!exists) {
                foodHistory.push({
                    n: nameToSave,
                    c: parsed.c || parsed.calories || 0,
                    p: parsed.p || parsed.protein || 0,
                    cb: parsed.cb || parsed.carbs || 0,
                    f: parsed.f || parsed.fats || 0
                });
                saveHistory();
                renderDatabase();
            }
        }
        
        return parsed;
    } catch (e) {
        throw new Error('Failed to parse Gemini response.');
    }
}

function addLog(item) {
    if (!logsData[currentDate]) {
        logsData[currentDate] = [];
    }
    logsData[currentDate].unshift(item);
    saveLogs();
    updateUI();
}

function clearLogs() {
    if (confirm(`Are you sure you want to clear all logs for ${currentDate}?`)) {
        logsData[currentDate] = [];
        saveLogs();
        updateUI();
    }
}

function deleteLog(id) {
    if (confirm('Delete this food?')) {
        const currentLogs = logsData[currentDate] || [];
        logsData[currentDate] = currentLogs.filter(l => (l.i || l.id) !== id);
        saveLogs();
        updateUI();
    }
}

window.openEditModal = function(id) {
    const currentLogs = logsData[currentDate] || [];
    const log = currentLogs.find(l => (l.i || l.id) === id);
    if (log) {
        editId.value = id;
        editName.value = log.n || log.name || '';
        editCalories.value = log.c || log.calories || 0;
        editProtein.value = log.p || log.protein || 0;
        editCarbs.value = log.cb || log.carbs || 0;
        editFats.value = log.f || log.fats || 0;
        editMeal.value = log.m || 'Snacks';
        editModal.classList.remove('hidden');
    }
};

window.triggerDelete = function(id) {
    deleteLog(id);
};

function saveLogs() {
    localStorage.setItem('nutrilog_logs_data', JSON.stringify(logsData));
}

function saveHistory() {
    localStorage.setItem('nutrilog_history', JSON.stringify(foodHistory));
}

function deleteDbItem(name) {
    if(confirm(`Delete "${name}" from database?`)) {
        foodHistory = foodHistory.filter(h => h.n !== name);
        saveHistory();
        renderDatabase(dbSearch.value);
    }
}

window.editDbItem = function(name) {
    const item = foodHistory.find(h => h.n === name);
    if(item) {
        document.getElementById('custom-name').value = item.n;
        document.getElementById('custom-cal').value = item.c;
        document.getElementById('custom-p').value = item.p;
        document.getElementById('custom-c').value = item.cb;
        document.getElementById('custom-f').value = item.f;
        // Delete old so they can save the edited version
        foodHistory = foodHistory.filter(h => h.n !== name);
        saveHistory();
        renderDatabase(dbSearch.value);
        document.getElementById('custom-name').focus();
    }
}

// Make global for inline onClick
window.deleteDbItem = deleteDbItem;

function renderDatabase(searchQuery = '') {
    // Populate Datalist
    foodHistoryList.innerHTML = '';
    foodHistory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.n;
        foodHistoryList.appendChild(option);
    });

    // Populate Waterfall Grid
    dbList.innerHTML = '';
    
    const filtered = foodHistory.filter(h => h.n.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filtered.length === 0) {
        dbList.innerHTML = '<div class="empty-state">No matching foods.</div>';
        return;
    }

    filtered.forEach(item => {
        const el = document.createElement('div');
        el.className = 'db-item';
        el.innerHTML = `
            <div style="flex: 1;">
                <span style="font-weight: 500; font-size: 1.1rem;">${item.n}</span>
                <div style="color: var(--text-muted); display: flex; gap: 0.75rem; margin-top: 0.25rem;">
                    <span style="color: var(--accent-color); font-weight: 600;">${item.c} kcal</span>
                    <span><div class="dot p" style="display:inline-block"></div> ${item.p}g</span>
                    <span><div class="dot c" style="display:inline-block"></div> ${item.cb}g</span>
                    <span><div class="dot f" style="display:inline-block"></div> ${item.f}g</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="icon-btn" onclick="editDbItem('${item.n.replace(/'/g, "\\'")}')" style="color: var(--text-main);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="icon-btn" onclick="deleteDbItem('${item.n.replace(/'/g, "\\'")}')" style="color: var(--danger-color);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        dbList.appendChild(el);
    });
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

// UI Updates
function updateUI() {
    renderLogs();
    updateDashboard();
}

function renderLogs() {
    foodListEl.innerHTML = '';
    const currentLogs = logsData[currentDate] || [];
    
    if (currentLogs.length === 0) {
        foodListEl.innerHTML = '<div class="empty-state">No foods logged yet for this date.</div>';
        return;
    }

    const mealGroups = { 'Breakfast': [], 'Lunch': [], 'Snacks': [], 'Dinner': [] };
    
    currentLogs.forEach(log => {
        const meal = log.m || 'Snacks'; // default to Snacks if missing
        if (!mealGroups[meal]) mealGroups[meal] = [];
        mealGroups[meal].push(log);
    });

    for (const [mealName, items] of Object.entries(mealGroups)) {
        if (items.length === 0) continue;
        
        const groupHeader = document.createElement('h3');
        groupHeader.className = 'meal-group-header';
        
        // Calculate total calories for this meal
        const mealCalories = items.reduce((sum, item) => sum + (item.c || item.calories || 0), 0);
        groupHeader.innerHTML = `${mealName} <span class="meal-group-calories">${mealCalories} kcal</span>`;
        foodListEl.appendChild(groupHeader);

        items.forEach(log => {
            // Fallback to long keys for backward compatibility if any old logs exist
            const id = log.i || log.id;
            const name = log.n || log.name;
            const calories = log.c || log.calories || 0;
            const protein = log.p || log.protein || 0;
            const carbs = log.cb || log.carbs || 0;
            const fats = log.f || log.fats || 0;

            const el = document.createElement('div');
            el.className = 'food-item';
            el.innerHTML = `
                <div class="food-info" style="flex: 1;">
                    <span class="food-name">${name}</span>
                    <div class="food-macros">
                        <span><div class="dot p"></div> ${protein}g</span>
                        <span><div class="dot c"></div> ${carbs}g</span>
                        <span><div class="dot f"></div> ${fats}g</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="food-calories">
                        ${calories} <span style="font-size: 0.7em; color: var(--text-muted)">kcal</span>
                    </div>
                    <div class="item-actions" style="display: flex; gap: 0.25rem;">
                        <button class="icon-btn edit-btn" onclick="openEditModal('${id}')" style="padding: 0.25rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="icon-btn delete-btn" onclick="triggerDelete('${id}')" style="padding: 0.25rem; color: var(--danger-color);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;
            foodListEl.appendChild(el);
        });
    }
}

function updateDashboard() {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const currentLogs = logsData[currentDate] || [];
    
    currentLogs.forEach(log => {
        totals.calories += log.c || log.calories || 0;
        totals.protein += log.p || log.protein || 0;
        totals.carbs += log.cb || log.carbs || 0;
        totals.fats += log.f || log.fats || 0;
    });

    // Animate Numbers
    animateValue(caloriesDisplay, parseInt(caloriesDisplay.innerText), totals.calories, 1000);
    proteinDisplay.innerText = Math.round(totals.protein) + 'g';
    carbsDisplay.innerText = Math.round(totals.carbs) + 'g';
    fatsDisplay.innerText = Math.round(totals.fats) + 'g';

    // Animate Circle (Max 100)
    let percentage = (totals.calories / DAILY_CALORIE_GOAL) * 100;
    if (percentage > 100) percentage = 100;
    
    // Set dash array (percentage, 100)
    caloriesProgress.setAttribute('stroke-dasharray', `${percentage}, 100`);
    
    // Change color if over goal
    if (totals.calories > DAILY_CALORIE_GOAL) {
        caloriesProgress.style.stroke = 'var(--danger-color)';
    } else {
        caloriesProgress.style.stroke = 'var(--accent-color)';
    }
}

// Helper to animate number counting
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Run
init();
