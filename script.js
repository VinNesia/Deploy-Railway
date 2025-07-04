// Initialize Highlight.js and EmailJS
document.addEventListener('DOMContentLoaded', () => {
    hljs.highlightAll();
    emailjs.init('aLROwrpQv9KqLSs96');
    loadHistory();
    loadTheme();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
});

// Supabase Client
const supabase = Supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Toggle menu for mobile
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('nav ul').classList.toggle('active');
});

// Toggle theme
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('#theme-toggle i');
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Load theme from localStorage
function loadTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.querySelector('#theme-toggle i').classList.replace('fa-sun', 'fa-moon');
    }
}

// Update current time in footer
function updateTime() {
    const now = new Date();
    const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const formattedTime = now.toLocaleString('en-US', options).replace(' at ', ' ').replace(',', '');
    document.getElementById('currentTime').textContent = formattedTime;
}

// Drag-and-Drop Setup
function setupDragAndDrop() {
    const textareaWrapper = document.getElementById('textareaWrapper');
    const textarea = document.getElementById('jsonInput');

    ['dragenter', 'dragover'].forEach(event => {
        textareaWrapper.addEventListener(event, (e) => {
            e.preventDefault();
            textareaWrapper.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        textareaWrapper.addEventListener(event, (e) => {
            e.preventDefault();
            textareaWrapper.classList.remove('dragover');
        });
    });

    textareaWrapper.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            if (file.size > 10485760) { // 10MB limit
                alert('File size exceeds 10MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const input = ev.target.result;
                textarea.value = input;
                saveInputState(input);
                beautifyJSON();
            };
            reader.readAsText(file);
        } else {
            alert('Please drop a valid JSON file.');
        }
    });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'b': e.preventDefault(); beautifyJSON(); break;
                case 'v': e.preventDefault(); validateJSON(); break;
                case 'm': e.preventDefault(); compressJSON(); break;
                case 'z': e.preventDefault(); undoInput(); break;
                case 'y': e.preventDefault(); redoInput(); break;
            }
        }
    });
}

// Undo/Redo state
let inputHistory = [];
let historyIndex = -1;

function saveInputState(input) {
    if (input && inputHistory[historyIndex] !== input) {
        inputHistory = inputHistory.slice(0, historyIndex + 1);
        inputHistory.push(input);
        historyIndex++;
        if (inputHistory.length > 20) {
            inputHistory.shift();
            historyIndex--;
        }
    }
}

// JSON History
let jsonHistory = JSON.parse(localStorage.getItem('jsonHistory')) || [];

function saveHistory(json) {
    if (json && !jsonHistory.includes(json)) {
        jsonHistory.unshift(json);
        if (jsonHistory.length > 10) jsonHistory.pop();
        localStorage.setItem('jsonHistory', JSON.stringify(jsonHistory));
        loadHistory();
    }
}

function loadHistory() {
    const historySelect = document.getElementById('historySelect');
    historySelect.innerHTML = '<option value="">Select Previous JSON</option>';
    jsonHistory.forEach((json, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = json.substring(0, 50) + (json.length > 50 ? '...' : '');
        historySelect.appendChild(option);
    });
}

document.getElementById('historySelect').addEventListener('change', function () {
    const index = this.value;
    if (index !== '') {
        const input = jsonHistory[index];
        document.getElementById('jsonInput').value = input;
        saveInputState(input);
        beautifyJSON();
    }
});

// JSON Analysis
function analyzeJSON(json) {
    const startTime = performance.now();
    try {
        const parsed = JSON.parse(json);
        const stats = {
            totalKeys: 0,
            nestedLevels: 0,
            arrays: 0,
            objects: 0,
            strings: 0,
            numbers: 0,
            booleans: 0,
            nulls: 0,
            size: new TextEncoder().encode(json).length
        };

        function traverse(obj, level = 0) {
            stats.nestedLevels = Math.max(stats.nestedLevels, level);
            if (Array.isArray(obj)) {
                stats.arrays++;
                obj.forEach(item => traverse(item, level + 1));
            } else if (typeof obj === 'object' && obj !== null) {
                stats.objects++;
                stats.totalKeys += Object.keys(obj).length;
                Object.values(obj).forEach(value => traverse(value, level + 1));
            } else if (typeof obj === 'string') {
                stats.strings++;
            } else if (typeof obj === 'number') {
                stats.numbers++;
            } else if (typeof obj === 'boolean') {
                stats.booleans++;
            } else if (obj === null) {
                stats.nulls++;
            }
        }

        traverse(parsed);
        const endTime = performance.now();
        return `Stats: ${stats.totalKeys} keys, ${stats.nestedLevels} levels, ${stats.arrays} arrays, ${stats.objects} objects, ${stats.strings} strings, ${stats.numbers} numbers, ${stats.booleans} booleans, ${stats.nulls} nulls, ${stats.size} bytes, Parsed in ${Math.round(endTime - startTime)}ms`;
    } catch {
        return 'Unable to analyze: Invalid JSON';
    }
}

