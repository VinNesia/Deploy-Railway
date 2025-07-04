// Initialize Highlight.js
document.addEventListener('DOMContentLoaded', () => {
    hljs.highlightAll();
    loadTheme();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
    loadHistory();
    checkScriptLoaded();
});

// Check if script loaded successfully
function checkScriptLoaded() {
    if (typeof hljs === 'undefined') {
        alert('JavaScript failed to load. Please refresh the page.');
    }
}

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
            if (file.size > MAX_INPUT_SIZE) {
                alert('File size exceeds 5MB limit.');
                return;
            }
            showLoading();
            const reader = new FileReader();
            reader.onload = (ev) => {
                const input = ev.target.result;
                textarea.value = input;
                saveInputState(input);
                beautifyJSON();
                hideLoading();
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
const MAX_INPUT_SIZE = 5242880; // 5MB
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

// JSON History (using localStorage)
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

// Loading Indicators
function showLoading() {
    document.getElementById('jsonOutput').innerHTML = '<div class="spinner">Loading...</div>';
}

function hideLoading() {
    const spinner = document.querySelector('.spinner');
    if (spinner) spinner.remove();
}

// JSON Analysis
function analyzeJSONDetail() {
    showLoading();
    const input = document.getElementById('jsonInput').value.trim();
    const analysis = document.getElementById('jsonAnalysis');

    if (!input) {
        analysis.textContent = 'Error: JSON input is empty.';
        analysis.className = 'error';
        hideLoading();
        return;
    }

    if (new TextEncoder().encode(input).length > MAX_INPUT_SIZE) {
        analysis.textContent = 'Error: Input exceeds 5MB limit.';
        analysis.className = 'error';
        hideLoading();
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const stats = analyzeJSON(input);
        let analysisText = `<strong>JSON Analysis:</strong><br>${stats}<br><br>`;
        analysisText += generateVisualization(parsed);
        analysis.innerHTML = analysisText;
        analysis.className = '';
    } catch (error) {
        analysis.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        analysis.className = 'error';
    }
    hideLoading();
}

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
        return `Keys: ${stats.totalKeys}, Levels: ${stats.nestedLevels}, Arrays: ${stats.arrays}, Objects: ${stats.objects}, Strings: ${stats.strings}, Numbers: ${stats.numbers}, Booleans: ${stats.booleans}, Nulls: ${stats.nulls}, Size: ${stats.size} bytes, Parse Time: ${Math.round(endTime - startTime)}ms`;
    } catch {
        return 'Unable to analyze: Invalid JSON';
    }
}

function generateVisualization(json) {
    try {
        const parsed = JSON.parse(json);
        let viz = '<strong>Structure Visualization:</strong><br>';
        function visualize(obj, indent = 0) {
            if (Array.isArray(obj)) {
                viz += ' '.repeat(indent) + `- Array[${obj.length}]<br>`;
                obj.forEach(item => visualize(item, indent + 2));
            } else if (typeof obj === 'object' && obj !== null) {
                viz += ' '.repeat(indent) + `- Object[${Object.keys(obj).length}]<br>`;
                Object.entries(obj).forEach(([key, value]) => {
                    viz += ' '.repeat(indent + 2) + `${key}: `;
                    visualize(value, indent + 4);
                });
            } else {
                viz += ' '.repeat(indent) + `- ${typeof obj}: ${obj}<br>`;
            }
        }
        visualize(parsed);
        return viz;
    } catch {
        return 'Visualization failed: Invalid JSON';
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

// Beautify JSON
function beautifyJSON() {
    showLoading();
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
        hideLoading();
        return;
    }

    if (new TextEncoder().encode(input).length > MAX_INPUT_SIZE) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        stats.textContent = '';
        hideLoading();
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
    hideLoading();
}

// Validate JSON
function validateJSON() {
    showLoading();
    const input = document.getElementById('jsonInput').value.trim();
    const validationResult = document.getElementById('validationResult');
    const stats = document.getElementById('jsonStats');

    if (!input) {
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        stats.textContent = '';
        hideLoading();
        return;
    }

    if (new TextEncoder().encode(input).length > MAX_INPUT_SIZE) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        stats.textContent = '';
        hideLoading();
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
    hideLoading();
}

// Compress JSON
function compressJSON() {
    showLoading();
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
        hideLoading();
        return;
    }

    if (new TextEncoder().encode(input).length > MAX_INPUT_SIZE) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        stats.textContent = '';
        hideLoading();
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
    hideLoading();
}

