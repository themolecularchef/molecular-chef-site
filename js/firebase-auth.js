// Firebase Auth Wrapper (Eski Auth ile uyumlu)
const Auth = {
    currentUser: null,

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                console.log("Giriş yapıldı:", user.email);
            }
        });
    },

    async register(name, email, password) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: name });

            // Firestore'da kullanıcı dokümanı
            await db.collection('users').doc(result.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString(),
                favorites: []
            });

            return { success: true, message: 'Kayıt başarılı!' };
        } catch (error) {
            let msg = 'Kayıt yapılamadı';
            if (error.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kayıtlı';
            if (error.code === 'auth/weak-password') msg = 'Şifre çok zayıf';
            return { success: false, message: msg };
        }
    },

    async login(email, password) {
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, message: 'Giriş başarılı!' };
        } catch (error) {
            let msg = 'Giriş yapılamadı';
            if (error.code === 'auth/user-not-found') msg = 'Kullanıcı bulunamadı';
            if (error.code === 'auth/wrong-password') msg = 'Şifre hatalı';
            return { success: false, message: msg };
        }
    },

    async logout() {
        await firebase.auth().signOut();
        localStorage.removeItem('skipAuth');
        return { success: true, message: 'Çıkış yapıldı' };
    },

    getCurrentUser() {
        return this.currentUser;
    },

    isLoggedIn() {
        return !!this.currentUser;
    }
};

// Global olarak tanımla
window.Auth = Auth;

// Başlat
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
