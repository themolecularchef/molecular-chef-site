// Firebase Lists (Favorites ve Özel Listeler)
const Lists = {
    // 1. Favoriye Ekle/Çıkar (Toggle)
    async toggleFavorite(recipeId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            alert('Favorilere eklemek için giriş yapmalısınız');
            return null;
        }
        
        try {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            
            // Kullanıcı dökümanı yoksa oluştur
            if (!doc.exists) {
                await userRef.set({ favorites: [recipeId] });
                return { action: 'added' };
            }
            
            const data = doc.data();
            const favorites = data.favorites || [];
            
            if (favorites.includes(recipeId)) {
                // Varsa çıkar
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(recipeId)
                });
                console.log("Favoriden çıkarıldı:", recipeId);
                return { action: 'removed' };
            } else {
                // Yoksa ekle
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayUnion(recipeId)
                });
                console.log("Favoriye eklendi:", recipeId);
                return { action: 'added' };
            }
        } catch (error) {
            console.error("Favori hatası:", error);
            return null;
        }
    },

    // 2. Herhangi Bir Listeye Ekle (Yeni Özellik)
    async addToList(listName, recipeId) {
        // Eğer liste adı 'favorites' ise yukarıdaki fonksiyonu kullan
        if (listName === 'favorites') {
            const result = await this.toggleFavorite(recipeId);
            return result && result.action === 'added';
        }

        const user = Auth.getCurrentUser();
        if (!user) return false;

        try {
            // Özel listeleri 'lists' adında bir harita (map) içinde tutalım
            const userRef = db.collection('users').doc(user.uid);
            const key = `customLists.${listName}`; // Örn: customLists.Kahvalti
            
            await userRef.update({
                [key]: firebase.firestore.FieldValue.arrayUnion(recipeId)
            });
            console.log(`${listName} listesine eklendi:`, recipeId);
            return true;
        } catch (error) {
            console.error("Listeye ekleme hatası:", error);
            // Eğer döküman yoksa hata verebilir, burada set ile oluşturmak gerekebilir
            return false;
        }
    },

    // 3. Yeni Liste Oluştur (EKSİKTİ, EKLENDİ)
    async createList(listName) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        try {
            const userRef = db.collection('users').doc(user.uid);
            // Boş bir liste oluştur
            const key = `customLists.${listName}`;
            
            // merge: true kullanarak diğer verileri silmeden güncelle
            await userRef.set({
                customLists: {
                    [listName]: []
                }
            }, { merge: true });
            
            console.log("Yeni liste oluşturuldu:", listName);
            return true;
        } catch (error) {
            console.error("Liste oluşturma hatası:", error);
            return false;
        }
    },

    // 4. Listeden Çıkar
    async removeFromList(listId, recipeId) {
        if (listId === 'favorites') {
            const result = await this.toggleFavorite(recipeId);
            return result && result.action === 'removed';
        }
        // Özel listeden silme mantığı buraya eklenebilir
        return false;
    },

    // 5. Favori Kontrolü
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
    
    // 6. Tüm Favorileri Getir (Sayfada göstermek için)
    async getFavorites() {
        const user = Auth.getCurrentUser();
        if (!user) return [];
        
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (!doc.exists) return [];
            
            return doc.data().favorites || [];
        } catch (error) {
            console.error("Favoriler getirilemedi:", error);
            return [];
        }
    }
};

// Global yap
window.Lists = Lists;
