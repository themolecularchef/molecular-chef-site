/**
 * Lezzet Yolculuğu - Lists Module
 * User lists management (favorites and custom lists)
 */

const Lists = {
    // Keys for localStorage
    KEYS: {
        LISTS: 'lists'
    },
    
    // Guest user ID for non-logged in users
    GUEST_USER_ID: 'guest',
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.initializeDefaultLists();
        this.renderDashboard();
        this.bindCreateListEvents();
    },
    
    // ============================================
    // DATA MANAGEMENT
    // ============================================
    
    getCurrentUserId() {
        const currentUser = Auth.getCurrentUser();
        return currentUser ? currentUser.id : this.GUEST_USER_ID;
    },
    
    getLists() {
        const userId = this.getCurrentUserId();
        
        const allLists = localStorage.getItem(this.KEYS.LISTS);
        const lists = allLists ? JSON.parse(allLists) : [];
        
        // Filter lists for current user
        return lists.filter(l => l.userId === userId);
    },
    
    saveLists(lists) {
        const userId = this.getCurrentUserId();
        
        // Get all lists
        const allLists = localStorage.getItem(this.KEYS.LISTS);
        const otherUsersLists = allLists ? JSON.parse(allLists).filter(l => l.userId !== userId) : [];
        
        // Merge with current user's lists
        const updatedLists = [...otherUsersLists, ...lists];
        localStorage.setItem(this.KEYS.LISTS, JSON.stringify(updatedLists));
    },
    
    initializeDefaultLists() {
        const userId = this.getCurrentUserId();
        const lists = this.getLists();
        
        // Create favorites list if it doesn't exist
        if (!lists.some(l => l.id === 'favorites')) {
            const favoritesList = {
                id: 'favorites',
                userId: userId,
                name: 'Favorilerim',
                recipes: [],
                isDefault: true,
                createdAt: new Date().toISOString()
            };
            lists.push(favoritesList);
            this.saveLists(lists);
        }
    },
    
    // ============================================
    // LIST OPERATIONS
    // ============================================
    
    createList(name) {
        const userId = this.getCurrentUserId();
        const lists = this.getLists();
        
        const newList = {
            id: Utils.generateId(),
            userId: userId,
            name: name.trim(),
            recipes: [],
            isDefault: false,
            createdAt: new Date().toISOString()
        };
        
        lists.push(newList);
        this.saveLists(lists);
        
        return newList;
    },
    
    deleteList(listId) {
        if (listId === 'favorites') {
            Toast.show('Favoriler listesi silinemez', 'error');
            return false;
        }
        
        const lists = this.getLists();
        const updatedLists = lists.filter(l => l.id !== listId);
        this.saveLists(updatedLists);
        
        return true;
    },
    
    getList(listId) {
        const lists = this.getLists();
        return lists.find(l => l.id === listId);
    },
    
    // ============================================
    // RECIPE OPERATIONS
    // ============================================
    
    addToList(listId, recipeId) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        
        if (!list) return false;
        
        if (!list.recipes.includes(recipeId)) {
            list.recipes.push(recipeId);
            this.saveLists(lists);
        }
        
        return true;
    },
    
    removeFromList(listId, recipeId) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        
        if (!list) return false;
        
        list.recipes = list.recipes.filter(id => id !== recipeId);
        this.saveLists(lists);
        
        return true;
    },
    
    isInList(listId, recipeId) {
        const list = this.getList(listId);
        return list ? list.recipes.includes(recipeId) : false;
    },
    
    // ============================================
    // DASHBOARD RENDERING
    // ============================================
    
    renderDashboard() {
        // Only run on dashboard page
        if (!document.querySelector('.main-dashboard')) return;
        
        // Check authentication - redirect to login if not logged in
        if (!Auth.isLoggedIn()) {
            Toast.show('Bu sayfaya erişmek için giriş yapmalısınız', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
            return;
        }
        
        // Update user name
        const currentUser = Auth.getCurrentUser();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && currentUser) {
            userNameEl.textContent = currentUser.name;
        }
        
        this.renderListsGrid();
    },
    
    renderListsGrid() {
        const grid = document.getElementById('listsGrid');
        if (!grid) {
            console.warn('listsGrid element not found');
            return;
        }
        
        const lists = this.getLists();
        
        if (lists.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h4 class="empty-state-title">Henüz listeniz yok</h4>
                    <p class="empty-state-text">İlk listenizi oluşturmak için "Yeni Liste" butonuna tıklayın.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = lists.map(list => this.createListCard(list)).join('');
        
        // Bind list card events
        this.bindListCardEvents();
    },
    
    createListCard(list) {
        // Get first recipe image for cover
        let coverImage = '';
        let coverPlaceholder = '📋';
        
        if (list.recipes.length > 0 && Recipes.data) {
            const firstRecipe = Recipes.data.find(r => r.id === list.recipes[0]);
            if (firstRecipe) {
                coverImage = firstRecipe.image;
            }
        }
        
        const recipeCount = list.recipes.length;
        const recipeText = recipeCount === 0 ? 'Henüz tarif yok' : 
                          recipeCount === 1 ? '1 tarif' : 
                          `${recipeCount} tarif`;
        
        return `
            <div class="list-card" data-id="${list.id}">
                <div class="list-card-image">
                    ${coverImage ? 
                        `<img src="${coverImage}" alt="${list.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="list-card-placeholder" style="${coverImage ? 'display:none;' : ''}">${coverPlaceholder}</div>
                </div>
                <div class="list-card-content">
                    <h3 class="list-card-title">${list.name}</h3>
                    <p class="list-card-count">${recipeText}</p>
                    <div class="list-card-actions">
                        <button class="list-card-btn list-card-btn-view view-list-btn" data-id="${list.id}">Görüntüle</button>
                        ${!list.isDefault ? 
                            `<button class="list-card-btn list-card-btn-delete delete-list-btn" data-id="${list.id}">Sil</button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
    },
    
    bindListCardEvents() {
        // View list buttons
        document.querySelectorAll('.view-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = btn.dataset.id;
                this.showListDetail(listId);
            });
        });
        
        // Delete list buttons
        document.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = btn.dataset.id;
                
                if (confirm('Bu listeyi silmek istediğinize emin misiniz?')) {
                    if (this.deleteList(listId)) {
                        Toast.show('Liste silindi');
                        this.renderListsGrid();
                    }
                }
            });
        });
        
        // Click on card to view
        document.querySelectorAll('.list-card').forEach(card => {
            card.addEventListener('click', () => {
                const listId = card.dataset.id;
                this.showListDetail(listId);
            });
        });
    },
    
    // ============================================
    // CREATE LIST MODAL
    // ============================================
    
    bindCreateListEvents() {
        const createListBtn = document.getElementById('createListBtn');
        const createListForm = document.getElementById('createListForm');
        
        if (createListBtn) {
            createListBtn.addEventListener('click', () => {
                if (!Auth.isLoggedIn()) {
                    Toast.show('Liste oluşturmak için giriş yapmalısınız', 'error');
                    setTimeout(() => {
                        window.location.href = 'auth.html';
                    }, 1500);
                    return;
                }
                Modal.open('createListModal');
            });
        }
        
        if (createListForm) {
            createListForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const listNameInput = document.getElementById('listName');
                if (!listNameInput) return;
                
                const listName = listNameInput.value;
                
                if (listName.trim()) {
                    this.createList(listName);
                    Toast.show('Liste oluşturuldu!', 'success');
                    Modal.close('createListModal');
                    createListForm.reset();
                    this.renderListsGrid();
                }
            });
        }
    },
    
    // ============================================
    // LIST DETAIL MODAL
    // ============================================
    
    showListDetail(listId) {
        const list = this.getList(listId);
        if (!list) return;
        
        const modalTitle = document.getElementById('listDetailTitle');
        const modalCount = document.getElementById('listDetailCount');
        const recipesGrid = document.getElementById('listRecipesGrid');
        const emptyState = document.getElementById('emptyListState');
        
        if (modalTitle) modalTitle.textContent = list.name;
        if (modalCount) {
            modalCount.textContent = list.recipes.length === 0 ? 'Henüz tarif yok' : 
                                    list.recipes.length === 1 ? '1 tarif' : 
                                    `${list.recipes.length} tarif`;
        }
        
        if (list.recipes.length === 0) {
            if (recipesGrid) recipesGrid.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (recipesGrid) recipesGrid.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');
            
            if (recipesGrid && Recipes.data) {
                recipesGrid.innerHTML = list.recipes.map(recipeId => {
                    const recipe = Recipes.data.find(r => r.id === recipeId);
                    if (!recipe) return '';
                    
                    return `
                        <div class="list-recipe-item">
                            <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>'">
                            <div class="list-recipe-item-overlay">
                                <span class="list-recipe-item-title">${recipe.title}</span>
                            </div>
                            <button class="list-recipe-item-remove" 
                                    data-list="${listId}" 
                                    data-recipe="${recipeId}"
                                    title="Listeden çıkar">×</button>
                        </div>
                    `;
                }).join('');
                
                // Bind remove buttons
                recipesGrid.querySelectorAll('.list-recipe-item-remove').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const listId = btn.dataset.list;
                        const recipeId = btn.dataset.recipe;
                        
                        this.removeFromList(listId, recipeId);
                        Toast.show('Listeden çıkarıldı');
                        this.showListDetail(listId); // Refresh modal
                        this.renderListsGrid(); // Refresh grid
                    });
                });
                
                // Bind click to go to recipe
                recipesGrid.querySelectorAll('.list-recipe-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const removeBtn = item.querySelector('.list-recipe-item-remove');
                        const recipeId = removeBtn.dataset.recipe;
                        window.location.href = `recipe.html?id=${recipeId}`;
                    });
                });
            }
        }
        
        Modal.open('listDetailModal');
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    Lists.init();
});

// Export for other modules
window.Lists = Lists;
