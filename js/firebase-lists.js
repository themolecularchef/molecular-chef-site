// Firebase Lists (Favorites)
const Lists = {
    // Favoriye ekle/çıkar (toggle)
    async toggleFavorite(recipeId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            Toast.show('Favorilere eklemek için giriş yapmalısınız', 'error');
            return null;
        }
        
        try {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            
            if (!doc.exists) {
                // Kullanıcı dokümanı yoksa oluştur
                await userRef.set({ favorites: [recipeId] });
                return { action: 'added' };
            }
            
            const data = doc.data();
            const favorites = data.favorites || [];
            
            if (favorites.includes(recipeId)) {
                // Favorilerden çıkar
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(recipeId)
                });
                return { action: 'removed' };
            } else {
                // Favoriye ekle
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayUnion(recipeId)
                });
                return { action: 'added' };
            }
        } catch (error) {
            console.error("Favori hatası:", error);
            return null;
        }
    },
    
    // Favori mi kontrol et
    async isFavorited(recipeId) {
        const user = Auth.getCurrentUser();
        if (!user) return false;
        
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (!doc.exists) return false;
            
            const favorites = doc.data().favorites || [];
            return favorites.includes(recipeId);
        } catch (error) {
            return false;
        }
    },
    
    // Kullanıcının favorilerini getir
    async getFavorites() {
        const user = Auth.getCurrentUser();
        if (!user) return [];
        
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (!doc.exists) return [];
            
            return doc.data().favorites || [];
        } catch (error) {
            return [];
        }
    }
};

window.Lists = Lists;
