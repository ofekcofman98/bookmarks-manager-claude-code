/**
 * BookmarkDisplay
 * Renders bookmarks from localStorage grouped by category into a given root element.
 *
 * Usage:
 *   const display = new BookmarkDisplay('#grouped-display');
 *   display.render();
 */
class BookmarkDisplay {
  #root;

  constructor(selector) {
    this.#root = document.querySelector(selector);
    if (!this.#root) throw new Error(`BookmarkDisplay: "${selector}" not found`);
  }

  render() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

    if (bookmarks.length === 0) {
      this.#root.innerHTML = '<p class="bd-empty">No bookmarks yet.</p>';
      return;
    }

    // Group by category, preserving insertion order
    const groups = bookmarks.reduce((acc, b) => {
      const cat = b.category || 'General';
      (acc[cat] = acc[cat] || []).push(b);
      return acc;
    }, {});

    this.#root.innerHTML = Object.entries(groups).map(([cat, items]) => `
      <section class="bd-group">
        <h3 class="bd-category-heading">
          ${this.#icon(cat)} ${this.#esc(cat)}
          <span class="bd-count">${items.length}</span>
        </h3>
        <ul class="bd-list">
          ${items.map(b => `
            <li class="bd-item">
              <a href="${this.#safeUrl(b.url)}" target="_blank" rel="noopener noreferrer">
                <span class="bd-title">${this.#esc(b.title)}</span>
                <span class="bd-url">${this.#esc(b.url)}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </section>
    `).join('');
  }

  #esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  #safeUrl(s) {
    const t = String(s).trim();
    return /^https?:\/\//i.test(t) ? this.#esc(t) : '#';
  }

  #icon(cat) {
    return { Work: '💼', News: '📰', Entertainment: '🎬', Learning: '📚',
             Shopping: '🛒', Social: '💬', Tools: '🔧', General: '🔖' }[cat] ?? '🔖';
  }
}
