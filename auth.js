/**
 * Lezzet Yolculuğu - Authentication Module
 * LocalStorage-based user authentication
 */

const Auth = {
    // Keys for localStorage
    KEYS: {
        USERS: 'users',
        CURRENT_USER: 'currentUser'
    },
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.bindAuthPageEvents();
        this.updateNavigation();
    },
    
    // ============================================
    // USER MANAGEMENT
    // ============================================
    
    getUsers() {
        const users = localStorage.getItem(this.KEYS.USERS);
        return users ? JSON.parse(users) : [];
    },
    
    saveUsers(users) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },
    
    getCurrentUser() {
        const userId = localStorage.getItem(this.KEYS.CURRENT_USER);
        if (!userId) return null;
        
        const users = this.getUsers();
        return users.find(u => u.id === userId) || null;
    },
    
    setCurrentUser(userId) {
        if (userId) {
            localStorage.setItem(this.KEYS.CURRENT_USER, userId);
        } else {
            localStorage.removeItem(this.KEYS.CURRENT_USER);
        }
    },
    
    // ============================================
    // AUTHENTICATION
    // ============================================
    
    register(name, email, password) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Bu e-posta adresi zaten kayıtlı' };
        }
        
        // Create new user
        const newUser = {
            id: Utils.generateId(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: Utils.encode(password),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        // Auto login
        this.setCurrentUser(newUser.id);
        
        return { success: true, message: 'Kayıt başarılı!' };
    },
    
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email.trim().toLowerCase());
        
        if (!user) {
            return { success: false, message: 'E-posta adresi bulunamadı' };
        }
        
        if (user.password !== Utils.encode(password)) {
            return { success: false, message: 'Şifre hatalı' };
        }
        
        this.setCurrentUser(user.id);
        return { success: true, message: 'Giriş başarılı!' };
    },
    
    logout() {
        this.setCurrentUser(null);
        Toast.show('Çıkış yapıldı', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },
    
    isLoggedIn() {
        return !!this.getCurrentUser();
    },
    
    // ============================================
    // UI UPDATES
    // ============================================
    
    updateNavigation() {
        const currentUser = this.getCurrentUser();
        
        // Update nav auth section
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const navUserName = document.getElementById('navUserName');
        const navLists = document.getElementById('navLists');
        
        if (navAuth && navUser && navUserName) {
            if (currentUser) {
                navAuth.classList.add('hidden');
                navUser.classList.remove('hidden');
                navUserName.textContent = currentUser.name;
                
                // Show lists link
                if (navLists) navLists.classList.remove('hidden');
            } else {
                navAuth.classList.remove('hidden');
                navUser.classList.add('hidden');
                
                // Hide lists link
                if (navLists) navLists.classList.add('hidden');
            }
        }
        
        // Update mobile menu
        const mobileAuth = document.getElementById('mobileAuth');
        const mobileUser = document.getElementById('mobileUser');
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileLists = document.getElementById('mobileLists');
        
        if (mobileAuth && mobileUser && mobileUserName) {
            if (currentUser) {
                mobileAuth.classList.add('hidden');
                mobileUser.classList.remove('hidden');
                mobileUserName.textContent = currentUser.name;
                
                if (mobileLists) mobileLists.classList.remove('hidden');
            } else {
                mobileAuth.classList.remove('hidden');
                mobileUser.classList.add('hidden');
                
                if (mobileLists) mobileLists.classList.add('hidden');
            }
        }
        
        // Bind logout buttons
        const navLogout = document.getElementById('navLogout');
        const mobileLogout = document.getElementById('mobileLogout');
        
        if (navLogout) {
            navLogout.addEventListener('click', () => this.logout());
        }
        if (mobileLogout) {
            mobileLogout.addEventListener('click', () => this.logout());
        }
    },
    
    // ============================================
    // AUTH PAGE EVENTS
    // ============================================
    
    bindAuthPageEvents() {
        // Only run on auth page
        if (!document.querySelector('.auth-page')) return;
        
        const authForm = document.getElementById('authForm');
        const authToggleBtn = document.getElementById('authToggleBtn');
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authSubmit = document.getElementById('authSubmit');
        const nameGroup = document.getElementById('nameGroup');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const authToggleText = document.getElementById('authToggleText');
        
        if (!authForm) return;
        
        let isLoginMode = true;
        
        // Toggle between login and register
        if (authToggleBtn) {
            authToggleBtn.addEventListener('click', () => {
                isLoginMode = !isLoginMode;
                
                if (isLoginMode) {
                    authTitle.textContent = 'Giriş Yap';
                    authSubtitle.textContent = 'Hesabınıza giriş yaparak tariflerinizi kaydedin';
                    authSubmit.textContent = 'Giriş Yap';
                    nameGroup.style.display = 'none';
                    confirmPasswordGroup.style.display = 'none';
                    authToggleText.textContent = 'Hesabınız yok mu?';
                    authToggleBtn.textContent = 'Kayıt Ol';
                } else {
                    authTitle.textContent = 'Kayıt Ol';
                    authSubtitle.textContent = 'Yeni bir hesap oluşturun';
                    authSubmit.textContent = 'Kayıt Ol';
                    nameGroup.style.display = 'block';
                    confirmPasswordGroup.style.display = 'block';
                    authToggleText.textContent = 'Zaten hesabınız var mı?';
                    authToggleBtn.textContent = 'Giriş Yap';
                }
            });
        }
        
        // Form submission
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (isLoginMode) {
                // Login
                const result = this.login(email, password);
                
                if (result.success) {
                    Toast.show(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    Toast.show(result.message, 'error');
                }
            } else {
                // Register
                const name = document.getElementById('name').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (!name.trim()) {
                    Toast.show('Lütfen isminizi girin', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    Toast.show('Şifreler eşleşmiyor', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    Toast.show('Şifre en az 6 karakter olmalı', 'error');
                    return;
                }
                
                const result = this.register(name, email, password);
                
                if (result.success) {
                    Toast.show(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    Toast.show(result.message, 'error');
                }
            }
        });
    },
    
    // ============================================
    // PROTECTED ROUTES
    // ============================================
    
    requireAuth() {
        if (!this.isLoggedIn()) {
            Toast.show('Bu sayfaya erişmek için giriş yapmalısınız', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
            return false;
        }
        return true;
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Export for other modules
window.Auth = Auth;
