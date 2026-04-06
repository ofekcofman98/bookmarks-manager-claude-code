const STORAGE_KEY = 'bookmarks';

// ── Storage helpers ────────────────────────────────────────────────────────
function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function save(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const form       = document.getElementById('bookmark-form');
const titleInput = document.getElementById('title');
const urlInput   = document.getElementById('url');
const catInput   = document.getElementById('category');
const listEl     = document.getElementById('bookmark-list');
const filterBar  = document.getElementById('filter-bar');

// ── State ──────────────────────────────────────────────────────────────────
let activeFilter = 'All';

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const bookmarks = load();
  const filtered  = activeFilter === 'All'
    ? bookmarks
    : bookmarks.filter(b => b.category === activeFilter);

  // Filter buttons
  const categories = ['All', ...new Set(bookmarks.map(b => b.category))];
  filterBar.innerHTML = categories.map(cat => `
    <button data-filter="${cat}" class="${cat === activeFilter ? 'active' : ''}">${cat}</button>
  `).join('');

  filterBar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // Bookmark cards
  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="empty">No bookmarks yet — add one above.</p>';
    return;
  }

  listEl.innerHTML = filtered.map(b => `
    <div class="bookmark-card" data-id="${b.id}">
      <div class="info">
        <div class="title" title="${escHtml(b.title)}">${escHtml(b.title)}</div>
        <a href="${escAttr(b.url)}" target="_blank" rel="noopener noreferrer">${escHtml(b.url)}</a>
      </div>
      <span class="badge">${escHtml(b.category)}</span>
      <button class="delete-btn" data-id="${b.id}" title="Delete">&#x2715;</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteBookmark(btn.dataset.id));
  });
}

// ── Add ────────────────────────────────────────────────────────────────────
form.addEventListener('submit', e => {
  e.preventDefault();

  const bookmark = {
    id:       crypto.randomUUID(),
    title:    titleInput.value.trim(),
    url:      urlInput.value.trim(),
    category: catInput.value,
    addedAt:  Date.now(),
  };

  const bookmarks = load();
  bookmarks.unshift(bookmark);
  save(bookmarks);

  form.reset();
  render();
});

// ── Delete ─────────────────────────────────────────────────────────────────
function deleteBookmark(id) {
  const bookmarks = load().filter(b => b.id !== id);
  save(bookmarks);
  render();
}

// ── Escape helpers (prevent XSS) ───────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  // Only allow http/https URLs to prevent javascript: URIs
  const trimmed = String(str).trim();
  if (!/^https?:\/\//i.test(trimmed)) return '#';
  return escHtml(trimmed);
}

// ── Init ───────────────────────────────────────────────────────────────────
render();
