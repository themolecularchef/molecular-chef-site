/**
 * Lezzet Yolculuğu - Recipes Module
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
        });

        if (document.querySelector('.recipe-hero')) {
            this.loadRecipeDetail();
        }
    },

    async loadRecipes() {
        try {
            const response = await fetch('content/recipes.json');
            const data = await response.json();
            this.data = data.recipes || [];
            window.recipesData = this.data;
            return this.data;
        } catch (error) {
            console.error('Tarifler yüklenemedi:', error);
            this.data = [];
            window.recipesData = [];
        }
    },

    async loadRecipeContent(contentFile) {
        try {
            const response = await fetch(contentFile);
            const markdown = await response.text();
            return marked.parse(markdown);
        } catch (error) {
            return '<p>Tarif içeriği yüklenemedi.</p>';
        }
    },

    getRecipeById(id) {
        return this.data ? this.data.find(r => r.id.toString() === id.toString()) : null;
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
                                onclick="openAddToListModal('${recipe.id}', '${recipe.title}')">
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
        if (!recipe) return;
        
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
        
        Modal.open('quickViewModal');
    },

    async loadRecipeDetail() {
        const recipeId = new URLSearchParams(window.location.search).get('id');
        if (!recipeId) return;
        
        if (!this.data) await this.loadRecipes();
        
        const recipe = this.getRecipeById(recipeId);
        if (!recipe) {
            Toast.show('Tarif bulunamadı', 'error');
            return;
        }
        
        this.currentRecipe = recipe;
        document.title = `${recipe.title} | Lezzet Yolculuğu`;
        
        document.getElementById('recipeHeroImage').src = recipe.image;
        document.getElementById('recipeCategory').textContent = recipe.category;
        document.getElementById('recipeTitle').textContent = recipe.title;
        document.getElementById('recipePrepTime').textContent = recipe.prepTime;
        document.getElementById('recipeCookTime').textContent = recipe.cookTime;
        document.getElementById('recipeServings').textContent = recipe.servings + ' kişilik';
        document.getElementById('recipeDifficulty').textContent = recipe.difficulty;
        
        const contentHtml = await this.loadRecipeContent(recipe.contentFile);
        document.getElementById('instructionsContent').innerHTML = contentHtml;
        this.renderIngredients(recipe, html);
        this.bindButtons();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Recipes.init();
    renderIngredients(recipe, html) {
        const list = document.getElementById('ingredientsList');
        const count = document.getElementById('servingsCount');
        if (count) count.textContent = recipe.servings || 4;
        
        let items = recipe.ingredients;
        if (!items && html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const h2 = temp.querySelector('h2');
            if (h2 && h2.textContent.includes('Malzemeler')) {
                const ul = h2.nextElementSibling;
                if (ul) items = Array.from(ul.querySelectorAll('li')).map(li => li.textContent);
            }
        }
        
        if (items && list) {
            this.originalIngredients = items;
            list.innerHTML = items.map(text => `
                <div class="ingredient-item">
                    <div class="ingredient-checkbox" onclick="this.classList.toggle('checked'); this.nextElementSibling.classList.toggle('checked')"></div>
                    <span class="ingredient-text">${text}</span>
                </div>
            `).join('');
        }
    },

    bindButtons() {
        document.getElementById('increaseServings')?.addEventListener('click', () => {
            this.servingsMultiplier = Math.min(this.servingsMultiplier + 0.5, 3);
            this.updateServings();
        });
        document.getElementById('decreaseServings')?.addEventListener('click', () => {
            this.servingsMultiplier = Math.max(this.servingsMultiplier - 0.5, 0.5);
            this.updateServings();
        });
    },

    updateServings() {
        document.getElementById('servingsCount').textContent = Math.round(this.originalServings * this.servingsMultiplier * 10) / 10 + ' kişilik';
        document.querySelectorAll('.ingredient-text').forEach((el, i) => {
            const orig = this.originalIngredients[i];
            if (orig) el.textContent = orig.replace(/(\d+)/g, n => Math.round(parseInt(n) * this.servingsMultiplier * 10) / 10);
        });
    },
});

window.Recipes = Recipes;
