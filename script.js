// --- Globale Element-Referenzen ---
const greeting = document.getElementById("greeting");
const searchButton = document.getElementById("SearchButton");
const searchContainer = document.getElementById('search-container');
const searchInput = document.querySelector("#searchBar input");
const bookmarksContainer = document.getElementById("bookmarks");
const addBookmarkBtn = document.getElementById("add-bookmark-btn");
const searchEngineList = document.getElementById('search-engine-list');
const modalOverlay = document.getElementById('modal-overlay');
const inputModal = document.getElementById('input-modal');
const confirmModal = document.getElementById('confirm-modal');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialBanner = document.getElementById('tutorial-banner');
const startTutorialBtn = document.getElementById('start-tutorial-btn');
const closeTutorialBannerBtn = document.getElementById('close-tutorial-banner-btn');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const todoWidget = document.getElementById('todo-widget');
const notesWidget = document.getElementById('notes-widget');
const todoList = document.getElementById('todo-list');
const addTodoForm = document.getElementById('add-todo-form');
const addTodoInput = document.getElementById('add-todo-input');
const notesTextarea = document.getElementById('notes-textarea');
const widgetModal = document.getElementById('widget-modal');
const widgetModalTitle = document.getElementById('widget-modal-title');
const widgetModalContent = document.getElementById('widget-modal-content');
const widgetCloseBtn = document.getElementById('widget-close-btn');
const uploadBackgroundBtn = document.getElementById('upload-background-btn');
const backgroundFileInput = document.getElementById('background-file-input');
const calculatorResult = document.getElementById('calculator-result');


// --- Globale Zustandsvariablen ---
let searchEngines = [];
let bookmarks = [];
let todos = [];
let currentSearchEngineIndex = 0;
let searchListTimeout = null;
let draggedBookmark = null;
let activeModal = null; // To track which modal is open

// --- Standardwerte ---
const DEFAULT_COLORS = {
    gradientStart: '#1a1a1a',
    gradientEnd: '#1a1a1a',
    accent: '#007aff',
    textColor: '#f5f5f7',
};
const DEFAULT_SEARCH_ENGINES = [
    { name: "Google", url: "https://www.google.com/search?q={query}" },
    { name: "ChatGPT", url: "https://chat.openai.com/" },
    { name: "Perplexity", url: "https://www.perplexity.ai/search?q={query}" },
    { name: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" }
];
const DEFAULT_BOOKMARKS = [
    { id: Date.now() + 1, name: "YouTube", url: "https://www.youtube.com" },
    { id: Date.now() + 2, name: "iCloud", url: "https://www.icloud.com" },
    { id: Date.now() + 3, name: "Gemini", url: "https://gemini.google.com" }
];
const DEFAULT_TODOS = [
    { id: Date.now() + 1, text: "Tutorial ansehen", completed: false, key: 'TUTORIAL_SEEN' },
    { id: Date.now() + 2, text: "Erstes Lesezeichen hinzufügen", completed: false, key: 'BOOKMARK_ADDED' },
];

// --- Hauptlogik ---
document.addEventListener('DOMContentLoaded', () => {
    // Check for tutorial BEFORE loading data, as loading sets default data.
    const isNewUser = localStorage.length === 0;

    loadAndRenderAll();
    setupEventListeners();
    updateTime();
    setInterval(updateTime, 1000);
    searchInput.focus();
    searchInput.select();

    if (isNewUser) {
        setTimeout(() => {
            tutorialBanner.classList.add('visible');
            const bannerTimeout = setTimeout(() => tutorialBanner.classList.remove('visible'), 5000);
            startTutorialBtn.onclick = () => { clearTimeout(bannerTimeout); tutorialBanner.classList.remove('visible'); startTutorial(); };
            closeTutorialBannerBtn.onclick = () => { clearTimeout(bannerTimeout); tutorialBanner.classList.remove('visible'); };
        }, 1500);
    }
});

// --- Lade-, Speicher- und Render-Funktionen ---
function loadAndRenderAll() {
    loadBackground();
    loadColors();
    const name = localStorage.getItem('userName') || "Name";
    greeting.textContent = `Hallo ${name}`;
    loadSearchEngines();
    loadBookmarks();
    renderBookmarks();
    updateSearchFunctionality();
    loadTodos();
    renderTodos();
    loadNotes();
}

function loadBackground() {
    const bgUrl = localStorage.getItem('backgroundImageUrl');
    applyBackground(bgUrl);
}

function applyBackground(url) {
    document.body.style.backgroundImage = url ? `url('${url}')` : '';
}


function loadColors() {
    const storedColors = JSON.parse(localStorage.getItem('themeColors')) || DEFAULT_COLORS;
    applyColors(storedColors);
}

function applyColors(colors) {
    const root = document.documentElement;
    root.style.setProperty('--gradient-start', colors.gradientStart);
    root.style.setProperty('--gradient-end', colors.gradientEnd);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--text-color', colors.textColor);
    
    // Generate lighter/hover colors dynamically
    root.style.setProperty('--accent-color-hover', adjustHexColor(colors.accent, 20)); 
    const textColorRGB = hexToRgb(colors.textColor);
    if (textColorRGB) {
        root.style.setProperty('--text-color-light', `rgba(${textColorRGB.r}, ${textColorRGB.g}, ${textColorRGB.b}, 0.6)`);
    }

    // Update color picker values
    document.getElementById('color-gradient-start').value = colors.gradientStart;
    document.getElementById('color-gradient-end').value = colors.gradientEnd;
    document.getElementById('color-accent').value = colors.accent;
    document.getElementById('color-text').value = colors.textColor;
}

function loadSearchEngines() {
    const stored = localStorage.getItem('searchEngines');
    searchEngines = stored ? JSON.parse(stored) : [...DEFAULT_SEARCH_ENGINES];
    if (!stored) saveSearchEngines();
}
function saveSearchEngines() {
    localStorage.setItem('searchEngines', JSON.stringify(searchEngines));
}

function loadBookmarks() {
    const stored = localStorage.getItem('bookmarks');
    bookmarks = stored ? JSON.parse(stored) : [...DEFAULT_BOOKMARKS];
    if (!stored) saveBookmarks();
}
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [...DEFAULT_TODOS];
    if(!stored) saveTodos();
}
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadNotes() {
    notesTextarea.value = localStorage.getItem('notes') || '';
}
function saveNotes() {
    localStorage.setItem('notes', notesTextarea.value);
}

