/**
 * Lezzet Yolculuğu - Recipes Module
 * Recipe loading, display, and search functionality
 */

const Recipes = {
    // Cache for recipes data
    data: null,
    currentRecipe: null,
    
    // Servings multiplier state
    servingsMultiplier: 1,
    originalServings: 4,
    originalIngredients: [],
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.loadRecipes().then(() => {
            this.renderRecipesGrid();
            this.bindFilterEvents();
            this.bindSearchEvents();
        });
        
        // Check if we're on the recipe detail page
        if (document.querySelector('.recipe-hero')) {
            this.loadRecipeDetail();
        }
    },
    
    // ============================================
    // DATA LOADING
    // ============================================
    
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
    // RECIPE GRID (INDEX PAGE)
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
        
        // 1. Önce tüm kartları render et (varsayılan boş kalp)
        grid.innerHTML = recipesToRender.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // 2. Event listener'ları bağla
        this.bindCardEvents();
        
        // 3. Giriş yapılmışsa favori durumlarını kontrol et ve güncelle
        if (Auth.isLoggedIn()) {
            const favoriteBtns = grid.querySelectorAll('.favorite-btn');
            
            for (const btn of favoriteBtns) {
                const recipeId = btn.dataset.id;
                try {
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
        // Varsayılan olarak boş kalp, durum sonradan kontrol edilecek
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
        // Favorite buttons - Önce temizle
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Yeni listener'ları ekle
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!Auth.isLoggedIn()) {
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
    
    // ============================================
    // QUICK VIEW MODAL
    // ============================================
    
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
    // FILTERING & SEARCH
    // ============================================
    
    bindFilterEvents() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
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
        
        // Wait for recipes to load
        if (!this.data) {
            await this.loadRecipes();
        }
        
        const recipe = this.getRecipeById(recipeId);
        
        if (!recipe) {
            Toast.show('Tarif bulunamadı', 'error');
            return;
        }
        
        this.currentRecipe = recipe;
        
        // Reset servings multiplier
        this.servingsMultiplier = 1;
        this.originalServings = recipe.servings;
        
        // Update page title
        document.title = `${recipe.title} | Lezzet Yolculuğu`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = recipe.description;
        }
        
        // Render hero section
        this.renderRecipeHero(recipe);
        
        // Render ingredients
        this.renderIngredients(recipe);
        
        // Render instructions
        const contentHtml = await this.loadRecipeContent(recipe.contentFile);
        this.renderInstructions(contentHtml);
        
        // Bind action buttons
        this.bindActionButtons(recipe);
        
        // Bind servings buttons
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
        
        // Parse ingredients from markdown content
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
            
            // Extract ingredients from the HTML and update the sidebar
            this.extractAndRenderIngredients(html);
        }
    },
    
    extractAndRenderIngredients(html) {
        const ingredientsList = document.getElementById('ingredientsList');
        if (!ingredientsList) return;
        
        // Create a temporary element to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Find all list items in the ingredients section
        const lists = temp.querySelectorAll('ul li, ol li');
        
        if (lists.length > 0) {
            // Store original ingredients for scaling
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
    
    // ============================================
    // SERVINGS MULTIPLIER SYSTEM
    // ============================================
    
    bindServingsButtons() {
        const increaseBtn = document.getElementById('increaseServings');
        const decreaseBtn = document.getElementById('decreaseServings');
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (this.servingsMultiplier < 4) { // Max 4x (e.g., 4 kişilik -> 16 kişilik)
                    this.servingsMultiplier += 0.5;
                    this.updateIngredientsDisplay();
                }
            });
        }
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                if (this.servingsMultiplier > 0.5) { // Min 0.5x
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
        
        // Update each ingredient
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
        // Regex to match numbers with optional decimal and units
        // Matches: 4, 1.5, 2.5, etc. followed by optional unit
        const numberRegex = /(\d+(?:[.,]\d+)?)\s*(adet|su bardağı|yemek kaşığı|çay kaşığı|tatlı kaşığı|gr|kg|ml|cl|gram|kilogram|litre|paket|demet|baş|diş)?/gi;
        
        return text.replace(numberRegex, (match, numberStr, unit) => {
            // Parse number (handle both . and , as decimal separator)
            const number = parseFloat(numberStr.replace(',', '.'));
            
            if (isNaN(number)) return match;
            
            // Calculate new value
            let newValue = number * multiplier;
            
            // Format the result
            let formattedValue;
            if (newValue < 1) {
                // Show decimal for small values
                formattedValue = Math.round(newValue * 100) / 100;
                // Remove trailing zeros
                formattedValue = formattedValue.toString().replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
            } else if (newValue % 1 === 0) {
                // Whole number
                formattedValue = Math.round(newValue);
            } else if (newValue % 0.5 === 0) {
                // Half values (0.5, 1.5, etc.)
                formattedValue = newValue;
            } else {
                // Round to 1 decimal place
                formattedValue = Math.round(newValue * 10) / 10;
            }
            
            // Replace decimal point with comma for Turkish format
            formattedValue = formattedValue.toString().replace('.', ',');
            
            return unit ? `${formattedValue} ${unit}` : formattedValue;
        });
    },
    
    // ============================================
    // ACTION BUTTONS
    // ============================================
    
    bindActionButtons(recipe) {
        // Add to list button - now opens list selection modal
        const addToListBtn = document.getElementById('addToListBtn');
        if (addToListBtn) {
            // Update button to show list selection modal
            addToListBtn.addEventListener('click', () => {
                if (!Auth.isLoggedIn()) {
                    Toast.show('Listeye eklemek için giriş yapmalısınız', 'error');
                    setTimeout(() => {
                        window.location.href = 'auth.html';
                    }, 1500);
                    return;
                }
                
                this.showListSelectionModal(recipe.id);
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                Modal.open('shareModal');
            });
        }
        
        // Print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Share options
        this.bindShareOptions(recipe);
    },
    
    showListSelectionModal(recipeId) {
        // Get user's lists
        const userLists = Lists.getLists();
        
        // Create modal HTML if not exists
        let modal = document.getElementById('listSelectionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'listSelectionModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Build list options
        const listOptions = userLists.map(list => {
            const isInList = Lists.isInList(list.id, recipeId);
            return `
                <label class="list-selection-item">
                    <input type="checkbox" class="list-selection-checkbox" 
                           value="${list.id}" ${isInList ? 'checked' : ''}>
                    <span class="list-selection-name">${list.name}</span>
                    ${isInList ? '<span class="list-selection-status">✓</span>' : ''}
                </label>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content modal-sm">
                <button class="modal-close" aria-label="Kapat">×</button>
                <div class="modal-header">
                    <h3 class="modal-title">Listeye Ekle</h3>
                </div>
                <div class="modal-body">
                    <div class="list-selection-list">
                        ${listOptions}
                    </div>
                    <button class="list-selection-create-btn" id="quickCreateListBtn">
                        <span>+</span> Yeni Liste Oluştur
                    </button>
                    <button type="button" class="btn btn-primary btn-full" id="saveToListsBtn" style="margin-top: var(--space-md);">
                        Kaydet
                    </button>
                </div>
            </div>
        `;
        
        // Bind close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modal.close('listSelectionModal');
        });
        
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            Modal.close('listSelectionModal');
        });
        
        // Bind quick create button
        const quickCreateBtn = modal.querySelector('#quickCreateListBtn');
        if (quickCreateBtn) {
            quickCreateBtn.addEventListener('click', () => {
                const listName = prompt('Liste adı:');
                if (listName && listName.trim()) {
                    const newList = Lists.createList(listName.trim());
                    if (newList) {
                        Toast.show('Liste oluşturuldu!', 'success');
                        this.showListSelectionModal(recipeId); // Refresh modal
                    }
                }
            });
        }
        
        // Bind save button
        const saveBtn = modal.querySelector('#saveToListsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const checkboxes = modal.querySelectorAll('.list-selection-checkbox');
                const addedLists = [];
                const removedLists = [];
                
                checkboxes.forEach(checkbox => {
                    const listId = checkbox.value;
                    const list = userLists.find(l => l.id === listId);
                    const wasInList = Lists.isInList(listId, recipeId);
                    
                    if (checkbox.checked && !wasInList) {
                        Lists.addToList(listId, recipeId);
                        if (list) addedLists.push(list.name);
                    } else if (!checkbox.checked && wasInList) {
                        Lists.removeFromList(listId, recipeId);
                        if (list) removedLists.push(list.name);
                    }
                });
                
                // Show appropriate toast
                if (addedLists.length > 0) {
                    Toast.show(`${addedLists.join(', ')} listesine eklendi`, 'success');
                }
                if (removedLists.length > 0) {
                    Toast.show(`${removedLists.join(', ')} listesinden çıkarıldı`);
                }
                if (addedLists.length === 0 && removedLists.length === 0) {
                    Toast.show('Değişiklik yapılmadı');
                }
                
                Modal.close('listSelectionModal');
                
                // Update add to list button state
                const isInAnyList = userLists.some(l => Lists.isInList(l.id, recipeId));
                const addToListBtn = document.getElementById('addToListBtn');
                if (addToListBtn) {
                    this.updateAddToListButton(addToListBtn, isInAnyList);
                }
            });
        }
        
        Modal.open('listSelectionModal');
    },
    
    updateAddToListButton(btn, isInAnyList) {
        const icon = btn.querySelector('.action-btn-icon');
        const text = btn.querySelector('.action-btn-text');
        
        if (isInAnyList) {
            btn.classList.add('active');
            if (icon) icon.textContent = '❤️';
            if (text) text.textContent = 'Listede';
        } else {
            btn.classList.remove('active');
            if (icon) icon.textContent = '🤍';
            if (text) text.textContent = 'Listeme Ekle';
        }
    },
    
    bindShareOptions(recipe) {
        const shareUrl = Utils.getShareUrl(recipe.id);
        const shareText = `${recipe.title} - Lezzet Yolculuğu`;
        
        // Native share
        const shareNative = document.getElementById('shareNative');
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
        
        // WhatsApp share
        const shareWhatsApp = document.getElementById('shareWhatsApp');
        if (shareWhatsApp) {
            shareWhatsApp.addEventListener('click', () => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                window.open(whatsappUrl, '_blank');
                Modal.close('shareModal');
            });
        }
        
        // Copy link
        const shareCopy = document.getElementById('shareCopy');
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

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    Recipes.init();
});

// Export for other modules
window.Recipes = Recipes;
