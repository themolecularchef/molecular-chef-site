# Lezzet Yolculuğu - Yemek Tarifi Sitesi

Modern, minimalist ve SEO uyumlu bir yemek tarifi sitesi. JAMstack mimarisinde, statik hosting için optimize edilmiştir.

## Özellikler

- **Minimalist Tasarım**: Bol beyaz alan, zarif tipografi (Playfair Display + Inter)
- **Responsive**: Mobile-first yaklaşım, tüm cihazlarda kusursuz görünüm
- **Dark Mode**: Sistem tercihini dinleyen ve manuel toggle ile karanlık mod
- **Üyelik Sistemi**: LocalStorage tabanlı giriş/kayıt (şifreler base64 encoded)
- **Listeler**: Favoriler ve özel listeler oluşturma
- **Arama**: Gerçek zamanlı tarif arama ve filtreleme
- **Paylaşım**: Web Share API, WhatsApp, link kopyalama
- **Yazdırma**: Özel print.css ile optimize edilmiş yazdırma
- **SEO**: Semantic HTML, meta tags, URL parametreleri

## Dosya Yapısı

```
root/
├── index.html              # Ana sayfa (tarif grid)
├── auth.html               # Giriş/Kayıt sayfası
├── dashboard.html          # Kullanıcı paneli (listeler)
├── recipe.html             # Tarif detay şablonu
├── css/
│   ├── style.css           # Ana stiller
│   ├── components.css      # Bileşen stilleri
│   └── print.css           # Yazdırma stilleri
├── js/
│   ├── app.js              # Ana mantık (tema, toast, modal)
│   ├── auth.js             # Üyelik sistemi
│   ├── recipes.js          # Tarif verileri ve render
│   └── lists.js            # Liste yönetimi
├── content/
│   ├── recipes.json        # Tarif metadata
│   └── markdown/           # Tarif içerikleri (.md)
├── assets/
│   └── images/             # Yemek fotoğrafları
└── README.md               # Bu dosya
```

## Yeni Tarif Ekleme

### 1. Görsel Ekleme

- Tarif fotoğrafını `assets/images/` klasörüne kopyalayın
- Önerilen boyut: 1200x800px (4:3 oran)
- Format: WebP (daha iyi performans) veya JPG
- Dosya adı: kisa-tarif-adi.webp (boşluk yerine tire, Türkçe karakterler olmadan)

### 2. Markdown İçeriği Oluşturma

`content/markdown/` klasöründe yeni bir `.md` dosyası oluşturun:

```markdown
# Tarif Adı

## Malzemeler (X kişilik)

### Ana Malzemeler:
- 2 su bardağı un
- 1 adet yumurta
- ...

### Sos için:
- 3 yemek kaşığı zeytinyağı
- ...

## Adım Adım Hazırlık

### 1. Hazırlık Aşaması
Adım açıklaması buraya...

*(Neden: Açıklama parantezleriyle püf noktaları ekleyebilirsiniz)*

### 2. Pişirme
Diğer adım...

## Püf Noktaları

- **Önemli nokta:** Açıklama
- **Diğer ipucu:** Açıklama

Afiyet olsun!
```

### 3. Metadata Ekleme

`content/recipes.json` dosyasına yeni bir obje ekleyin:

```json
{
  "id": "benzersiz-tarif-id",
  "title": "Tarif Adı",
  "image": "assets/images/gorsel-dosya-adi.webp",
  "prepTime": "20 dk",
  "cookTime": "40 dk",
  "totalTime": "60 dk",
  "servings": 4,
  "difficulty": "Kolay|Orta|Zor",
  "category": "Kategori",
  "tags": ["etiket1", "etiket2", "etiket3"],
  "contentFile": "content/markdown/dosya-adi.md",
  "description": "Tarifin kısa açıklaması (SEO için)"
}
```

### 4. Kategoriler

Mevcut kategoriler:
- Et Yemekleri
- Tavuk Yemekleri
- Makarna
- Çorba
- Meze

Yeni kategori eklemek için:
1. `recipes.json`'a yeni kategori ile tarif ekleyin
2. `index.html`'deki filter butonlarına yeni kategoriyi ekleyin

## Deploy

### GitHub Pages

1. Repo'yu GitHub'a push edin
2. Settings > Pages > Source: Deploy from a branch
3. Branch: main, Folder: / (root)
4. Save'e tıklayın

### Cloud Cannon

1. Cloud Cannon hesabınıza giriş yapın
2. "Create Site" > "Upload Files"
3. Tüm dosyaları zipleyip yükleyin
4. Site ayarlarında build step'i devre dışı bırakın (statik dosyalar)

### Diğer Statik Hostlar

Netlify, Vercel, Surge.sh vb. platformlarda sadece dosyaları yükleyin. Build gerekmez.

## Teknik Detaylar

### Veri Saklama

Tüm kullanıcı verileri (üyelik, listeler) tarayıcının LocalStorage'ında saklanır:
- `users`: Kayıtlı kullanıcılar
- `currentUser`: Aktif kullanıcı ID
- `lists`: Kullanıcı listeleri
- `theme`: Tema tercihi

### Güvenlik Notu

Şifreler base64 ile encode edilir (görsel gizleme amaçlı). Bu bir güvenlik önlemi değildir. Gerçek bir üretim ortamında backend ve hash'li şifreleme kullanılmalıdır.

### SEO Optimizasyonu

- Semantic HTML5 etiketleri
- Meta description tags
- Open Graph tags (eklenebilir)
- URL yapısı: `recipe.html?id=tarif-adi`
- Lazy loading görseller

## Geliştirme

### Gereksinimler

- Modern bir web tarayıcısı
- Local server (isteğe bağlı): `python -m http.server 8000`

### Dosya Düzenleme

Tüm dosyalar düz metindir. Herhangi bir metin editörü ile düzenlenebilir:
- VS Code
- Sublime Text
- Notepad++
- Hatta Notepad bile :)

## Lisans

Bu proje MIT lisansı altında açık kaynak olarak paylaşılmıştır.

---

**Not:** Bu statik bir sitedir. Backend gerektirmez. Tüm veriler client-side (tarayıcıda) saklanır.