function renderBookmarks() {
    bookmarksContainer.innerHTML = '';
    bookmarks.forEach(bookmark => {
        const bookmarkElement = document.createElement('a');
        bookmarkElement.className = 'bookmark';
        bookmarkElement.href = bookmark.url;
        bookmarkElement.target = "_blank";
        bookmarkElement.dataset.id = bookmark.id;
        bookmarkElement.draggable = true;
        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${bookmark.url}`;
        bookmarkElement.innerHTML = `
            <button class="delete-bookmark-btn" data-id="${bookmark.id}">×</button>
            <img src="${faviconUrl}" alt="${bookmark.name} logo" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0yIDEyYjAgNSUuNTIzIDkgMTAgOCAxMGE5Ljc1IDkuNzUgMCAwIDAgMS45Mi0uNTAiLz48cGF0aCBkPSJNMjIgMTJhOS41IDkuNSAwIDAgMC0xNiAwYTkuNSA5LjUgMCAwIDEgMTYgMFoiLz48L3N2Zz4='">
            <p>${bookmark.name}</p>
        `;
        bookmarksContainer.appendChild(bookmarkElement);
    });
    bookmarksContainer.appendChild(addBookmarkBtn);
}

function renderTodos() {
    const lists = document.querySelectorAll('#todo-list');
    lists.forEach(listContainer => {
        listContainer.innerHTML = '';
        if (todos.length === 0) {
            listContainer.innerHTML = `<li class="empty-todo-message">Keine Aufgaben vorhanden.</li>`;
            return;
        }
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.dataset.id = todo.id;
            li.innerHTML = `
                <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${todo.id}" class="custom-checkbox-label">
                    <span class="custom-checkbox">
                        <svg viewBox="0 0 24 24"><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </span>
                    <span>${todo.text}</span>
                </label>
                <button class="delete-todo-btn" aria-label="Löschen">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            listContainer.appendChild(li);
        });
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    greeting.addEventListener('click', handleChangeName);
    document.addEventListener('keydown', handleGlobalKeydown);
    searchInput.addEventListener('input', handleCalculatorInput);
    searchButton.addEventListener('click', performSearch);
    addBookmarkBtn.addEventListener('click', handleAddBookmark);
    addTodoForm.addEventListener('submit', handleAddTodo);
    
    document.body.addEventListener('click', handleTodoClick);

    notesTextarea.addEventListener('input', saveNotes);
    
    notesWidget.addEventListener('click', (e) => {
        if (e.target.id === 'notes-textarea') return;
        openWidgetModal('notes');
    });
    todoWidget.addEventListener('click', (e) => {
        if (e.target.closest('.delete-todo-btn, .custom-checkbox-label')) return;
        openWidgetModal('todos');
    });
    widgetCloseBtn.addEventListener('click', closeActiveModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeActiveModal();
    });

    bookmarksContainer.addEventListener('click', handleBookmarkClick);
    bookmarksContainer.addEventListener('dragstart', handleDragStart);
    bookmarksContainer.addEventListener('dragover', handleDragOver);
    bookmarksContainer.addEventListener('drop', handleDrop);
    bookmarksContainer.addEventListener('dragend', handleDragEnd);
    bookmarksContainer.addEventListener('mousemove', handleGlossyEffect);
    
    const hideSearchList = () => { searchListTimeout = setTimeout(() => searchEngineList.classList.remove('visible'), 300); };
    searchButton.addEventListener('mouseenter', () => { clearTimeout(searchListTimeout); updateSearchFunctionality(true); });
    searchButton.addEventListener('mouseleave', hideSearchList);
    searchEngineList.addEventListener('mouseenter', () => clearTimeout(searchListTimeout));
    searchEngineList.addEventListener('mouseleave', hideSearchList);
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) { searchEngineList.classList.remove('visible'); } });

    settingsBtn.addEventListener('click', showSettingsModal);
    settingsCloseBtn.addEventListener('click', closeActiveModal);
    document.getElementById('background-form').addEventListener('submit', handleBackgroundChange);
    uploadBackgroundBtn.addEventListener('click', () => backgroundFileInput.click());
    backgroundFileInput.addEventListener('change', handleFileUpload);
    document.getElementById('reset-background-btn').addEventListener('click', handleBackgroundReset);
    document.getElementById('color-gradient-start').addEventListener('input', handleColorChange);
    document.getElementById('color-gradient-end').addEventListener('input', handleColorChange);
    document.getElementById('color-accent').addEventListener('input', handleColorChange);
    document.getElementById('color-text').addEventListener('input', handleColorChange);
    document.getElementById('reset-colors-btn').addEventListener('click', () => { localStorage.removeItem('themeColors'); loadColors(); });
    document.getElementById('add-searchengine-form').addEventListener('submit', handleAddSearchEngine);

    document.getElementById('export-settings-btn').addEventListener('click', exportSettings);
    document.getElementById('import-settings-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', importSettings);
}

