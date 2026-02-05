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
            throw error;
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
            
            // Markdown'ı işle ve dön
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
    
    // SKELETON GÖSTER (yükleme başlangıcı)
    if (window.SkeletonLoader) {
        SkeletonLoader.showGridSkeleton('recipesGrid', 6);
    }
    
    // Gerçek içeriği hazırla (kısa gecikme ile kullanıcı animasyonu görsün)
    setTimeout(() => {
        const html = recipesToRender.map(recipe => `
            <article class="recipe-card" data-id="${recipe.id}">
                <!-- ... mevcut kart HTML'i ... -->
            </article>
        `).join('');
        
        // Skeleton'u kaldır ve gerçek içeriği göster
        if (window.SkeletonLoader) {
            SkeletonLoader.hideSkeleton('recipesGrid', html);
        } else {
            grid.innerHTML = html;
        }
        
        this.bindCardEvents();
    }, 500); // 500ms bekle (animasyon gözüksün)
}
        
        grid.innerHTML = recipesToRender.map(recipe => `
            <article class="recipe-card" data-id="${recipe.id}">
                <div class="recipe-card-image">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="recipe-card-overlay"></div>
                    <div class="recipe-card-actions">
                        <button class="recipe-card-action favorite-btn" 
                                data-id="${recipe.id}" 
                                data-title="${recipe.title.replace(/"/g, '&quot;')}"
                                onclick="handleFavoriteClick(event, '${recipe.id}', '${recipe.title.replace(/'/g, "\\'")}')">
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
        
        // Lazy loading'i başlat
        if (window.LazyLoader) {
            window.LazyLoader.init();
        }
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
                <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                <div class="quick-view-content">
                    <span>${recipe.category}</span>
                    <h2>${recipe.title}</h2>
                    <p>${recipe.description || 'Bu tarif için açıklama bulunmuyor.'}</p>
                    <a href="recipe.html?id=${recipe.id}" class="btn btn-primary">Tarifi Görüntüle</a>
                </div>
            </div>
        `;
        
        if (window.Modal) {
            Modal.open('quickViewModal');
        }
    },

    // Tarif detay sayfası için yardımcı fonksiyonlar
    async fetchRecipeMarkdown(contentFile) {
        if (!contentFile) throw new Error('Content file belirtilmemiş');
        const response = await fetch(contentFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    },

    removeFrontmatter(markdown) {
        const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n?/;
        return markdown.replace(frontmatterRegex, '');
    },

    removeFirstTitle(markdown) {
        const lines = markdown.split('\n');
        let startIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('# ')) {
                startIndex = i + 1;
                break;
            }
        }
        
        return lines.slice(startIndex).join('\n').trim();
    },

    removeIngredientsSection(markdown) {
        const lines = markdown.split('\n');
        let result = [];
        let skipMode = false;
        let inIngredients = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (/^#{1,3}\s*Malzemeler/i.test(line) || 
                /^Malzemeler\s*$/i.test(line)) {
                skipMode = true;
                inIngredients = true;
                continue;
            }
            
            if (skipMode) {
                if (line && !line.startsWith('-') && !line.startsWith('*') && 
                    !/^\d+\./.test(line) && !line.startsWith('>')) {
                    if (line.startsWith('#')) {
                        skipMode = false;
                        inIngredients = false;
                    } else if (line && !inIngredients) {
                        skipMode = false;
                    }
                }
                
                if (skipMode && (line.startsWith('-') || line.startsWith('*') || 
                    /^\d+\./.test(line) || line === '' || 
                    line.startsWith('[') || line.startsWith('!'))) {
                    continue;
                }
                
                if (line === '' && i < lines.length - 1) {
                    let nextNonEmpty = i + 1;
                    while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') {
                        nextNonEmpty++;
                    }
                    if (nextNonEmpty < lines.length && !lines[nextNonEmpty].trim().startsWith('-') && 
                        !lines[nextNonEmpty].trim().startsWith('*')) {
                        skipMode = false;
                        inIngredients = false;
                    }
                }
            }
            
            if (!skipMode) {
                result.push(lines[i]);
            }
        }
        
        return result.join('\n');
    },

    extractIngredientsFromMarkdown(markdown) {
        const ingredients = [];
        const lines = markdown.split('\n');
        let inIngredientsSection = false;
        let foundIngredients = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (/^#{1,3}\s*Malzemeler/i.test(line) || 
                /^Malzemeler\s*$/i.test(line)) {
                inIngredientsSection = true;
                foundIngredients = true;
                continue;
            }
            
            if (inIngredientsSection && line.startsWith('#') && 
                !/^#{1,3}\s*Malzemeler/i.test(line)) {
                break;
            }
            
            if (inIngredientsSection) {
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    ingredients.push(line.substring(2).trim());
                } else if (/^\d+\.\s/.test(line)) {
                    ingredients.push(line.replace(/^\d+\.\s/, '').trim());
                } else if (line === '' && ingredients.length > 0) {
                    let nextNonEmpty = i + 1;
                    while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') {
                        nextNonEmpty++;
                    }
                    if (nextNonEmpty < lines.length && 
                        (lines[nextNonEmpty].trim().startsWith('-') || 
                         lines[nextNonEmpty].trim().startsWith('*'))) {
                        i = nextNonEmpty - 1;
                        continue;
                    } else {
                        break;
                    }
                } else if (line && !line.startsWith('-') && !line.startsWith('*') && 
                           !/^\d+\./.test(line) && ingredients.length > 0) {
                    if (line.length > 50) break;
                }
            }
        }
        
        if (ingredients.length === 0 && foundIngredients) {
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    const item = line.substring(2).trim();
                    if (this.containsMeasurement(item)) {
                        ingredients.push(item);
                    }
                }
            }
        }
        
        return ingredients;
    },

    containsMeasurement(text) {
        const measurements = ['su bardağı', 'çay bardağı', 'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı', 
                            'kg', 'gr', 'g ', 'ml', 'cl', 'litre', 'adet', 'paket', 'demet', 'diş', 
                            'gram', 'kilogram', 'litre', 'ml', 'cc', 'tutam', 'avuç', 'çimdik'];
        const hasMeasurement = measurements.some(m => text.toLowerCase().includes(m));
        const hasNumber = /\d/.test(text);
        return hasMeasurement || hasNumber;
    },

    scaleIngredient(ingredient, ratio) {
        if (ratio === 1) return ingredient;
        
        return ingredient.replace(/(\d+(?:[.,]\d+)?|\d+\/\d+|½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)/g, (match) => {
            let num;
            
            const unicodeFractions = {
                '½': 0.5, '¼': 0.25, '¾': 0.75,
                '⅓': 0.333, '⅔': 0.667,
                '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
            };
            
            if (unicodeFractions[match]) {
                num = unicodeFractions[match];
            } else if (match.includes('/')) {
                const [a, b] = match.split('/');
                num = parseFloat(a) / parseFloat(b);
            } else {
                num = parseFloat(match.replace(',', '.'));
            }
            
            if (isNaN(num)) return match;
            
            const scaled = num * ratio;
            
            if (scaled < 0.25) return '¼';
            if (scaled < 0.4) return '⅓';
            if (scaled < 0.6) return '½';
            if (scaled < 0.7) return '⅔';
            if (scaled < 0.9) return '¾';
            
            if (scaled === Math.floor(scaled)) {
                return scaled.toFixed(0);
            }
            if (scaled % 0.5 === 0) {
                return scaled.toFixed(1).replace('.0', '');
            }
            return scaled.toFixed(1).replace('.0', '');
        });
    }
};

// Global fonksiyon - Favori butonu için güvenli wrapper
window.handleFavoriteClick = function(event, recipeId, recipeTitle) {
    event.stopPropagation();
    
    if (typeof window.openAddToListModal === 'function') {
        window.openAddToListModal(recipeId, recipeTitle);
    } else {
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
