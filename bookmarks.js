const STORAGE_KEY = 'bookmarks';
const CATEGORIES   = ['General','Work','News','Entertainment','Learning','Shopping','Social','Tools'];

// ── Storage helpers ────────────────────────────────────────────────────────
function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function save(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const form        = document.getElementById('bookmark-form');
const titleInput  = document.getElementById('title');
const urlInput    = document.getElementById('url');
const catInput    = document.getElementById('category');
const listEl      = document.getElementById('bookmark-list');
const filterBar   = document.getElementById('filter-bar');
const searchInput = document.getElementById('search-input');

// ── State ──────────────────────────────────────────────────────────────────
let activeFilter = 'All';
let searchQuery  = '';

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const bookmarks = load();
  const query = searchQuery.toLowerCase();

  const filtered = bookmarks.filter(b => {
    if (activeFilter !== 'All' && b.category !== activeFilter) return false;
    if (!query) return true;
    return (
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query)
    );
  });

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
    listEl.innerHTML = query
      ? '<p class="empty">No bookmarks match your search.</p>'
      : '<p class="empty">No bookmarks yet — add one above.</p>';
    return;
  }

  listEl.innerHTML = filtered.map(b => `
    <div class="bookmark-card" data-id="${b.id}">
      <div class="info">
        <div class="title" title="${escHtml(b.title)}">${escHtml(b.title)}</div>
        <a href="${escAttr(b.url)}" target="_blank" rel="noopener noreferrer">${escHtml(b.url)}</a>
      </div>
      <span class="badge">${escHtml(b.category)}</span>
      <button class="edit-btn"   data-id="${b.id}" title="Edit">&#x270E;</button>
      <button class="delete-btn" data-id="${b.id}" title="Delete">&#x2715;</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteBookmark(btn.dataset.id));
  });

  listEl.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
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
  display.render();
});

// ── Edit ───────────────────────────────────────────────────────────────────
function startEdit(id) {
  const b    = load().find(b => b.id === id);
  if (!b) return;

  const card = listEl.querySelector(`.bookmark-card[data-id="${id}"]`);
  card.classList.add('editing');

  const categoryOptions = CATEGORIES.map(cat =>
    `<option value="${cat}"${cat === b.category ? ' selected' : ''}>${cat}</option>`
  ).join('');

  card.innerHTML = `
    <div class="edit-fields">
      <input class="edit-title" type="text"  value="${escHtml(b.title)}" placeholder="Title" required />
      <input class="edit-url"   type="url"   value="${escHtml(b.url)}"   placeholder="https://example.com" required />
      <select class="edit-cat">${categoryOptions}</select>
    </div>
    <div class="edit-actions">
      <button class="save-btn"   data-id="${id}">Save</button>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;

  card.querySelector('.save-btn').addEventListener('click', () => saveEdit(id, card));
  card.querySelector('.cancel-btn').addEventListener('click', () => render());
}

function saveEdit(id, card) {
  const title    = card.querySelector('.edit-title').value.trim();
  const url      = card.querySelector('.edit-url').value.trim();
  const category = card.querySelector('.edit-cat').value;

  if (!title || !url) return;

  const bookmarks = load().map(b =>
    b.id === id ? { ...b, title, url, category } : b
  );
  save(bookmarks);
  render();
  display.render();
}

// ── Delete ─────────────────────────────────────────────────────────────────
function deleteBookmark(id) {
  const bookmarks = load().filter(b => b.id !== id);
  save(bookmarks);
  render();
  display.render();
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

// ── Search ─────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  render();
});

// ── Grouped display ────────────────────────────────────────────────────────
const display = new BookmarkDisplay('#grouped-display');

// ── Init ───────────────────────────────────────────────────────────────────
render();
display.render();