// --- Event Handler ---
function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
        closeActiveModal();
        return;
    }

    if (modalOverlay.classList.contains('hidden') && tutorialOverlay.classList.contains('hidden')) {
         if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            currentSearchEngineIndex = (event.key === "ArrowDown")
                ? (currentSearchEngineIndex + 1) % searchEngines.length
                : (currentSearchEngineIndex - 1 + searchEngines.length) % searchEngines.length;
            updateSearchFunctionality();
        } else if (event.key === 'Enter' && document.activeElement === searchInput) {
            performSearch();
        }
    }
}

function handleBookmarkClick(e) {
    const bookmarkElement = e.target.closest('.bookmark');
    if (!bookmarkElement || bookmarkElement.classList.contains('add-bookmark')) return;

    if (e.target.tagName === 'P') {
        e.preventDefault();
        handleEditBookmarkName(bookmarkElement);
    } else if (e.target.classList.contains('delete-bookmark-btn')) {
        e.preventDefault();
        handleDeleteBookmark(e.target.dataset.id);
    }
}

function handleTodoClick(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;

    const itemId = Number(item.dataset.id);

    if (e.target.closest('.delete-todo-btn')) {
        todos = todos.filter(todo => todo.id !== itemId);
    } else if (e.target.closest('.custom-checkbox-label')) {
        const todo = todos.find(t => t.id === itemId);
        if (todo) {
            todo.completed = !todo.completed;
        }
    } else {
        return;
    }
    saveTodos();
    renderTodos();
}

