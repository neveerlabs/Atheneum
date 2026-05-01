let libraryData = [];
let currentPage = 'library';
let currentBookId = null;
let currentContentPage = 0;
let bookmarks = [];
let activeCategory = 'semua';
let searchQuery = '';
let lastScrollY = 0;
let headerWrapper, pageLibrary, pageReader, pageBookmarks, booksGrid, noResults;
let searchInput, clearSearchBtn, categoryScroll, bookmarkBadge, bookmarksList, noBookmarks;
let readerTitle, readerChapter, readerText, readerProgressFill, readerPageInfo, readerPercent;
let btnPrevPage, btnNextPage, readerBookmarkBtn, toast;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

function getCoverGradient(colors) {
  return `linear-gradient(145deg, ${colors[0]} 0%, ${colors[1]} 40%, ${colors[2]} 100%)`;
}

function updateBookmarkBadge() {
  if (bookmarks.length > 0) bookmarkBadge.style.display = 'block';
  else bookmarkBadge.style.display = 'none';
}

function renderCategoryChips() {
  const categories = ['semua', ...new Set(libraryData.map(book => book.category))];
  categoryScroll.innerHTML = categories.map(cat => `
    <span class="category-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}" onclick="filterCategory('${cat}', this)">
      ${cat === 'semua' ? 'Semua' : cat.charAt(0).toUpperCase() + cat.slice(1)}
    </span>
  `).join('');
}

function renderBooks() {
  if (!libraryData.length) return;
  let filtered = libraryData;
  if (activeCategory !== 'semua') filtered = filtered.filter(b => b.category === activeCategory);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    booksGrid.innerHTML = '';
    noResults.style.display = 'flex';
  } else {
    noResults.style.display = 'none';
    booksGrid.innerHTML = filtered.map(book => {
      const isBookmarked = bookmarks.some(bm => bm.bookId === book.id);
      return `
        <div class="book-card" onclick="openBook(${book.id})">
          <div class="book-cover">
            <img class="book-cover-img" src="${book.coverImage || 'https://picsum.photos/id/100/300/400'}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="book-cover-gradient" style="background:${getCoverGradient(book.coverColors)}; display:${book.coverImage ? 'none' : 'block'}"></div>
            <div class="book-cover-overlay"></div>
            <div class="book-cover-title">${book.title}</div>
            <div class="book-card-bookmark ${isBookmarked ? 'saved' : ''}" onclick="event.stopPropagation(); toggleBookmark(${book.id}, this)">
              <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </div>
          </div>
          <div class="book-card-info">
            <div class="book-card-title">${book.title}</div>
            <div class="book-card-author">${book.author}</div>
            <div class="book-card-meta">
              <span>${book.pages} halaman</span>
              <span class="book-card-rating">★ ${book.rating}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderBookmarks() {
  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = '';
    noBookmarks.style.display = 'flex';
  } else {
    noBookmarks.style.display = 'none';
    bookmarksList.innerHTML = bookmarks.map(bm => {
      const book = libraryData.find(b => b.id === bm.bookId);
      if (!book) return '';
      return `
        <div class="bookmark-item" onclick="openBook(${book.id})">
          <div class="bookmark-thumb" style="background-image: url('${book.coverImage || 'https://picsum.photos/id/100/80/100'}'); background-size: cover;"></div>
          <div class="bookmark-info">
            <div class="bookmark-book-title">${book.title}</div>
            <div class="bookmark-detail">${book.author} · ${book.pages} halaman</div>
          </div>
          <button class="bookmark-remove" onclick="event.stopPropagation(); removeBookmark(${book.id})">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    }).join('');
  }
}

function toggleBookmark(bookId, element) {
  const index = bookmarks.findIndex(bm => bm.bookId === bookId);
  if (index >= 0) {
    bookmarks.splice(index, 1);
    if (element) element.classList.remove('saved');
    showToast('Bookmark dihapus');
  } else {
    bookmarks.push({ bookId, savedAt: Date.now() });
    if (element) element.classList.add('saved');
    showToast('Bookmark disimpan');
  }
  updateBookmarkBadge();
  if (currentPage === 'bookmarks') renderBookmarks();
  renderBooks();
}

function removeBookmark(bookId) {
  const index = bookmarks.findIndex(bm => bm.bookId === bookId);
  if (index >= 0) {
    bookmarks.splice(index, 1);
    renderBookmarks();
    updateBookmarkBadge();
    renderBooks();
    showToast('Bookmark dihapus');
  }
}

function openBook(id) {
  const book = libraryData.find(b => b.id === id);
  if (!book) return;
  currentBookId = id;
  currentContentPage = 0;
  readerTitle.textContent = book.title;
  readerChapter.textContent = 'Halaman 1';
  pageLibrary.classList.remove('active');
  pageBookmarks.classList.remove('active');
  pageReader.classList.add('active');
  currentPage = 'reader';
  updateReaderContent();
  updateReaderUI();
  const isBookmarked = bookmarks.some(bm => bm.bookId === id);
  const svg = readerBookmarkBtn.querySelector('svg');
  if (isBookmarked) {
    svg.setAttribute('fill', 'var(--accent-primary)');
    svg.setAttribute('stroke', 'var(--accent-primary)');
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
  }
  window.scrollTo(0, 0);
}

function closeReader() {
  pageReader.classList.remove('active');
  pageLibrary.classList.add('active');
  currentPage = 'library';
  currentBookId = null;
  renderBooks();
  window.scrollTo(0, 0);
}

