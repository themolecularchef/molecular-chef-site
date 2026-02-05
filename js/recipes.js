/**
 * Lezzet Yolculuğu - Recipes Module
 * Recipe loading, display, and search functionality
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
            console.error('Error loading recipe content:', error);
            return '<p>Tarif içeriği yüklenemedi.</p>';
        }
    },

    getRecipeById(id) {
        return this.data ? this.data.find(r => r.id.toString() === id.toString()) : null;
    },

    // ============================================
    // RECIPE GRID
    // ============================================

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

        grid.innerHTML = recipesToRender.map(recipe => this.createRecipeCard(recipe)).join('');
        this.bindCardEvents();
    },

    createRecipeCard(recipe) {
        return `
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
                        <span class="recipe-card-meta-item">
                            <span>⏱️</span> ${recipe.prepTime}
                        </span>
                        <span class="recipe-card-meta-item">
                            <span>🔥</span> ${recipe.cookTime}
                        </span>
                        <span class="recipe-card-meta-item">
                            <span>📊</span> ${recipe.difficulty}
                        </span>
                    </div>
                </div>
            </article>
        `;
    },

    bindCardEvents() {
        // Quick view butonları
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const recipeId = btn.dataset.id;
                this.showQuickView(recipeId);
            });
        });
    },

    bindFilterEvents() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
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
                <img src="${recipe.image}" alt="${recipe.title}" class="quick-view-image">
                <div class="quick-view-content">
                    <span class="quick-view-category">${recipe.category}</span>
                    <h2 class="quick-view-title">${recipe.title}</h2>
                    <p class="quick-view-description">${recipe.description}</p>
                    <div class="quick-view-meta">
                        <div class="quick-view-meta-item">
                            <span class="quick-view-meta-icon">⏱️</span>
                            <div>
                                <span class="quick-view-meta-label">Hazırlık</span>
                                <span class="quick-view-meta-value">${recipe.prepTime}</span>
                            </div>
                        </div>
                        <div class="quick-view-meta-item">
                            <span class="quick-view-meta-icon">🔥</span>
                            <div>
                                <span class="quick-view-meta-label">Pişirme</span>
                                <span class="quick-view-meta-value">${recipe.cookTime}</span>
                            </div>
                        </div>
                        <div class="quick-view-meta-item">
                            <span class="quick-view-meta-icon">🍽️</span>
                            <div>
                                <span class="quick-view-meta-label">Kişi</span>
                                <span class="quick-view-meta-value">${recipe.servings}</span>
                            </div>
                        </div>
                        <div class="quick-view-meta-item">
                            <span class="quick-view-meta-icon">📊</span>
                            <div>
                                <span class="quick-view-meta-label">Zorluk</span>
                                <span class="quick-view-meta-value">${recipe.difficulty}</span>
                            </div>
                        </div>
                    </div>
                    <a href="recipe.html?id=${recipe.id}" class="btn btn-primary btn-full">Tarifi Görüntüle</a>
                </div>
            </div>
        `;

        Modal.open('quickViewModal');
    },

    // ============================================
    // RECIPE DETAIL PAGE
    // ============================================

    async loadRecipeDetail() {
        const recipeId = new URLSearchParams(window.location.search).get('id');

        if (!recipeId) {
            Toast.show('Tarif bulunamadı', 'error');
            return;
        }

        if (!this.data) {
            await this.loadRecipes();
        }

        const recipe = this.getRecipeById(recipeId);

        if (!recipe) {
            Toast.show('Tarif bulunamadı', 'error');
            return;
        }

        this.currentRecipe = recipe;
        this.servingsMultiplier = 1;
        this.originalServings = recipe.servings;

        document.title = `${recipe.title} | Lezzet Yolculuğu`;
        
        this.renderRecipeHero(recipe);
        
        const contentHtml = await this.loadRecipeContent(recipe.contentFile);
        this.renderInstructions(contentHtml);
    },

    renderRecipeHero(recipe) {
        const heroImage = document.getElementById('recipeHeroImage');
        const category = document.getElementById('recipeCategory');
        const title = document.getElementById('recipeTitle');
        const prepTime = document.getElementById('recipePrepTime');
        const cookTime = document.getElementById('recipeCookTime');
        const servings = document.getElementById('recipeServings');
        const difficulty = document.getElementById('recipeDifficulty');

        if (heroImage) heroImage.src = recipe.image;
        if (heroImage) heroImage.alt = recipe.title;
        if (category) category.textContent = recipe.category;
        if (title) title.textContent = recipe.title;
        if (prepTime) prepTime.textContent = recipe.prepTime;
        if (cookTime) cookTime.textContent = recipe.cookTime;
        if (servings) servings.textContent = recipe.servings + ' kişilik';
        if (difficulty) difficulty.textContent = recipe.difficulty;
    },

    renderInstructions(html) {
        const container = document.getElementById('instructionsContent');
        if (container) {
            container.innerHTML = html;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Recipes.init();
});

window.Recipes = Recipes;