function handleCalculatorInput(e) {
    const input = e.target.value.trim();
    if (input.endsWith('=')) {
        const expression = input.slice(0, -1);
        try {
            const result = safeCalculate(expression);
            if (isFinite(result)) {
                const formattedResult = Number(result.toFixed(10)).toString(); // Avoid long decimals
                calculatorResult.textContent = formattedResult;
                calculatorResult.classList.add('visible');
            } else {
               calculatorResult.classList.remove('visible');
            }
        } catch (error) {
            calculatorResult.classList.remove('visible');
        }
    } else {
        calculatorResult.classList.remove('visible');
    }
}


function performSearch() {
    const rawInput = searchInput.value.trim();
    if (!rawInput) return;
    
    // If it's a calculation, replace input with result and stop
    if (rawInput.endsWith('=')) {
        const expression = rawInput.slice(0, -1);
        try {
            const result = safeCalculate(expression);
            if (isFinite(result)) {
                searchInput.value = Number(result.toFixed(10)).toString();
                calculatorResult.classList.remove('visible');
                return; // Stop here, don't search
            }
        } catch (error) { /* Fall through to regular search if calculation fails */ }
    }
    
    const currentEngine = searchEngines[currentSearchEngineIndex];
    // Special handling for engines that don't use a query parameter
    if (!currentEngine.url.includes('{query}')) {
        window.open(currentEngine.url, '_blank');
        return;
    }

    const isUrl = rawInput.includes('.') && !rawInput.includes(' ') && !rawInput.startsWith('?') && !rawInput.endsWith('.');
    if (isUrl) {
        let url = rawInput.startsWith('http') ? rawInput : 'https://' + rawInput;
        window.open(url, '_blank');
    } else {
        const query = encodeURIComponent(rawInput);
        const searchUrl = currentEngine.url.replace('{query}', query);
        window.open(searchUrl, '_blank');
    }
}

function updateSearchFunctionality(showList = false) {
    if (searchEngines.length === 0) return;
    searchButton.textContent = searchEngines[currentSearchEngineIndex].name;
    searchEngineList.innerHTML = '';
    searchEngines.forEach((engine, index) => {
        const item = document.createElement('div');
        item.className = 'search-engine-item' + (index === currentSearchEngineIndex ? ' selected' : '');
        item.textContent = engine.name;
        item.onclick = () => {
            currentSearchEngineIndex = index;
            updateSearchFunctionality();
            searchEngineList.classList.remove('visible');
            searchInput.focus();
        };
        searchEngineList.appendChild(item);
    });
    if (showList) searchEngineList.classList.add('visible');
}

function handleChangeName() {
    const currentName = localStorage.getItem('userName') || "Name";
    showInputModal("Wie ist dein Name?", currentName, newName => {
        if (newName) {
            localStorage.setItem('userName', newName);
            greeting.textContent = `Hallo ${newName}`;
        }
    });
}

function handleAddBookmark() {
    showInputModal("Neue Lesezeichen-URL", "https://", url => {
        if (!url || url === "https://") return;
        try {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            const hostname = new URL(fullUrl).hostname.replace('www.', '').split('.')[0];
            const defaultName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
            
            showInputModal("Name des Lesezeichens", defaultName, name => {
                if (name) {
                    bookmarks.push({ id: Date.now(), name, url: fullUrl });
                    saveBookmarks();
                    renderBookmarks();
                    updateTodoByKey('BOOKMARK_ADDED');
                }
            });
        } catch (_) {
            showConfirmModal("Ungültige URL", "Bitte gib eine gültige URL ein.", () => {}, true);
        }
    });
}

function handleAddTodo(e) {
    e.preventDefault();
    const text = addTodoInput.value.trim();
    if (text) {
        todos.push({ id: Date.now(), text, completed: false });
        saveTodos();
        renderTodos();
        addTodoInput.value = '';
    }
}