// JSON Search
function highlightSearch(json, searchTerm) {
    if (!searchTerm) return json;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return json.replace(regex, '<span class="highlight">$1</span>');
}

// Error Suggestions
function suggestFix(error) {
    const message = error.message.toLowerCase();
    if (message.includes('unexpected token')) {
        return 'Check for missing or extra commas, brackets, or quotes near the indicated position.';
    } else if (message.includes('unexpected end')) {
        return 'Ensure all brackets and braces are properly closed.';
    } else if (message.includes('invalid character')) {
        return 'Remove invalid characters like unescaped quotes or backslashes.';
    } else if (message.includes('duplicate key')) {
        return 'Ensure all object keys are unique.';
    }
    return 'Review your JSON syntax for common issues.';
}

// GitHub Gist Integration
async function saveToGist() {
    const input = document.getElementById('jsonInput').value.trim();
    const gistResult = document.getElementById('gistResult');

    if (!input) {
        gistResult.textContent = 'Error: JSON input is empty.';
        gistResult.style.color = '#c53030';
        return;
    }

    try {
        const response = await fetch('/api/save-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input, type: 'gist' })
        });

        const data = await response.json();
        if (response.ok) {
            gistResult.innerHTML = `Gist saved! <a href="${data.html_url}" target="_blank">View Gist</a>`;
            gistResult.style.color = '#2f855a';
        } else {
            gistResult.textContent = `Error: ${data.message || 'Failed to save Gist.'}`;
            gistResult.style.color = '#c53030';
        }
    } catch (error) {
        gistResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        gistResult.style.color = '#c53030';
    }
}

async function loadFromGist() {
    const gistId = document.getElementById('gistId').value.trim();
    const gistResult = document.getElementById('gistResult');
    const textarea = document.getElementById('jsonInput');

    if (!gistId) {
        gistResult.textContent = 'Error: Please enter a Gist ID.';
        gistResult.style.color = '#c53030';
        return;
    }

    try {
        const response = await fetch(`/api/load-json?gistId=${gistId}`);
        const data = await response.json();
        if (response.ok && data.content) {
            textarea.value = data.content;
            saveInputState(data.content);
            beautifyJSON();
            gistResult.textContent = 'Gist loaded successfully!';
            gistResult.style.color = '#2f855a';
        } else {
            gistResult.textContent = `Error: ${data.message || 'No valid JSON found in Gist.'}`;
            gistResult.style.color = '#c53030';
        }
    } catch (error) {
        gistResult.textContent = `Error: ${error.message}`;
        gistResult.style.color = '#c53030';
    }
}

// Supabase Integration
async function saveToDatabase() {
    const input = document.getElementById('jsonInput').value.trim();
    const dbResult = document.getElementById('dbResult');

    if (!input) {
        dbResult.textContent = 'Error: JSON input is empty.';
        dbResult.style.color = '#c53030';
        return;
    }

    try {
        const response = await fetch('/api/save-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input, type: 'database' })
        });

        const data = await response.json();
        if (response.ok) {
            dbResult.innerHTML = `JSON saved to database! ID: ${data.id}`;
            dbResult.style.color = '#2f855a';
            saveHistory(input);
        } else {
            dbResult.textContent = `Error: ${data.message || 'Failed to save to database.'}`;
            dbResult.style.color = '#c53030';
        }
    } catch (error) {
        dbResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        dbResult.style.color = '#c53030';
    }
}

async function loadFromDatabase() {
    const jsonId = document.getElementById('jsonId').value.trim();
    const dbResult = document.getElementById('dbResult');
    const textarea = document.getElementById('jsonInput');

    if (!jsonId) {
        dbResult.textContent = 'Error: Please enter a JSON ID.';
        dbResult.style.color = '#c53030';
        return;
    }

    try {
        const response = await fetch(`/api/load-json?jsonId=${jsonId}`);
        const data = await response.json();
        if (response.ok && data.content) {
            textarea.value = data.content;
            saveInputState(data.content);
            beautifyJSON();
            dbResult.textContent = 'JSON loaded from database!';
            dbResult.style.color = '#2f855a';
        } else {
            dbResult.textContent = `Error: ${data.message || 'No JSON found with this ID.'}`;
            dbResult.style.color = '#c53030';
        }
    } catch (error) {
        dbResult.textContent = `Error: ${error.message}`;
        dbResult.style.color = '#c53030';
    }
}

