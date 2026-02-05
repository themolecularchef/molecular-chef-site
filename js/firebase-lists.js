// Firebase Lists (Favorites ve Özel Listeler - GÜNCEL VERSİYON)
const Lists = {
    // Favori Ekle/Çıkar
    async toggleFavorite(recipeId) {
        const user = firebase.auth().currentUser;
        if (!user) return { action: 'error', message: 'Giriş yapmalısınız' };

        try {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();

            // Kullanıcı yoksa oluştur
            if (!doc.exists) {
                await userRef.set({ favorites: [recipeId], lists: [] });
                return { action: 'added' };
            }

            const favorites = doc.data().favorites || [];

            if (favorites.includes(recipeId)) {
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(recipeId)
                });
                return { action: 'removed' };
            } else {
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayUnion(recipeId)
                });
                return { action: 'added' };
            }
        } catch (error) {
            console.error("Favori hatası:", error);
            return { action: 'error' };
        }
    },

    // Yeni Liste Oluştur (DİĞER SAYFALARLA UYUMLU FORMAT)
    async createList(listName) {
        const user = firebase.auth().currentUser;
        if (!user) return false;

        const newList = {
            id: 'list_' + Date.now(),
            name: listName,
            recipes: [],
            createdAt: new Date().toISOString()
        };

        try {
            await db.collection('users').doc(user.uid).update({
                lists: firebase.firestore.FieldValue.arrayUnion(newList)
            });
            console.log("Liste oluşturuldu:", listName);
            return true;
        } catch (error) {
            // Eğer lists alanı yoksa, dökümanı set etmeyi dene
            try {
                await db.collection('users').doc(user.uid).set({
                    lists: [newList]
                }, { merge: true });
                return true;
            } catch (err) {
                console.error("Liste oluşturma hatası:", err);
                return false;
            }
        }
    }
};

window.Lists = Lists;