function handleEditBookmarkName(bookmarkElement) {
    const bookmarkId = Number(bookmarkElement.dataset.id);
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;
    showInputModal("Lesezeichen umbenennen", bookmark.name, newName => {
        if (newName) {
            bookmark.name = newName;
            saveBookmarks();
            renderBookmarks();
        }
    });
}

function handleDeleteBookmark(bookmarkId) {
    const id = Number(bookmarkId);
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    showConfirmModal(`"${bookmark.name}" löschen?`, "Dieser Vorgang kann nicht rückgängig gemacht werden.", () => {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveBookmarks();
        renderBookmarks();
    });
}

function handleBackgroundChange(e) {
    e.preventDefault();
    const url = document.getElementById('background-url-input').value.trim();
    applyBackground(url);
    localStorage.setItem('backgroundImageUrl', url);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Url = e.target.result;
        applyBackground(base64Url);
        localStorage.setItem('backgroundImageUrl', base64Url);
    };
    reader.readAsDataURL(file);
}

function handleBackgroundReset() {
    applyBackground(null);
    localStorage.removeItem('backgroundImageUrl');
    document.getElementById('background-url-input').value = '';
}

function handleColorChange() {
    const newColors = {
        gradientStart: document.getElementById('color-gradient-start').value,
        gradientEnd: document.getElementById('color-gradient-end').value,
        accent: document.getElementById('color-accent').value,
        textColor: document.getElementById('color-text').value,
    };
    applyColors(newColors);
    localStorage.setItem('themeColors', JSON.stringify(newColors));
    if (!localStorage.getItem('backgroundImageUrl')) {
        applyBackground(null);
    }
}

function handleAddSearchEngine(e) {
    e.preventDefault();
    const nameInput = document.getElementById('new-searchengine-name');
    const urlInput = document.getElementById('new-searchengine-url');
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (name && url) { // Removed the '{query}' requirement to allow for sites like ChatGPT
        searchEngines.push({ name, url });
        saveSearchEngines();
        renderSearchEnginesInSettings();
        updateSearchFunctionality();
        nameInput.value = '';
        urlInput.value = '';
    } else {
        showConfirmModal("Fehler", "Bitte gib einen Namen und eine URL ein.", () => {}, true);
    }
}

// --- Drag & Drop & Glossy Effect Handlers ---
function handleDragStart(e) {
    if (e.target.classList.contains('bookmark')) {
        draggedBookmark = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }
}