function updateReaderContent() {
  const book = libraryData.find(b => b.id === currentBookId);
  if (!book) return;
  const content = book.content;
  if (currentContentPage < content.length) {
    let text = content[currentContentPage];
    if (currentContentPage === 0) {
      text = text.replace(/^(\w)/, '<span class="dropcap">$1</span>');
    }
    readerText.innerHTML = `<p>${text}</p>`;
  } else {
    readerText.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);">— Tamat —</p>';
  }
  document.getElementById('readerContent').scrollTop = 0;
  readerChapter.textContent = `Halaman ${currentContentPage + 1} dari ${content.length}`;
  updateReaderUI();
}

function updateReaderUI() {
  const book = libraryData.find(b => b.id === currentBookId);
  if (!book) return;
  const total = book.content.length;
  const percent = Math.round(((currentContentPage + 1) / total) * 100);
  readerProgressFill.style.width = percent + '%';
  readerPageInfo.textContent = `Halaman ${currentContentPage + 1} dari ${total}`;
  readerPercent.textContent = percent + '%';
  btnPrevPage.disabled = currentContentPage === 0;
  btnNextPage.disabled = currentContentPage >= total - 1;
  btnNextPage.textContent = currentContentPage >= total - 1 ? 'Selesai ✓' : 'Selanjutnya →';
}

function prevPage() {
  if (currentContentPage > 0) {
    currentContentPage--;
    updateReaderContent();
  }
}

function nextPage() {
  const book = libraryData.find(b => b.id === currentBookId);
  if (book && currentContentPage < book.content.length - 1) {
    currentContentPage++;
    updateReaderContent();
  }
}

function toggleReaderBookmark() {
  if (!currentBookId) return;
  const index = bookmarks.findIndex(bm => bm.bookId === currentBookId);
  const svg = readerBookmarkBtn.querySelector('svg');
  if (index >= 0) {
    bookmarks.splice(index, 1);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    showToast('Bookmark dihapus');
  } else {
    bookmarks.push({ bookId: currentBookId, savedAt: Date.now() });
    svg.setAttribute('fill', 'var(--accent-primary)');
    svg.setAttribute('stroke', 'var(--accent-primary)');
    showToast('Bookmark disimpan');
  }
  updateBookmarkBadge();
  renderBooks();
}

function navigateTo(page) {
  pageLibrary.classList.remove('active');
  pageReader.classList.remove('active');
  pageBookmarks.classList.remove('active');
  if (page === 'library') {
    pageLibrary.classList.add('active');
    currentPage = 'library';
    renderBooks();
  } else if (page === 'bookmarks') {
    pageBookmarks.classList.add('active');
    currentPage = 'bookmarks';
    renderBookmarks();
  }
  window.scrollTo(0, 0);
}

function filterCategory(category, element) {
  activeCategory = category;
  document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
  if (element) element.classList.add('active');
  renderBooks();
}

function handleSearch(value) {
  searchQuery = value;
  if (value.trim()) clearSearchBtn.classList.add('visible');
  else clearSearchBtn.classList.remove('visible');
  renderBooks();
}

function clearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.remove('visible');
  renderBooks();
}

function handleScroll() {
  if (currentPage !== 'library') return;
  const currentScrollY = window.scrollY;
  if (currentScrollY > lastScrollY && currentScrollY > 80) {
    headerWrapper.classList.add('hidden');
  } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
    headerWrapper.classList.remove('hidden');
  }
  lastScrollY = currentScrollY;
}

async function loadData() {
  try {
    const response = await fetch('data.json');
    libraryData = await response.json();
    renderCategoryChips();
    renderBooks();
    updateBookmarkBadge();
  } catch (err) {
    console.error('Gagal memuat data.json:', err);
    showToast('Gagal memuat data buku');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  headerWrapper = document.querySelector('.header-wrapper');
  pageLibrary = document.getElementById('pageLibrary');
  pageReader = document.getElementById('pageReader');
  pageBookmarks = document.getElementById('pageBookmarks');
  booksGrid = document.getElementById('booksGrid');
  noResults = document.getElementById('noResults');
  searchInput = document.getElementById('searchInput');
  clearSearchBtn = document.getElementById('clearSearch');
  categoryScroll = document.getElementById('categoryScroll');
  bookmarkBadge = document.getElementById('bookmarkBadge');
  bookmarksList = document.getElementById('bookmarksList');
  noBookmarks = document.getElementById('noBookmarks');
  readerTitle = document.getElementById('readerTitle');
  readerChapter = document.getElementById('readerChapter');
  readerText = document.getElementById('readerText');
  readerProgressFill = document.getElementById('readerProgressFill');
  readerPageInfo = document.getElementById('readerPageInfo');
  readerPercent = document.getElementById('readerPercent');
  btnPrevPage = document.getElementById('btnPrevPage');
  btnNextPage = document.getElementById('btnNextPage');
  readerBookmarkBtn = document.getElementById('readerBookmarkBtn');
  toast = document.getElementById('toast');

  window.addEventListener('scroll', handleScroll);
  loadData();
});

document.addEventListener('keydown', (e) => {
  if (currentPage === 'reader' && currentBookId) {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  }
});

let touchStart = 0;
document.addEventListener('touchstart', (e) => {
  touchStart = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (currentPage !== 'reader' || !currentBookId) return;
  const diff = touchStart - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 60) {
    diff > 0 ? nextPage() : prevPage();
  }
});
