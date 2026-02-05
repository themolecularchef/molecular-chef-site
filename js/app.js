/**
 * Lezzet Yolculuğu - Main App
 * Core functionality and utilities
 */

// ============================================
// THEME MANAGEMENT
// ============================================

const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        this.bindEvents();
    },

    bindEvents() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    }
};

// ============================================
// MOBILE NAVIGATION
// ============================================

const MobileNav = {
    init() {
        this.toggle = document.getElementById('navMobileToggle');
        this.menu = document.getElementById('mobileMenu');

        if (this.toggle && this.menu) {
            this.bindEvents();
        }
    },

    bindEvents() {
        this.toggle.addEventListener('click', () => this.toggleMenu());

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                this.close();
            }
        });
    },

    toggleMenu() {
        this.menu.classList.toggle('active');
        this.toggle.classList.toggle('active');
    },

    close() {
        this.menu.classList.remove('active');
        this.toggle.classList.remove('active');
    }
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const Toast = {
    show(message, type = 'default', duration = 3000) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.className = 'toast active' + (type ? ' ' + type : '');

        setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    }
};

// ============================================
// MODAL MANAGEMENT
// ============================================

const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Bind close events
            const closeBtn = modal.querySelector('.modal-close');
            const backdrop = modal.querySelector('.modal-backdrop');

            if (closeBtn) {
                closeBtn.onclick = () => this.close(modalId);
            }
            if (backdrop) {
                backdrop.onclick = () => this.close(modalId);
            }
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Simple encoding for passwords (not secure, just obfuscation)
    encode(str) {
        return btoa(str);
    },

    decode(str) {
        return atob(str);
    },

    // Format time
    formatTime(minutes) {
        if (minutes < 60) return `${minutes} dk`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get URL parameter
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Share URL
    getShareUrl(recipeId) {
        return `${window.location.origin}/recipe.html?id=${recipeId}`;
    }
};

// ============================================
// LAZY LOADING IMAGES
// ============================================

const LazyLoader = {
    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileNav.init();
    LazyLoader.init();
});

// Export for other modules
window.ThemeManager = ThemeManager;
window.MobileNav = MobileNav;
window.Toast = Toast;
window.Modal = Modal;
window.Utils = Utils;
window.LazyLoader = LazyLoader;
// ARAMA FONKSİYONU
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('heroSearchInput');
    const searchBtn = document.getElementById('heroSearchBtn');
    
    if (!searchInput) return;

    // Enter tuşu ile arama
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Buton ile arama
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }

    // Anlık arama (yazarken filtrele)
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
});

// Arama fonksiyonu
function performSearch(query) {
    const recipesGrid = document.getElementById('recipesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!window.recipesData || !recipesGrid) return;

    const searchTerm = query.toLowerCase().trim();
    
    // Tüm tarifleri filtrele
    const filtered = window.recipesData.filter(recipe => {
        const title = recipe.title?.toLowerCase() || '';
        const category = recipe.category?.toLowerCase() || '';
        const description = recipe.description?.toLowerCase() || '';
        const ingredients = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients.join(' ').toLowerCase() 
            : '';
        
        return title.includes(searchTerm) || 
               category.includes(searchTerm) || 
               description.includes(searchTerm) ||
               ingredients.includes(searchTerm);
    });

    // Sonuçları göster
    if (filtered.length === 0) {
        recipesGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        renderRecipes(filtered);
    }
}

// Tarifleri render et (Eğer bu fonksiyon yoksa)
function renderRecipes(recipes) {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;
    
    grid.innerHTML = recipes.map(recipe => `
        <article class="recipe-card" data-id="${recipe.id}">
            <div class="card-image">
                <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                <button class="favorite-btn" data-id="${recipe.id}" onclick="openAddToListModal('${recipe.id}', '${recipe.title}')">
                    <span>🤍</span>
                </button>
            </div>
            <div class="card-content">
                <span class="card-category">${recipe.category}</span>
                <h3 class="card-title">
                    <a href="recipe.html?id=${recipe.id}">${recipe.title}</a>
                </h3>
                <div class="card-meta">
                    <span>⏱️ ${recipe.prepTime || '20 dk'}</span>
                    <span>🔥 ${recipe.difficulty || 'Orta'}</span>
                </div>
            </div>
        </article>
    `).join('');
}