// Undo Input
function undoInput() {
    showLoading();
    if (historyIndex > 0 && inputHistory[historyIndex - 1]) {
        historyIndex--;
        document.getElementById('jsonInput').value = inputHistory[historyIndex] || '';
        beautifyJSON();
    }
    hideLoading();
}

// Redo Input
function redoInput() {
    showLoading();
    if (historyIndex < inputHistory.length - 1 && inputHistory[historyIndex + 1]) {
        historyIndex++;
        document.getElementById('jsonInput').value = inputHistory[historyIndex] || '';
        beautifyJSON();
    }
    hideLoading();
}

// Clear Input
function clearInput() {
    showLoading();
    document.getElementById('jsonInput').value = '';
    document.getElementById('jsonOutput').textContent = '';
    document.getElementById('validationResult').textContent = '';
    document.getElementById('localResult').textContent = '';
    document.getElementById('jsonStats').textContent = '';
    document.getElementById('jsonAnalysis').textContent = '';
    document.getElementById('historySelect').value = '';
    document.getElementById('jsonSearch').value = '';
    hideLoading();
}

// Copy Output
function copyOutput() {
    showLoading();
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
    hideLoading();
}

// Download JSON
function downloadJSON() {
    showLoading();
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
    hideLoading();
}

// File Upload
document.getElementById('jsonFile').addEventListener('change', function (event) {
    showLoading();
    const file = event.target.files[0];
    if (file) {
        if (file.size > MAX_INPUT_SIZE) {
            alert('File size exceeds 5MB limit.');
            hideLoading();
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const input = e.target.result;
            document.getElementById('jsonInput').value = input;
            saveInputState(input);
            beautifyJSON();
            hideLoading();
        };
        reader.readAsText(file);
    }
});

// Search Input
document.getElementById('jsonSearch').addEventListener('input', () => {
    beautifyJSON();
});

// Save to Local Storage
function saveToLocal() {
    showLoading();
    const input = document.getElementById('jsonInput').value.trim();
    const localResult = document.getElementById('localResult');

    if (!input) {
        localResult.textContent = 'Error: JSON input is empty.';
        localResult.className = 'error';
        hideLoading();
        return;
    }

    try {
        JSON.parse(input); // Validate JSON
        localStorage.setItem('jsonBackup', input);
        localResult.textContent = 'JSON saved to local storage!';
        localResult.className = 'success';
        saveHistory(input);
    } catch (error) {
        localResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        localResult.className = 'error';
    }
    hideLoading();
}

// Load from Local Storage
function loadFromLocal() {
    showLoading();
    const input = localStorage.getItem('jsonBackup');
    const localResult = document.getElementById('localResult');
    const textarea = document.getElementById('jsonInput');

    if (!input) {
        localResult.textContent = 'Error: No JSON found in local storage.';
        localResult.className = 'error';
        hideLoading();
        return;
    }

    try {
        JSON.parse(input); // Validate JSON
        textarea.value = input;
        saveInputState(input);
        beautifyJSON();
        localResult.textContent = 'JSON loaded from local storage!';
        localResult.className = 'success';
    } catch (error) {
        localResult.textContent = `Error: ${error.message}. Suggestion: ${suggestFix(error)}`;
        localResult.className = 'error';
        localStorage.removeItem('jsonBackup'); // Clear invalid data
    }
    hideLoading();
}

// Export History
function exportHistory() {
    showLoading();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonHistory));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'json_history.json');
    downloadAnchor.click();
    hideLoading();
}

// Reset Local Storage
function resetLocalStorage() {
    showLoading();
    if (confirm('Are you sure you want to reset all local data?')) {
        localStorage.clear();
        jsonHistory = [];
        loadHistory();
        clearInput();
        document.getElementById('localResult').textContent = 'Local storage reset!';
        document.getElementById('localResult').className = 'success';
    }
    hideLoading();
}

// Send Feedback
function sendFeedback(event) {
    event.preventDefault();
    showLoading();
    const email = document.getElementById('userEmail').value;
    const message = document.getElementById('message').value;

    if (email && message) {
        const feedback = `Email: ${email}\nMessage: ${message}`;
        localStorage.setItem('feedbackDraft', feedback);
        alert(`Feedback drafted locally:\n${feedback}\nPlease copy and send to vin.nesia.id@gmail.com manually.`);
        document.getElementById('contactForm').reset();
    } else {
        alert('Please fill in both email and message.');
    }
    hideLoading();
}
