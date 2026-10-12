/**
 * CloudVault - Cloud File Storage and Sharing System
 * Client-Side Application Logic with Dual-Engine (Spring Boot API + Offline Sandbox)
 */

const API_BASE = 'http://localhost:8080/api';
let isBackendAvailable = false;
let currentFilter = 'all';
let currentView = 'grid'; // 'grid' or 'list'
let currentFiles = [];

// ==========================================================================
// Theme Management (Light / Dark)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('cloudvault_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cloudvault_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  if (theme === 'dark') {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
}

// ==========================================================================
// Toast Notifications
// ==========================================================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// Auth State Helpers
// ==========================================================================
function getAuthToken() {
  return localStorage.getItem('cloudvault_jwt');
}

function setAuthToken(token) {
  localStorage.setItem('cloudvault_jwt', token);
}

function getUser() {
  const user = localStorage.getItem('cloudvault_user');
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  localStorage.setItem('cloudvault_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('cloudvault_jwt');
  localStorage.removeItem('cloudvault_user');
  window.location.href = 'login.html';
}

// ==========================================================================
// Offline Sandbox Store (Fallback for instant browser preview)
// ==========================================================================
const SANDBOX_STORAGE_KEY = 'cloudvault_sandbox_files';

function getSandboxFiles() {
  const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
  if (!raw) {
    const seed = [
      {
        id: 1,
        originalFileName: 'System_Architecture_Diagram.png',
        contentType: 'image/png',
        size: 1420000,
        uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        isStarred: true,
        isPublic: true,
        shareToken: 'tok-arch-8832',
        downloadCount: 14,
        previewData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2338bdf8">Cloud File Storage Architecture</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2394a3b8">Spring Boot 3 + H2 Database + Pure Web Frontend</text></svg>'
      },
      {
        id: 2,
        originalFileName: 'Q4_Cloud_Migration_Plan.pdf',
        contentType: 'application/pdf',
        size: 3840000,
        uploadedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        isStarred: false,
        isPublic: false,
        shareToken: null,
        downloadCount: 0
      },
      {
        id: 3,
        originalFileName: 'CloudStorageApplication.java',
        contentType: 'text/plain',
        size: 18400,
        uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        isStarred: true,
        isPublic: true,
        shareToken: 'tok-java-app-102',
        downloadCount: 6,
        previewData: `package com.cloudstorage;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class CloudStorageApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(CloudStorageApplication.class, args);\n    }\n}`
      },
      {
        id: 4,
        originalFileName: 'Client_Encrypted_Backup.zip',
        contentType: 'application/zip',
        size: 18450000,
        uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        isStarred: false,
        isPublic: false,
        shareToken: null,
        downloadCount: 0
      }
    ];
    localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function saveSandboxFiles(files) {
  localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(files));
}

// ==========================================================================
// API & Connectivity Check
// ==========================================================================
async function checkBackendConnectivity() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken() || ''}`
      }
    });
    // If backend responds (even 401 Unauthorized), the backend server is online!
    isBackendAvailable = true;
  } catch (err) {
    isBackendAvailable = false;
  }
  updateStatusBadge();
}

function updateStatusBadge() {
  const badge = document.getElementById('api-status-badge');
  if (!badge) return;
  if (isBackendAvailable) {
    badge.className = 'api-badge online';
    badge.innerHTML = `<span class="dot"></span> Live API`;
    badge.title = 'Connected to Spring Boot backend at http://localhost:8080';
  } else {
    badge.className = 'api-badge sandbox';
    badge.innerHTML = `<span class="dot"></span> Sandbox Demo`;
    badge.title = 'Running in Browser Sandbox. Start Spring Boot backend to enable live database!';
  }
}

// ==========================================================================
// Authentication Handlers
// ==========================================================================
async function handleLogin(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('login-btn');

  if (!usernameOrEmail || !password) {
    showToast('Please enter both username and password.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = 'Signing in...';

  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }
      setAuthToken(data.token);
      setUser(data);
      showToast('Logged in successfully!', 'success');
      window.location.href = 'dashboard.html';
    } else {
      // Offline fallback login for demo accounts
      const user = {
        username: usernameOrEmail,
        fullName: usernameOrEmail === 'admin' ? 'Administrator' : 'Demo User',
        email: `${usernameOrEmail}@cloudstorage.io`,
        storageUsedBytes: 23728400,
        storageLimitBytes: 5368709120
      };
      setUser(user);
      setAuthToken('mock-jwt-token-' + Date.now());
      showToast('Welcome to Sandbox Mode!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
    }
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const submitBtn = document.getElementById('register-btn');

  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = 'Creating Account...';

  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setAuthToken(data.token);
      setUser(data);
      showToast('Account created successfully!', 'success');
      window.location.href = 'dashboard.html';
    } else {
      const user = {
        username,
        fullName: fullName || username,
        email,
        storageUsedBytes: 0,
        storageLimitBytes: 2147483648
      };
      setUser(user);
      setAuthToken('mock-jwt-token-' + Date.now());
      showToast('Account created! (Sandbox Mode)', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
    }
  } catch (err) {
    showToast(err.message || 'Registration error', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Create Account';
  }
}

// Quick Fill for Login Demo Account
function fillDemoAccount(type = 'demo') {
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  if (usernameInput && passwordInput) {
    if (type === 'admin') {
      usernameInput.value = 'admin';
      passwordInput.value = 'password123';
    } else {
      usernameInput.value = 'demo';
      passwordInput.value = 'demo123';
    }
    showToast(`Filled ${type} credentials! Click 'Sign In'.`, 'info');
  }
}

// ==========================================================================
// Dashboard Logic & File Operations
// ==========================================================================
async function initDashboard() {
  await checkBackendConnectivity();
  renderUserProfile();
  loadFiles();
  setupEventListeners();
}

function renderUserProfile() {
  const user = getUser() || {
    username: 'Guest User',
    email: 'guest@cloudstorage.io',
    fullName: 'Guest User'
  };

  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl) nameEl.innerText = user.fullName || user.username;
  if (emailEl) emailEl.innerText = user.email;
  if (avatarEl) {
    const initials = (user.fullName || user.username).substring(0, 2).toUpperCase();
    avatarEl.innerText = initials;
  }
}

async function loadFiles(searchQuery = '') {
  try {
    if (isBackendAvailable && getAuthToken()) {
      let url = `${API_BASE}/files?filter=${currentFilter}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        currentFiles = await res.json();
      } else {
        currentFiles = getSandboxFiles();
      }
    } else {
      let files = getSandboxFiles();
      if (currentFilter === 'starred') {
        files = files.filter(f => f.isStarred);
      } else if (currentFilter === 'shared') {
        files = files.filter(f => f.isPublic);
      }
      if (searchQuery) {
        files = files.filter(f => f.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      currentFiles = files;
    }

    renderFilesList(currentFiles);
    updateStorageMeter();
  } catch (err) {
    console.warn('Error loading files:', err);
    currentFiles = getSandboxFiles();
    renderFilesList(currentFiles);
    updateStorageMeter();
  }
}

