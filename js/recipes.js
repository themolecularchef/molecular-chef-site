/**
 * Lezzet Yolculuğu - Recipes Module
 * Tarif verilerini yöneten ve görüntüleyen modül
 */

const Recipes = {
    data: null,
    currentRecipe: null,
    servingsMultiplier: 1,
    originalServings: 4,
    originalIngredients: [],

    init() {
        this.loadRecipes().then(() => {
            this.renderRecipesGrid();
            this.bindFilterEvents();
        }).catch(err => {
            console.error('Tarifler yüklenirken hata:', err);
            if (window.Toast) {
                Toast.show('Tarifler yüklenemedi', 'error');
            }
        });
    },

    async loadRecipes() {
        try {
            const response = await fetch('content/recipes.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.data = data.recipes || [];
            window.recipesData = this.data;
            return this.data;
        } catch (error) {
            console.error('Tarifler yüklenemedi:', error);
            this.data = [];
            window.recipesData = [];
            throw error; // Hatayı yukarı ilet
        }
    },

    async loadRecipeContent(contentFile) {
        try {
            if (!contentFile) {
                throw new Error('Content file belirtilmemiş');
            }
            
            const response = await fetch(contentFile);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const markdown = await response.text();
            
            // marked kütüphanesi yüklü mü kontrol et
            if (typeof marked === 'undefined') {
                throw new Error('Marked kütüphanesi yüklenmemiş');
            }
            
            return marked.parse(markdown);
        } catch (error) {
            console.error('Tarif içeriği yüklenemedi:', error);
            return '<p class="error-message">Tarif içeriği yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        }
    },

    getRecipeById(id) {
        if (!this.data || !Array.isArray(this.data)) {
            return null;
        }
        return this.data.find(r => r.id.toString() === id.toString()) || null;
    },

    async renderRecipesGrid(recipes = null) {
        const grid = document.getElementById('recipesGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;
        
        const recipesToRender = recipes || this.data;
        
        if (!recipesToRender || recipesToRender.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        grid.innerHTML = recipesToRender.map(recipe => `
            <article class="recipe-card" data-id="${recipe.id}">
                <div class="recipe-card-image">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                    <div class="recipe-card-overlay"></div>
                    <div class="recipe-card-actions">
                        <button class="recipe-card-action favorite-btn" 
                                data-id="${recipe.id}" 
                                data-title="${recipe.title}"
                                onclick="handleFavoriteClick(event, '${recipe.id}', '${recipe.title}')">
                            <span>🤍</span>
                        </button>
                        <button class="recipe-card-action quick-view-btn" 
                                data-id="${recipe.id}">
                            <span>👁️</span>
                        </button>
                    </div>
                </div>
                <div class="recipe-card-content">
                    <span class="recipe-card-category">${recipe.category}</span>
                    <h3 class="recipe-card-title">
                        <a href="recipe.html?id=${recipe.id}">${recipe.title}</a>
                    </h3>
                    <div class="recipe-card-meta">
                        <span>⏱️ ${recipe.prepTime}</span>
                        <span>🔥 ${recipe.cookTime}</span>
                        <span>📊 ${recipe.difficulty}</span>
                    </div>
                </div>
            </article>
        `).join('');
        
        this.bindCardEvents();
    },

    bindCardEvents() {
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showQuickView(btn.dataset.id);
            });
        });
    },

    bindFilterEvents() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                if (filter === 'all') {
                    this.renderRecipesGrid(this.data);
                } else {
                    const filtered = this.data.filter(r => r.category === filter);
                    this.renderRecipesGrid(filtered);
                }
            });
        });
    },

    async showQuickView(recipeId) {
        const recipe = this.getRecipeById(recipeId);
        if (!recipe) {
            if (window.Toast) Toast.show('Tarif bulunamadı', 'error');
            return;
        }
        
        const modalBody = document.getElementById('quickViewBody');
        if (!modalBody) return;
        
        modalBody.innerHTML = `
            <div class="quick-view">
                <img src="${recipe.image}" alt="${recipe.title}">
                <div class="quick-view-content">
                    <span>${recipe.category}</span>
                    <h2>${recipe.title}</h2>
                    <p>${recipe.description}</p>
                    <a href="recipe.html?id=${recipe.id}" class="btn btn-primary">Tarifi Görüntüle</a>
                </div>
            </div>
        `;
        
        if (window.Modal) {
            Modal.open('quickViewModal');
        }
    }
};

// Global fonksiyon - Favori butonu için güvenli wrapper
window.handleFavoriteClick = function(event, recipeId, recipeTitle) {
    event.stopPropagation();
    
    // openAddToListModal fonksiyonu global olarak tanımlı mı kontrol et
    if (typeof window.openAddToListModal === 'function') {
        window.openAddToListModal(recipeId, recipeTitle);
    } else {
        // Fonksiyon yoksa kullanıcıya bilgi ver
        if (window.Toast) {
            Toast.show('Bu özellik ana sayfada kullanılabilir', 'info');
        } else {
            alert('Lütfen tarifi favorilere eklemek için ana sayfaya gidin');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Recipes.init();
});

window.Recipes = Recipes;
