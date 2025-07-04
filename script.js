// Initialize Highlight.js
document.addEventListener('DOMContentLoaded', () => {
    hljs.highlightAll();
    loadTheme();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
    checkScriptLoaded();
    setupMenuToggle();
    setupFileUpload();
    console.log('Script loaded and initialized at 04:26 AM WIB');
});

// Check if script loaded successfully
function checkScriptLoaded() {
    if (typeof hljs === 'undefined') {
        console.error('Highlight.js failed to load.');
        alert('JavaScript failed to load. Please refresh the page.');
    }
}

// Toggle menu for mobile
function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    } else {
        console.error('Menu toggle or nav menu not found.');
    }
}

// Toggle theme
document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.classList.toggle('fa-sun');
        icon.classList.toggle('fa-moon');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    }
});

// Load theme from localStorage
function loadTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        const icon = document.querySelector('#theme-toggle i');
        if (icon) icon.classList.replace('fa-sun', 'fa-moon');
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
    if (textareaWrapper && textarea) {
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
            if (file) handleFileUpload(file);
        });
    } else {
        console.error('Textarea wrapper or input not found for drag-and-drop.');
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'b': e.preventDefault(); beautifyJSON(); break;
                case 'v': e.preventDefault(); validateJSON(); break;
                case 'm': e.preventDefault(); compressJSON(); break;
            }
        }
    });
}

// File Upload Setup
function setupFileUpload() {
    const fileInput = document.getElementById('jsonFileUpload');
    const textarea = document.getElementById('jsonInput');
    const validationResult = document.getElementById('validationResult');
    if (fileInput && textarea && validationResult) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) handleFileUpload(file);
            else {
                validationResult.textContent = 'Error: No file selected.';
                validationResult.className = 'error';
            }
        });
    } else {
        console.error('File input, textarea, or validation result not found.');
    }
}

// Handle File Upload
function handleFileUpload(file) {
    const textarea = document.getElementById('jsonInput');
    const validationResult = document.getElementById('validationResult');
    const fileInput = document.getElementById('jsonFileUpload');

    if (!textarea || !validationResult || !fileInput) {
        console.error('Required elements not found for file upload.');
        return;
    }

    if (file.type !== 'application/json') {
        validationResult.textContent = 'Error: Please upload a valid JSON file.';
        validationResult.className = 'error';
        fileInput.value = '';
        return;
    }

    if (file.size > 5242880) {
        validationResult.textContent = 'Error: File size exceeds 5MB limit.';
        validationResult.className = 'error';
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            JSON.parse(e.target.result);
            textarea.value = e.target.result;
            beautifyJSON();
            validationResult.textContent = 'JSON file uploaded successfully!';
            validationResult.className = 'success';
        } catch (error) {
            validationResult.textContent = `Error: Invalid JSON file - ${error.message}`;
            validationResult.className = 'error';
            textarea.value = '';
        }
    };
    reader.onerror = () => {
        validationResult.textContent = 'Error: Failed to read the file.';
        validationResult.className = 'error';
        fileInput.value = '';
    };
    reader.readAsText(file);
}

// Beautify JSON
function beautifyJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const validationResult = document.getElementById('validationResult');

    if (!input) {
        output.textContent = '';
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        return;
    }

    if (new TextEncoder().encode(input).length > 5242880) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const indent = document.getElementById('indentation').value;
        const indentValue = indent === 'tab' ? '\t' : parseInt(indent);
        const formatted = JSON.stringify(parsed, null, indentValue);
        output.textContent = formatted;
        output.className = 'language-json';
        validationResult.textContent = 'Valid JSON!';
        validationResult.className = 'success';
        hljs.highlightElement(output);
    } catch (error) {
        output.textContent = '';
        validationResult.textContent = `Error: ${error.message}`;
        validationResult.className = 'error';
    }
}

// Validate JSON
function validateJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const validationResult = document.getElementById('validationResult');

    if (!input) {
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        return;
    }

    if (new TextEncoder().encode(input).length > 5242880) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        return;
    }

    try {
        JSON.parse(input);
        validationResult.textContent = 'Valid JSON!';
        validationResult.className = 'success';
    } catch (error) {
        validationResult.textContent = `Error: ${error.message}`;
        validationResult.className = 'error';
    }
}

// Compress JSON
function compressJSON() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const validationResult = document.getElementById('validationResult');

    if (!input) {
        output.textContent = '';
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        return;
    }

    if (new TextEncoder().encode(input).length > 5242880) {
        validationResult.textContent = 'Error: Input exceeds 5MB limit.';
        validationResult.className = 'error';
        output.textContent = '';
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const compressed = JSON.stringify(parsed);
        output.textContent = compressed;
        output.className = 'language-json';
        validationResult.textContent = 'JSON Compressed!';
        validationResult.className = 'success';
        hljs.highlightElement(output);
    } catch (error) {
        output.textContent = '';
        validationResult.textContent = `Error: ${error.message}`;
        validationResult.className = 'error';
    }
}

// Copy Output
function copyOutput() {
    const output = document.getElementById('jsonOutput').textContent;
    if (output) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(output).then(() => {
                alert('JSON copied to clipboard!');
            }).catch(() => {
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

// Save to Local Storage
function saveToLocal() {
    const input = document.getElementById('jsonInput').value.trim();
    const validationResult = document.getElementById('validationResult');

    if (!input) {
        validationResult.textContent = 'Error: JSON input is empty.';
        validationResult.className = 'error';
        return;
    }

    try {
        JSON.parse(input);
        localStorage.setItem('jsonBackup', input);
        validationResult.textContent = 'JSON saved to local storage!';
        validationResult.className = 'success';
    } catch (error) {
        validationResult.textContent = `Error: ${error.message}`;
        validationResult.className = 'error';
    }
}

// Load from Local Storage
function loadFromLocal() {
    const input = localStorage.getItem('jsonBackup');
    const validationResult = document.getElementById('validationResult');
    const textarea = document.getElementById('jsonInput');

    if (!input) {
        validationResult.textContent = 'Error: No JSON found in local storage.';
        validationResult.className = 'error';
        return;
    }

    try {
        JSON.parse(input);
        textarea.value = input;
        beautifyJSON();
        validationResult.textContent = 'JSON loaded from local storage!';
        validationResult.className = 'success';
    } catch (error) {
        validationResult.textContent = `Error: ${error.message}`;
        validationResult.className = 'error';
        localStorage.removeItem('jsonBackup');
    }
}

// Send Feedback
function sendFeedback(event) {
    event.preventDefault();
    const email = document.getElementById('userEmail').value;
    const message = document.getElementById('message').value;

    if (email && message) {
        const feedback = `Email: ${email}\nMessage: ${message}`;
        localStorage.setItem('feedbackDraft', feedback);
        alert(`Feedback drafted locally:\n${feedback}\nPlease send to vin.nesia.id@gmail.com manually.`);
        document.getElementById('contactForm').reset();
    } else {
        alert('Please fill in both email and message.');
    }
}
