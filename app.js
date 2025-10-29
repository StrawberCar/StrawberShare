// DOM Elements
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.querySelector('.close');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const fileGrid = document.getElementById('fileGrid');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.querySelector('.progress-fill');
const uploadResult = document.getElementById('uploadResult');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Global state
let allFiles = [];

// Modal Controls
uploadBtn.addEventListener('click', () => {
  uploadModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
  uploadModal.style.display = 'none';
  resetUploadForm();
});

window.addEventListener('click', (e) => {
  if (e.target === uploadModal) {
    uploadModal.style.display = 'none';
    resetUploadForm();
  }
});

// File Input
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileName.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
  }
});

// Upload Form
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    showUploadResult('Please select a file', 'error');
    return;
  }

  const visibility = document.querySelector('input[name="visibility"]:checked').value;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('visibility', visibility);

  submitBtn.disabled = true;
  uploadProgress.style.display = 'block';
  uploadResult.style.display = 'none';
  progressFill.style.width = '50%';

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    progressFill.style.width = '100%';

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    let resultMessage = '';
    if (visibility === 'link-only') {
      const directLink = `${CONFIG.API_BASE_URL}/api/download/${data.id}`;
      const viewLink = `${CONFIG.API_BASE_URL}/view/${data.id}`;
      resultMessage = `
        <strong>Upload successful!</strong><br>
        <strong>Direct link:</strong> <a href="${directLink}" target="_blank">${directLink}</a><br>
        <strong>View page (with embeds):</strong> <a href="${viewLink}" target="_blank">${viewLink}</a>
      `;
    } else {
      const viewLink = `${CONFIG.API_BASE_URL}/view/${data.id}`;
      resultMessage = `
        <strong>Upload successful!</strong><br>
        Your file is now public. <a href="${viewLink}" target="_blank">View it here</a>
      `;
      loadFiles(); // Refresh the file grid
    }

    showUploadResult(resultMessage, 'success');
    setTimeout(() => {
      if (visibility === 'public') {
        uploadModal.style.display = 'none';
        resetUploadForm();
      }
    }, 3000);

  } catch (error) {
    console.error('Upload error:', error);
    showUploadResult('Upload failed. Please check your connection and try again.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

function resetUploadForm() {
  uploadForm.reset();
  fileName.textContent = '';
  uploadProgress.style.display = 'none';
  uploadResult.style.display = 'none';
  progressFill.style.width = '0%';
}

function showUploadResult(message, type) {
  uploadResult.innerHTML = message;
  uploadResult.className = `upload-result ${type}`;
  uploadResult.style.display = 'block';
}

// Load Files
async function loadFiles() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/files`);

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    const files = await response.json();
    allFiles = files; // Store files globally for searching

    if (files.length === 0) {
      fileGrid.innerHTML = `
        <div class="no-files">
          <p>No files uploaded yet</p>
          <p style="font-size: 14px; color: #666;">Be the first to share something!</p>
        </div>
      `;
      return;
    }

    fileGrid.innerHTML = files.map(file => createFileCard(file)).join('');

  } catch (error) {
    console.error('Error loading files:', error);
    fileGrid.innerHTML = `
      <div class="no-files">
        <p>Unable to load files</p>
        <p style="font-size: 14px; color: #666;">Please check if the backend server is running</p>
      </div>
    `;
  }
}

function createFileCard(file) {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const fileUrl = `${CONFIG.API_BASE_URL}/api/download/${file.id}`;
  const viewUrl = `${CONFIG.API_BASE_URL}/view/${file.id}`;

  let thumbnail = '<div class="file-icon">\u{1F4C4}</div>';

  if (isImage) {
    thumbnail = `<img src="${fileUrl}" alt="${file.original_name}" loading="lazy">`;
  } else if (isVideo) {
    thumbnail = `<video src="${fileUrl}" muted></video>`;
  }

  const uploadDate = new Date(file.upload_date).toLocaleDateString();

  return `
    <div class="file-card" onclick="window.open('${viewUrl}', '_blank')">
      <div class="file-thumbnail">
        ${thumbnail}
      </div>
      <div class="file-info">
        <div class="file-title" title="${file.original_name}">${file.original_name}</div>
        <div class="file-meta">
          <span>${formatFileSize(file.size)}</span>
          <span>${file.views} views</span>
        </div>
        <div class="file-meta">
          <span>${uploadDate}</span>
        </div>
      </div>
    </div>
  `;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Fuzzy Search Algorithm
function fuzzyMatch(pattern, str) {
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();

  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

  while (patternIdx < pattern.length && strIdx < str.length) {
    if (pattern[patternIdx] === str[strIdx]) {
      score += 1 + consecutiveMatches;
      consecutiveMatches++;
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
    strIdx++;
  }

  // If we matched all pattern characters, return the score
  if (patternIdx === pattern.length) {
    // Boost score for matches at the beginning
    const matchedEarly = str.startsWith(pattern) ? 10 : 0;
    return score + matchedEarly;
  }

  return 0;
}

function searchFiles(query) {
  if (!query.trim()) {
    searchResults.style.display = 'none';
    return;
  }

  const matches = allFiles
    .map(file => ({
      file,
      score: fuzzyMatch(query, file.original_name)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Show top 10 results

  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No files found</div>';
    searchResults.style.display = 'block';
    return;
  }

  searchResults.innerHTML = matches.map(item => {
    const file = item.file;
    const isImage = file.mimetype.startsWith('image/');
    const viewUrl = `${CONFIG.API_BASE_URL}/view/${file.id}`;
    const uploadDate = new Date(file.upload_date).toLocaleDateString();

    let icon = '\u{1F4C4}';
    if (isImage) icon = '\u{1F5BC}';
    else if (file.mimetype.startsWith('video/')) icon = '\u{1F3AC}';
    else if (file.mimetype.startsWith('audio/')) icon = '\u{1F3B5}';

    return `
      <div class="search-result-item" onclick="window.open('${viewUrl}', '_blank')">
        <span class="result-icon">${icon}</span>
        <div class="result-info">
          <div class="result-name">${file.original_name}</div>
          <div class="result-meta">${formatFileSize(file.size)} • ${uploadDate} • ${file.views} views</div>
        </div>
      </div>
    `;
  }).join('');

  searchResults.style.display = 'block';
}

// Search Input Handler
searchInput.addEventListener('input', (e) => {
  searchFiles(e.target.value);
});

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = 'none';
  }
});

// Show search results when focusing on input if there's a query
searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) {
    searchFiles(searchInput.value);
  }
});

// Initialize
loadFiles();