// Beautify JSON
function beautifyJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const validationResult = document.getElementById('validationResult');
    const stats = document.getElementById('jsonStats');
    const searchTerm = document.getElementById('jsonSearch').value;
    const indent = document.getElementById('indentation').value;

    if (!input) {
        output.textContent = '';
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        stats.textContent = '';
        return;
    }

    if (new TextEncoder().encode(input).length > 10485760) { // 10MB limit
        validationResult.textContent = 'Error: Input exceeds 10MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        stats.textContent = '';
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const indentValue = indent === 'tab' ? '\t' : parseInt(indent);
        const formatted = JSON.stringify(parsed, null, indentValue);
        output.innerHTML = highlightSearch(formatted, searchTerm);
        output.className = 'language-json';
        validationResult.textContent = 'Valid JSON!';
        validationResult.className = 'success';
        stats.textContent = analyzeJSON(input);
        saveInputState(input);
        saveHistory(input);
        hljs.highlightElement(output);
    } catch (error) {
        output.textContent = '';
        validationResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        validationResult.className = 'error';
        stats.textContent = '';
    }
}

// Validate JSON
function validateJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const validationResult = document.getElementById('validationResult');
    const stats = document.getElementById('jsonStats');

    if (!input) {
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        stats.textContent = '';
        return;
    }

    if (new TextEncoder().encode(input).length > 10485760) { // 10MB limit
        validationResult.textContent = 'Error: Input exceeds 10MB limit.';
        validationResult.className = 'error';
        stats.textContent = '';
        return;
    }

    try {
        JSON.parse(input);
        validationResult.textContent = 'Valid JSON!';
        validationResult.className = 'success';
        stats.textContent = analyzeJSON(input);
        saveHistory(input);
    } catch (error) {
        validationResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        validationResult.className = 'error';
        stats.textContent = '';
    }
}

// Compress JSON
function compressJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const validationResult = document.getElementById('validationResult');
    const stats = document.getElementById('jsonStats');
    const searchTerm = document.getElementById('jsonSearch').value;

    if (!input) {
        output.textContent = '';
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        stats.textContent = '';
        return;
    }

    if (new TextEncoder().encode(input).length > 10485760) { // 10MB limit
        validationResult.textContent = 'Error: Input exceeds 10MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        stats.textContent = '';
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const compressed = JSON.stringify(parsed);
        output.innerHTML = highlightSearch(compressed, searchTerm);
        output.className = 'language-json';
        validationResult.textContent = 'JSON Compressed!';
        validationResult.className = 'success';
        stats.textContent = analyzeJSON(input);
        saveInputState(input);
        saveHistory(input);
        hljs.highlightElement(output);
    } catch (error) {
        output.textContent = '';
        validationResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        validationResult.className = 'error';
        stats.textContent = '';
    }
}

// Undo Input
function undoInput() {
    if (historyIndex > 0 && inputHistory[historyIndex - 1]) {
        historyIndex--;
        document.getElementById('jsonInput').value = inputHistory[historyIndex] || '';
        beautifyJSON();
    }
}

// Redo Input
function redoInput() {
    if (historyIndex < inputHistory.length - 1 && inputHistory[historyIndex + 1]) {
        historyIndex++;
        document.getElementById('jsonInput').value = inputHistory[historyIndex] || '';
        beautifyJSON();
    }
}

// Clear Input
function clearInput() {
    document.getElementById('jsonInput').value = '';
    document.getElementById('jsonOutput').textContent = '';
    document.getElementById('validationResult').textContent = '';
    document.getElementById('gistResult').textContent = '';
    document.getElementById('dbResult').textContent = '';
    document.getElementById('jsonStats').textContent = '';
    document.getElementById('historySelect').value = '';
    document.getElementById('jsonSearch').value = '';
    document.getElementById('gistId').value = '';
    document.getElementById('jsonId').value = '';
}

// Copy Output
function copyOutput() {
    const output = document.getElementById('jsonOutput').textContent;
    if (output) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(output).then(() => {
                alert('JSON copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy JSON. Use Ctrl+C manually.');
            });
        } else {
            alert('Clipboard API not supported. Use Ctrl+C manually.');
        }
    } else {
        alert('Nothing to copy!');
    }
}

// Download JSON
function downloadJSON() {
    const output = document.getElementById('jsonOutput').textContent;
    if (output) {
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('Nothing to download!');
    }
}

// File Upload
document.getElementById('jsonFile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 10485760) { // 10MB limit
            alert('File size exceeds 10MB limit.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const input = e.target.result;
            document.getElementById('jsonInput').value = input;
            saveInputState(input);
            beautifyJSON();
        };
        reader.readAsText(file);
    }
});

// Search Input
document.getElementById('jsonSearch').addEventListener('input', () => {
    beautifyJSON();
});

// EmailJS Feedback Form
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    emailjs.send('service_zrumu1h', 'template_b3ayww4', {
        user_email: document.getElementById('userEmail').value,
        message: document.getElementById('message').value
    }).then(() => {
        alert('Feedback sent successfully!');
        document.getElementById('contactForm').reset();
    }).catch(err => {
        alert('Failed to send feedback: ' + err.message);
    });
});