function handleDragEnd(e) {
    if (draggedBookmark) {
        draggedBookmark.classList.remove('dragging');
        draggedBookmark = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(bookmarksContainer, e.clientY);
    const currentlyDragged = document.querySelector('.dragging');
    if (afterElement == null) {
        bookmarksContainer.insertBefore(currentlyDragged, addBookmarkBtn);
    } else {
        bookmarksContainer.insertBefore(currentlyDragged, afterElement);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.bookmark:not(.dragging):not(.add-bookmark)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDrop(e) {
    e.preventDefault();
    const newOrderIds = [...bookmarksContainer.querySelectorAll('.bookmark:not(.add-bookmark)')].map(b => Number(b.dataset.id));
    bookmarks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    saveBookmarks();
}

function handleGlossyEffect(e) {
    const target = e.target.closest('.bookmark:not(.add-bookmark)');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
}

// --- Import / Export ---
function exportSettings() {
    const settings = {
        userName: localStorage.getItem('userName'),
        themeColors: JSON.parse(localStorage.getItem('themeColors')),
        searchEngines: JSON.parse(localStorage.getItem('searchEngines')),
        bookmarks: JSON.parse(localStorage.getItem('bookmarks')),
        todos: JSON.parse(localStorage.getItem('todos')),
        notes: localStorage.getItem('notes'),
        backgroundImageUrl: localStorage.getItem('backgroundImageUrl'),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "homepage-settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const settings = JSON.parse(e.target.result);
            if (!settings.hasOwnProperty('bookmarks')) throw new Error("Invalid file structure");

            showConfirmModal("Einstellungen importieren?", "Deine aktuellen Einstellungen werden überschrieben.", () => {
                localStorage.setItem('userName', settings.userName || '');
                localStorage.setItem('themeColors', JSON.stringify(settings.themeColors || DEFAULT_COLORS));
                localStorage.setItem('searchEngines', JSON.stringify(settings.searchEngines || DEFAULT_SEARCH_ENGINES));
                localStorage.setItem('bookmarks', JSON.stringify(settings.bookmarks || DEFAULT_BOOKMARKS));
                localStorage.setItem('todos', JSON.stringify(settings.todos || DEFAULT_TODOS));
                localStorage.setItem('notes', settings.notes || '');
                localStorage.setItem('backgroundImageUrl', settings.backgroundImageUrl || '');
                loadAndRenderAll();
                closeSettingsModal();
            });
        } catch (error) {
            showConfirmModal("Importfehler", "Die Datei ist fehlerhaft oder hat ein falsches Format.", () => {}, true);
        }
    };
    reader.readAsText(file);
    event.target.value = null;
}

// --- Modals ---
function hideAllModals() {
    modalOverlay.classList.add('hidden');
    inputModal.classList.add('hidden');
    confirmModal.classList.add('hidden');
    settingsModal.classList.add('hidden');
    widgetModal.classList.add('hidden');
    activeModal = null;
}

function closeActiveModal() {
    if (activeModal === 'widget') {
         if (widgetModal.querySelector('#notes-textarea')) {
            notesWidget.querySelector('.widget-content').appendChild(notesTextarea);
        }
        if (widgetModal.querySelector('#todo-list')) {
            todoWidget.querySelector('.widget-content').appendChild(todoList);
            renderTodos();
        }
    }
    hideAllModals();
}

function showSettingsModal() {
    hideAllModals();
    activeModal = 'settings';
    renderSearchEnginesInSettings();
    document.getElementById('background-url-input').value = localStorage.getItem('backgroundImageUrl') || '';
    modalOverlay.classList.remove('hidden');
    settingsModal.classList.remove('hidden');
}

function openWidgetModal(type) {
    hideAllModals();
    activeModal = 'widget';
    
    if (type === 'notes') {
        widgetModalTitle.textContent = 'Notizen';
        widgetModalContent.innerHTML = '';
        widgetModalContent.appendChild(notesTextarea);
        widgetModal.classList.remove('todo-mode');
        notesTextarea.focus();
    } else if (type === 'todos') {
        widgetModalTitle.textContent = 'To-Do Liste';
        widgetModalContent.innerHTML = '';
        widgetModalContent.appendChild(todoList);
        widgetModal.classList.add('todo-mode');
        addTodoInput.focus();
    }
    
    renderTodos();
    modalOverlay.classList.remove('hidden');
    widgetModal.classList.remove('hidden');
}

function renderSearchEnginesInSettings() {
    const list = document.getElementById('settings-searchengine-list');
    list.innerHTML = '';
    searchEngines.forEach((engine, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${engine.name}</span><button data-index="${index}">×</button>`;
        list.appendChild(li);
    });
    list.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') {
            const index = Number(e.target.dataset.index);
            if (searchEngines.length > 1) {
                searchEngines.splice(index, 1);
                if (currentSearchEngineIndex >= index) currentSearchEngineIndex = Math.max(0, currentSearchEngineIndex - 1);
                saveSearchEngines();
                renderSearchEnginesInSettings();
                updateSearchFunctionality();
            } else {
                showConfirmModal("Aktion nicht möglich", "Du musst mindestens eine Suchmaschine behalten.", ()=>{}, true);
            }
        }
    };
}

function showInputModal(title, initialValue, onConfirm) {
    hideAllModals();
    activeModal = 'input';
    modalOverlay.classList.remove('hidden');
    inputModal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = title;
    const input = document.getElementById('modal-input');
    input.value = initialValue;
    input.focus();
    input.select();
    
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    const confirmHandler = () => { onConfirm(input.value.trim()); };
    
    confirmBtn.addEventListener('click', confirmHandler, { once: true });
    cancelBtn.addEventListener('click', closeActiveModal, { once: true });
}

function showConfirmModal(title, text, onConfirm, isAlert = false) {
    hideAllModals();
    activeModal = 'confirm';
    modalOverlay.classList.remove('hidden');
    confirmModal.classList.remove('hidden');
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-text').textContent = text;

    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    
    cancelBtn.style.display = isAlert ? 'none' : 'inline-block';
    confirmBtn.textContent = isAlert ? "OK" : "Ja";
    confirmBtn.classList.toggle('danger', !isAlert);

    const confirmHandler = () => { onConfirm(); };

    confirmBtn.addEventListener('click', confirmHandler, { once: true });
    cancelBtn.addEventListener('click', closeActiveModal, { once: true });
}


// --- Zeit & Datum ---
function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// --- Automatische To-Do-Updates ---
function updateTodoByKey(key) {
    const todoToUpdate = todos.find(todo => todo.key === key && !todo.completed);
    if (todoToUpdate) {
        todoToUpdate.completed = true;
        saveTodos();
        renderTodos();
    }
}

// --- Taschenrechner-Funktion ---
function safeCalculate(expression) {
    const sanitized = expression.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
    if (sanitized !== expression) {
        throw new Error("Invalid characters");
    }
    return new Function('return ' + sanitized)();
}

// --- ÜBERARBEITETE TUTORIAL-LOGIK ---
const tutorialSteps = [
    { selector: '#greeting', text: 'Willkommen! Klicke auf deinen Namen, um ihn zu ändern.' },
    { selector: '#add-bookmark-btn', text: 'Perfekt! Füge hier neue Lesezeichen hinzu.' },
    { selector: '.widget-row', text: 'Hier kannst du deine To-Dos und Notizen verwalten. Klicke, um sie zu vergrößern.' },
    { selector: '#settings-btn', text: 'Öffne die Einstellungen, um das Aussehen anzupassen und mehr.' },
    { selector: '#searchBar', text: 'Tipp: Wechsle die Suchmaschine mit den Pfeiltasten (↑/↓).' }
];
let currentTutorialStep = 0;

function startTutorial() {
    document.getElementById('tutorial-skip').onclick = endTutorial;
    document.getElementById('tutorial-next').onclick = () => showTutorialStep(currentTutorialStep + 1);
    document.getElementById('tutorial-prev').onclick = () => showTutorialStep(currentTutorialStep - 1);
    showTutorialStep(0);
}

function showTutorialStep(index) {
    if (index >= tutorialSteps.length) {
        endTutorial();
        return;
    }
    currentTutorialStep = index;
    const step = tutorialSteps[index];
    const targetElement = document.querySelector(step.selector);
    const tutorialBox = document.getElementById('tutorial-box');

    if (!targetElement) {
        endTutorial();
        return;
    }

    const rect = targetElement.getBoundingClientRect();

    tutorialOverlay.classList.remove('hidden');
    tutorialOverlay.style.top = `${rect.top}px`;
    tutorialOverlay.style.left = `${rect.left}px`;
    tutorialOverlay.style.width = `${rect.width}px`;
    tutorialOverlay.style.height = `${rect.height}px`;
    
    tutorialBox.classList.remove('hidden');
    document.getElementById('tutorial-text').textContent = step.text;
    document.getElementById('tutorial-progress').textContent = `Schritt ${index + 1} von ${tutorialSteps.length}`;
    
    const boxRect = tutorialBox.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow > boxRect.height + 20) {
        tutorialBox.style.top = `${rect.bottom + 20}px`;
    } else if (spaceAbove > boxRect.height + 20) {
        tutorialBox.style.top = `${rect.top - boxRect.height - 20}px`;
    } else {
        tutorialBox.style.top = `${(window.innerHeight - boxRect.height) / 2}px`;
    }
    tutorialBox.style.left = `${Math.max(10, Math.min(window.innerWidth - boxRect.width - 10, rect.left + rect.width / 2 - boxRect.width / 2))}px`;
    
    document.getElementById('tutorial-prev').disabled = index === 0;
    document.getElementById('tutorial-next').textContent = (index === tutorialSteps.length - 1) ? "Fertig" : "Weiter";
}


function endTutorial() {
    tutorialOverlay.classList.add('hidden');
    tutorialBox.classList.add('hidden');
    localStorage.setItem('hasVisitedBefore', 'true');
    updateTodoByKey('TUTORIAL_SEEN');
    tutorialOverlay.style.top = '50%';
    tutorialOverlay.style.left = '50%';
    tutorialOverlay.style.width = `0px`;
    tutorialOverlay.style.height = `0px`;
}

// --- Helferfunktionen ---
function adjustHexColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") { col = col.slice(1); usePound = true; }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

