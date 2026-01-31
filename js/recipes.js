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
            this.bindSearchEvents();
        });
        
        if (document.querySelector('.recipe-hero')) {
            this.loadRecipeDetail();
        }
    },
    
    async loadRecipes() {
        try {
            const response = await fetch('content/recipes.json');
            const data = await response.json();
            this.data = data.recipes;
            return this.data;
        } catch (error) {
            console.error('Error loading recipes:', error);
            Toast.show('Tarifler yüklenirken bir hata oluştu', 'error');
            return [];
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
        return this.data ? this.data.find(r => r.id === id) : null;
    },

    // ============================================
    // RECIPE GRID - DÜZELTİLMİŞ FAVORİ SİSTEMİ
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
        
        // 1. Önce tüm kartları render et (varsayılan boş kalp 🤍)
        grid.innerHTML = recipesToRender.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // 2. Event listener'ları bağla
        this.bindCardEvents();
        
        // 3. Eğer giriş yapılmışsa, async olarak favori durumlarını kontrol et ve güncelle
        if (Auth.isLoggedIn && Auth.isLoggedIn()) {
            const favoriteBtns = grid.querySelectorAll('.favorite-btn');
            
            for (const btn of favoriteBtns) {
                const recipeId = btn.dataset.id;
                try {
                    // Lists.isFavorited async olduğu için await kullan
                    const isFavorited = await Lists.isFavorited(recipeId);
                    
                    if (isFavorited) {
                        btn.classList.add('active');
                        btn.dataset.favorited = "true";
                        btn.querySelector('span').textContent = '❤️';
                        btn.title = 'Favorilerden Çıkar';
                    }
                } catch (error) {
                    console.error("Favori kontrolü hatası:", error);
                }
            }
        }
    },
    
    createRecipeCard(recipe) {
        // Varsayılan olarak boş kalp (🤍) - durum sonradan kontrol edilecek
        return `
            <article class="recipe-card" data-id="${recipe.id}">
                <div class="recipe-card-image">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                    <div class="recipe-card-overlay"></div>
                    <div class="recipe-card-actions">
                        <button class="recipe-card-action favorite-btn" 
                                data-id="${recipe.id}" 
                                data-favorited="false"
                                title="Favorilere Ekle">
                            <span>🤍</span>
                        </button>
                        <button class="recipe-card-action quick-view-btn" 
                                data-id="${recipe.id}" 
                                title="Hızlı Bakış">
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
        // Favorite buttons - Önce eski listener'ları temizle
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Yeni listener'ları ekle
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!Auth.isLoggedIn || !Auth.isLoggedIn()) {
                    Toast.show('Favorilere eklemek için giriş yapmalısınız', 'error');
                    setTimeout(() => {
                        window.location.href = 'auth.html';
                    }, 1500);
                    return;
                }
                
                const recipeId = btn.dataset.id;
                const isCurrentlyFavorited = btn.dataset.favorited === "true";
                
                try {
                    if (isCurrentlyFavorited) {
                        // Favorilerden çıkar
                        await Lists.removeFromList('favorites', recipeId);
                        btn.classList.remove('active');
                        btn.dataset.favorited = "false";
                        btn.querySelector('span').textContent = '🤍';
                        btn.title = 'Favorilere Ekle';
                        Toast.show('Favorilerden çıkarıldı');
                    } else {
                        // Favorilere ekle
                        await Lists.addToList('favorites', recipeId);
                        btn.classList.add('active');
                        btn.dataset.favorited = "true";
                        btn.querySelector('span').textContent = '❤️';
                        btn.title = 'Favorilerden Çıkar';
                        Toast.show('Favorilere eklendi!', 'success');
                    }
                } catch (error) {
                    console.error("Favori hatası:", error);
                    Toast.show('İşlem yapılamadı', 'error');
                }
            });
        });
        
        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const recipeId = btn.dataset.id;
                this.showQuickView(recipeId);
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
    
    bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput) {
            const debouncedSearch = Utils.debounce((query) => {
                this.searchRecipes(query);
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    },
    
    searchRecipes(query) {
        if (!query.trim()) {
            this.renderRecipesGrid(this.data);
            return;
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        
        const filtered = this.data.filter(recipe => {
            return (
                recipe.title.toLowerCase().includes(normalizedQuery) ||
                recipe.category.toLowerCase().includes(normalizedQuery) ||
                recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
            );
        });
        
        this.renderRecipesGrid(filtered);
    },
    
    // ============================================
    // RECIPE DETAIL PAGE
    // ============================================
    
    async loadRecipeDetail() {
        const recipeId = Utils.getUrlParam('id');
        
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
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = recipe.description;
        }
        
        this.renderRecipeHero(recipe);
        this.renderIngredients(recipe);
        
        const contentHtml = await this.loadRecipeContent(recipe.contentFile);
        this.renderInstructions(contentHtml);
        
        this.bindActionButtons(recipe);
        this.bindServingsButtons();
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
    
    renderIngredients(recipe) {
        const ingredientsList = document.getElementById('ingredientsList');
        const servingsCount = document.getElementById('servingsCount');
        
        if (servingsCount) servingsCount.textContent = recipe.servings;
        
        if (ingredientsList) {
            ingredientsList.innerHTML = `
                <div class="ingredient-item">
                    <div class="ingredient-checkbox" onclick="this.classList.toggle('checked'); this.nextElementSibling.classList.toggle('checked')"></div>
                    <span class="ingredient-text">Malzemeleri görmek için tarif içeriğini inceleyin</span>
                </div>
            `;
        }
    },
    
    renderInstructions(html) {
        const container = document.getElementById('instructionsContent');
        if (container) {
            container.innerHTML = html;
            this.extractAndRenderIngredients(html);
        }
    },
    
    extractAndRenderIngredients(html) {
        const ingredientsList = document.getElementById('ingredientsList');
        if (!ingredientsList) return;
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const lists = temp.querySelectorAll('ul li, ol li');
        
        if (lists.length > 0) {
            this.originalIngredients = Array.from(lists).map(li => li.textContent.trim());
            
            ingredientsList.innerHTML = this.originalIngredients.map(text => `
                <div class="ingredient-item">
                    <div class="ingredient-checkbox" onclick="this.classList.toggle('checked'); this.nextElementSibling.classList.toggle('checked')"></div>
                    <span class="ingredient-text" data-original="${this.escapeHtml(text)}">${text}</span>
                </div>
            `).join('');
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    bindServingsButtons() {
        const increaseBtn = document.getElementById('increaseServings');
        const decreaseBtn = document.getElementById('decreaseServings');
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (this.servingsMultiplier < 4) {
                    this.servingsMultiplier += 0.5;
                    this.updateIngredientsDisplay();
                }
            });
        }
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                if (this.servingsMultiplier > 0.5) {
                    this.servingsMultiplier -= 0.5;
                    this.updateIngredientsDisplay();
                }
            });
        }
    },
    
    updateIngredientsDisplay() {
        const servingsCount = document.getElementById('servingsCount');
        if (servingsCount) {
            const newServings = Math.round(this.originalServings * this.servingsMultiplier * 10) / 10;
            servingsCount.textContent = newServings;
        }
        
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        ingredientItems.forEach((item, index) => {
            const textSpan = item.querySelector('.ingredient-text');
            if (!textSpan || !this.originalIngredients[index]) return;
            
            const originalText = this.originalIngredients[index];
            const scaledText = this.scaleIngredientText(originalText, this.servingsMultiplier);
            textSpan.textContent = scaledText;
        });
    },
    
    scaleIngredientText(text, multiplier) {
        const numberRegex = /(\d+(?:[.,]\d+)?)\s*(adet|su bardağı|yemek kaşığı|çay kaşığı|tatlı kaşığı|gr|kg|ml|cl|gram|kilogram|litre|paket|demet|baş|diş)?/gi;
        
        return text.replace(numberRegex, (match, numberStr, unit) => {
            const number = parseFloat(numberStr.replace(',', '.'));
            if (isNaN(number)) return match;
            
            let newValue = number * multiplier;
            let formattedValue;
            
            if (newValue < 1) {
                formattedValue = Math.round(newValue * 100) / 100;
                formattedValue = formattedValue.toString().replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
            } else if (newValue % 1 === 0) {
                formattedValue = Math.round(newValue);
            } else if (newValue % 0.5 === 0) {
                formattedValue = newValue;
            } else {
                formattedValue = Math.round(newValue * 10) / 10;
            }
            
            formattedValue = formattedValue.toString().replace('.', ',');
            return unit ? `${formattedValue} ${unit}` : formattedValue;
        });
    },
    
    bindActionButtons(recipe) {
        const shareBtn = document.getElementById('shareBtn');
        const printBtn = document.getElementById('printBtn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                Modal.open('shareModal');
            });
        }
        
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        this.bindShareOptions(recipe);
    },
    
    bindShareOptions(recipe) {
        const shareUrl = Utils.getShareUrl(recipe.id);
        const shareText = `${recipe.title} - Lezzet Yolculuğu`;
        
        const shareNative = document.getElementById('shareNative');
        const shareWhatsApp = document.getElementById('shareWhatsApp');
        const shareCopy = document.getElementById('shareCopy');
        
        if (shareNative) {
            shareNative.addEventListener('click', async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: recipe.title,
                            text: shareText,
                            url: shareUrl
                        });
                        Modal.close('shareModal');
                    } catch (err) {
                        console.log('Share cancelled');
                    }
                } else {
                    Toast.show('Tarayıcınız paylaşımı desteklemiyor', 'error');
                }
            });
        }
        
        if (shareWhatsApp) {
            shareWhatsApp.addEventListener('click', () => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                window.open(whatsappUrl, '_blank');
                Modal.close('shareModal');
            });
        }
        
        if (shareCopy) {
            shareCopy.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    Toast.show('Link kopyalandı!', 'success');
                    Modal.close('shareModal');
                } catch (err) {
                    Toast.show('Link kopyalanamadı', 'error');
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Recipes.init();
});

window.Recipes = Recipes;
