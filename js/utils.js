// =====================================================
// CEPA - Shared Utilities
// =====================================================

// ===== API HELPER =====
async function callAPI(action, params = {}) {
  try {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    const payload = { action, ...params };
    const encodedSize = JSON.stringify(payload).length;
    let requestUrl = url.toString();
    const requestOptions = { redirect: 'follow' };
    if (encodedSize > 1500 || params.data && String(params.data).length > 1000) {
      requestOptions.method = 'POST';
      requestOptions.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      requestOptions.body = JSON.stringify(payload);
    } else {
      url.searchParams.set('action', action);
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
      requestUrl = url.toString();
    }
    const res = await fetch(requestUrl, requestOptions);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error [' + action + ']:', err);
    return { success: false, message: 'Koneksi gagal. Periksa URL Apps Script di config.js.' };
  }
}

async function loadBranding() {
  const result = await callAPI('getSettings');
  if (result.success) applyBranding(result.data);
  return result.data || {};
}

function applyBranding(settings = {}) {
  const name = settings.appName || CONFIG.APP_NAME;
  const tagline = settings.tagline || CONFIG.APP_FULL_NAME;
  const company = settings.company || CONFIG.COMPANY;
  const footer = settings.footer || `© 2026 ${name} · ${company}`;
  const color = settings.primaryColor || '#2563eb';
  document.documentElement.style.setProperty('--brand-primary', color);
  let brandStyle = document.getElementById('brand-style');
  if (!brandStyle) { brandStyle = document.createElement('style'); brandStyle.id = 'brand-style'; document.head.appendChild(brandStyle); }
  brandStyle.textContent = `.btn-primary{background-color:${color}!important}.btn-primary:hover{filter:brightness(.92)}.nav-item.active,.nav-item.active:hover{background-color:${color}!important}.text-blue-600{color:${color}!important}.bg-blue-600{background-color:${color}!important}`;
  document.querySelectorAll('[data-brand-name]').forEach(el => { el.textContent = name; });
  document.querySelectorAll('[data-brand-tagline]').forEach(el => { el.textContent = tagline; });
  document.querySelectorAll('[data-brand-company]').forEach(el => { el.textContent = company; });
  document.querySelectorAll('[data-brand-footer]').forEach(el => { el.textContent = footer; });
  document.querySelectorAll('[data-brand-logo]').forEach(el => {
    if (settings.logoMode === 'image' && settings.logoData) {
      el.innerHTML = `<img src="${escHtml(settings.logoData)}" alt="${escHtml(name)}" class="w-full h-full object-contain rounded-lg">`;
    } else if (settings.logoMode === 'text') {
      el.textContent = (name || 'A').slice(0, 2).toUpperCase();
    } else {
      el.innerHTML = `<i class="fas ${escHtml(settings.logoIcon || 'fa-toolbox')}"></i>`;
    }
  });
  document.querySelectorAll('title[data-brand-title]').forEach(el => { el.textContent = `${el.dataset.brandTitle} — ${name}`; });
}

// ===== AUTH HELPERS =====
const Auth = {
  getUser() {
    const u = localStorage.getItem('cepa_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    localStorage.setItem('cepa_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('cepa_user');
    window.location.href = 'index.html';
  },
  requireAuth(role) {
    const user = this.getUser();
    if (!user) { window.location.href = 'index.html'; return null; }
    const roleAllowed = role === 'pengguna'
      ? user.role === 'pengguna' || user.role === 'user'
      : !role || user.role === role;
    if (!roleAllowed) {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
      return null;
    }
    return user;
  }
};

// ===== HTML ESCAPE (XSS prevention) =====
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ===== DATE HELPERS =====
function formatDateForSheet(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getDateAfterDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function getCurrentDateIndo() {
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ===== STATUS BADGE HTML =====
function statusBadge(status) {
  const map = {
    'Menunggu': `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Menunggu</span>`,
    'Disetujui': `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Disetujui</span>`,
    'Ditolak': `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Ditolak</span>`,
    'Dikembalikan': `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Dikembalikan</span>`
  };
  return map[status] || `<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">${escHtml(status)}</span>`;
}

function kondisiBadge(kondisi) {
  const map = {
    'Baik': `<span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">Baik</span>`,
    'Rusak': `<span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">Rusak</span>`,
    'Sedang Diperbaiki': `<span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Perbaikan</span>`
  };
  return map[kondisi] || `<span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">${escHtml(kondisi)}</span>`;
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error:   'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info:    'bg-blue-50 border-blue-200 text-blue-900'
  };
  const icons = {
    success: 'fa-check-circle text-emerald-500',
    error:   'fa-times-circle text-red-500',
    warning: 'fa-exclamation-triangle text-amber-500',
    info:    'fa-info-circle text-blue-500'
  };
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${styles[type]} translate-x-full transition-transform duration-300`;
  toast.innerHTML = `<i class="fas ${icons[type]} mt-0.5 flex-shrink-0"></i><span class="text-sm font-medium flex-1 leading-relaxed">${escHtml(message)}</span><button onclick="this.closest('[class*=translate]').remove()" class="opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5"><i class="fas fa-times text-xs"></i></button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.classList.remove('translate-x-full'); toast.classList.add('translate-x-0'); });
  setTimeout(() => { toast.classList.add('translate-x-full'); setTimeout(() => toast.remove(), 300); }, 5000);
}

// ===== LOADING OVERLAY =====
function showLoading(msg = 'Memproses...') {
  let el = document.getElementById('loading-overlay');
  if (el) { el.querySelector('span').textContent = msg; el.classList.remove('hidden'); return; }
  el = document.createElement('div');
  el.id = 'loading-overlay';
  el.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990] flex items-center justify-center';
  el.innerHTML = `<div class="bg-white rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-4"><div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div><span class="text-gray-700 font-medium">${escHtml(msg)}</span></div>`;
  document.body.appendChild(el);
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}

// ===== MODAL HELPERS =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
}