function renderFilesList(files) {
  const container = document.getElementById('files-container');
  const emptyState = document.getElementById('empty-state');
  const totalCountEl = document.getElementById('stat-total-files');
  const sharedCountEl = document.getElementById('stat-shared-files');
  const starredCountEl = document.getElementById('stat-starred-files');

  // Update Counters
  const allSandbox = getSandboxFiles();
  const sourceList = isBackendAvailable ? files : allSandbox;
  if (totalCountEl) totalCountEl.innerText = sourceList.length;
  if (sharedCountEl) sharedCountEl.innerText = sourceList.filter(f => f.isPublic).length;
  if (starredCountEl) starredCountEl.innerText = sourceList.filter(f => f.isStarred).length;

  if (!files || files.length === 0) {
    if (container) container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (currentView === 'grid') {
    renderGridView(files, container);
  } else {
    renderTableView(files, container);
  }
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'other';
}

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(isoDate) {
  if (!isoDate) return 'Recently';
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderGridView(files, container) {
  container.className = 'file-grid';
  container.innerHTML = files.map(file => {
    const ext = getFileExtension(file.originalFileName);
    const extClass = `ext-${ext}` in document.styleSheets ? `ext-${ext}` : `ext-${ext}`;
    const isStarred = file.isStarred;
    const isShared = file.isPublic;

    return `
      <div class="file-card" onclick="handleCardClick(event, ${file.id})">
        <div class="file-card-top">
          <div class="file-type-icon ext-${ext}">${ext.substring(0, 4)}</div>
          <div class="file-card-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" title="${isStarred ? 'Unstar' : 'Star'}" onclick="toggleStar(${file.id})">
              ${isStarred ? '⭐' : '☆'}
            </button>
            <button class="btn-icon" title="Share" onclick="openShareModal(${file.id})">🔗</button>
            <button class="btn-icon" title="Delete" onclick="deleteFile(${file.id})">🗑️</button>
          </div>
        </div>

        <div class="file-name" title="${file.originalFileName}">${file.originalFileName}</div>
        
        <div class="file-meta">
          <span>${formatBytes(file.size)}</span>
          ${isShared ? '<span class="file-status-tag">Shared</span>' : ''}
          <span>${formatDate(file.uploadedAt)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderTableView(files, container) {
  container.className = 'file-table-container';
  container.innerHTML = `
    <table class="file-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Shared</th>
          <th>Uploaded</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${files.map(file => {
          const ext = getFileExtension(file.originalFileName);
          return `
            <tr>
              <td>
                <div class="table-file-cell">
                  <div class="table-ext-badge ext-${ext}">${ext.substring(0, 3)}</div>
                  <span style="font-weight: 500;">${file.originalFileName}</span>
                </div>
              </td>
              <td>${formatBytes(file.size)}</td>
              <td>${file.isPublic ? '<span class="file-status-tag">Public Link</span>' : '<span style="color:var(--text-muted)">Private</span>'}</td>
              <td>${formatDate(file.uploadedAt)}</td>
              <td style="text-align: right;">
                <button class="btn-icon" title="Preview" onclick="previewFile(${file.id})">👁️</button>
                <button class="btn-icon" title="Download" onclick="downloadFile(${file.id})">⬇️</button>
                <button class="btn-icon" title="Share" onclick="openShareModal(${file.id})">🔗</button>
                <button class="btn-icon" title="Star" onclick="toggleStar(${file.id})">${file.isStarred ? '⭐' : '☆'}</button>
                <button class="btn-icon" title="Delete" onclick="deleteFile(${file.id})">🗑️</button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function handleCardClick(event, fileId) {
  previewFile(fileId);
}

// ==========================================================================
// Storage Meter & Calculations
// ==========================================================================
function updateStorageMeter() {
  const files = isBackendAvailable ? currentFiles : getSandboxFiles();
  const usedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalQuota = 2 * 1024 * 1024 * 1024; // 2 GB

  const percentage = Math.min(100, Math.round((usedBytes / totalQuota) * 100 * 10) / 10);

  const fillEl = document.getElementById('storage-progress-fill');
  const textEl = document.getElementById('storage-text');
  const statUsedEl = document.getElementById('stat-storage-used');

  if (fillEl) fillEl.style.width = `${Math.max(percentage, 2)}%`;
  if (textEl) textEl.innerText = `${formatBytes(usedBytes)} of ${formatBytes(totalQuota)} used (${percentage}%)`;
  if (statUsedEl) statUsedEl.innerText = formatBytes(usedBytes);
}

// ==========================================================================
// File Upload Logic
// ==========================================================================
let pendingUploads = [];

function handleFileSelect(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  queueFiles(Array.from(files));
}

function queueFiles(files) {
  pendingUploads = files;
  const queueEl = document.getElementById('upload-queue-list');
  const uploadBtn = document.getElementById('confirm-upload-btn');

  if (queueEl) {
    queueEl.innerHTML = files.map((file, i) => `
      <div class="queue-item">
        <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;">
          ${file.name}
        </span>
        <span style="color: var(--text-muted); font-size: 0.8rem;">
          ${formatBytes(file.size)}
        </span>
      </div>
    `).join('');
  }

  if (uploadBtn) {
    uploadBtn.disabled = files.length === 0;
    uploadBtn.innerText = `Upload ${files.length} File${files.length > 1 ? 's' : ''}`;
  }
}

async function executeUpload() {
  if (pendingUploads.length === 0) return;
  const uploadBtn = document.getElementById('confirm-upload-btn');
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.innerText = 'Uploading...';
  }

  try {
    if (isBackendAvailable && getAuthToken()) {
      const formData = new FormData();
      for (const file of pendingUploads) {
        formData.append('files', file);
      }

      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      showToast(`Uploaded ${pendingUploads.length} file(s) successfully!`, 'success');
    } else {
      // Sandbox mode upload
      const existing = getSandboxFiles();
      for (const f of pendingUploads) {
        // Read text or data URL for instant previewing
        let previewData = null;
        if (f.type.startsWith('image/')) {
          previewData = await readFileAsDataURL(f);
        } else if (f.type.startsWith('text/') || f.name.endsWith('.java') || f.name.endsWith('.js')) {
          previewData = await readFileAsText(f);
        }

        const newFile = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          originalFileName: f.name,
          contentType: f.type || 'application/octet-stream',
          size: f.size,
          uploadedAt: new Date().toISOString(),
          isStarred: false,
          isPublic: false,
          shareToken: null,
          downloadCount: 0,
          previewData: previewData
        };
        existing.unshift(newFile);
      }
      saveSandboxFiles(existing);
      showToast(`Uploaded ${pendingUploads.length} file(s) to Sandbox!`, 'success');
    }

    closeModal('upload-modal');
    pendingUploads = [];
    document.getElementById('upload-input').value = '';
    loadFiles();
  } catch (err) {
    showToast(err.message || 'Error uploading file', 'error');
  } finally {
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.innerText = 'Start Upload';
    }
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsText(file);
  });
}

// ==========================================================================
// File Actions: Star, Delete, Download, Preview, Share
// ==========================================================================
async function toggleStar(fileId) {
  try {
    if (isBackendAvailable && getAuthToken()) {
      await fetch(`${API_BASE}/files/${fileId}/star`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
    } else {
      const files = getSandboxFiles();
      const target = files.find(f => f.id === fileId);
      if (target) {
        target.isStarred = !target.isStarred;
        saveSandboxFiles(files);
      }
    }
    loadFiles();
  } catch (err) {
    showToast('Failed to update favorite status', 'error');
  }
}

async function deleteFile(fileId) {
  if (!confirm('Are you sure you want to permanently delete this file?')) return;

  try {
    if (isBackendAvailable && getAuthToken()) {
      const res = await fetch(`${API_BASE}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error('Could not delete file');
    } else {
      let files = getSandboxFiles();
      files = files.filter(f => f.id !== fileId);
      saveSandboxFiles(files);
    }
    showToast('File deleted successfully', 'success');
    loadFiles();
  } catch (err) {
    showToast('Failed to delete file', 'error');
  }
}

function downloadFile(fileId) {
  const file = currentFiles.find(f => f.id === fileId);
  if (!file) return;

  if (isBackendAvailable && getAuthToken()) {
    window.location.href = `${API_BASE}/files/${fileId}/download?token=${getAuthToken()}`;
  } else {
    // Sandbox simulated download
    const blob = file.previewData && file.previewData.startsWith('data:') 
      ? null 
      : new Blob([file.previewData || `Mock content for ${file.originalFileName}`], { type: file.contentType });

    const link = document.createElement('a');
    link.href = file.previewData || URL.createObjectURL(blob);
    link.download = file.originalFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Downloading ${file.originalFileName}...`, 'info');
  }
}

function previewFile(fileId) {
  const file = currentFiles.find(f => f.id === fileId);
  if (!file) return;

  const modal = document.getElementById('preview-modal');
  const titleEl = document.getElementById('preview-modal-title');
  const bodyEl = document.getElementById('preview-modal-body');
  const downloadBtn = document.getElementById('preview-download-btn');

  if (titleEl) titleEl.innerText = file.originalFileName;
  if (downloadBtn) downloadBtn.onclick = () => downloadFile(fileId);

  const ext = getFileExtension(file.originalFileName);

  if (bodyEl) {
    if (isBackendAvailable && getAuthToken()) {
      const previewUrl = `${API_BASE}/files/${fileId}/preview?token=${getAuthToken()}`;
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        bodyEl.innerHTML = `<img src="${previewUrl}" alt="${file.originalFileName}" />`;
      } else if (ext === 'pdf') {
        bodyEl.innerHTML = `<iframe src="${previewUrl}" style="width:100%; height:500px; border:none; border-radius:8px;"></iframe>`;
      } else {
        bodyEl.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <div class="file-type-icon ext-${ext}" style="margin: 0 auto 1.5rem; width: 64px; height: 64px; font-size: 1rem;">${ext.toUpperCase()}</div>
            <h3>${file.originalFileName}</h3>
            <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">${formatBytes(file.size)} &bull; ${file.contentType}</p>
            <button class="btn btn-primary" onclick="downloadFile(${file.id})">⬇️ Download to View</button>
          </div>
        `;
      }
    } else {
      // Sandbox preview
      if (file.previewData && file.previewData.startsWith('data:image')) {
        bodyEl.innerHTML = `<img src="${file.previewData}" alt="${file.originalFileName}" />`;
      } else if (file.previewData) {
        bodyEl.innerHTML = `<pre class="preview-code-block"><code>${escapeHtml(file.previewData)}</code></pre>`;
      } else {
        bodyEl.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <div class="file-type-icon ext-${ext}" style="margin: 0 auto 1.5rem; width: 64px; height: 64px; font-size: 1rem;">${ext.toUpperCase()}</div>
            <h3>${file.originalFileName}</h3>
            <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">${formatBytes(file.size)} &bull; ${file.contentType}</p>
            <button class="btn btn-primary" onclick="downloadFile(${file.id})">⬇️ Download to View</button>
          </div>
        `;
      }
    }
  }

  openModal('preview-modal');
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================================================
// Sharing Links
// ==========================================================================
let currentSharingFileId = null;

async function openShareModal(fileId) {
  currentSharingFileId = fileId;
  const file = currentFiles.find(f => f.id === fileId);
  if (!file) return;

  const fileNameEl = document.getElementById('share-file-name');
  const inputEl = document.getElementById('share-link-input');
  const statusEl = document.getElementById('share-status-indicator');

  if (fileNameEl) fileNameEl.innerText = file.originalFileName;

  let shareUrl = '';
  if (isBackendAvailable && getAuthToken()) {
    try {
      const res = await fetch(`${API_BASE}/files/${fileId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      shareUrl = data.shareUrl;
    } catch (err) {
      shareUrl = `${window.location.origin}/share.html?file=${fileId}`;
    }
  } else {
    // Sandbox share link
    const token = file.shareToken || ('token-' + Math.random().toString(36).substring(2, 10));
    file.isPublic = true;
    file.shareToken = token;
    saveSandboxFiles(getSandboxFiles());
    shareUrl = `${window.location.origin}/api/files/share/${token}`;
  }

  if (inputEl) inputEl.value = shareUrl;
  if (statusEl) statusEl.innerHTML = `<span style="color:var(--success)">● Anyone with this link can view and download</span>`;

  openModal('share-modal');
}

function copyShareLink() {
  const inputEl = document.getElementById('share-link-input');
  if (inputEl) {
    inputEl.select();
    navigator.clipboard.writeText(inputEl.value).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      document.execCommand('copy');
      showToast('Link copied to clipboard!', 'success');
    });
  }
}

// ==========================================================================
// Modals Open / Close Helper
// ==========================================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('dashboard-search');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadFiles(e.target.value);
      }, 250);
    });
  }

  // Filter tabs in sidebar
  document.querySelectorAll('[data-filter]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('[data-filter]').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      currentFilter = item.getAttribute('data-filter');
      loadFiles();
    });
  });

  // View Mode Toggles
  const gridBtn = document.getElementById('view-grid-btn');
  const listBtn = document.getElementById('view-list-btn');

  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      currentView = 'grid';
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      renderFilesList(currentFiles);
    });
    listBtn.addEventListener('click', () => {
      currentView = 'list';
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      renderFilesList(currentFiles);
    });
  }

  // Drag and Drop Zone
  const dropzone = document.getElementById('modal-dropzone');
  const fileInput = document.getElementById('upload-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        queueFiles(Array.from(files));
      }
    });
  }

  // Backdrop click to close modals
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
      }
    });
  });
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});
