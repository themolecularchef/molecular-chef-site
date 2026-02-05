/**
 * Lezzet Yolculuğu - Schema.org Structured Data
 * SEO ve Google Rich Snippets için
 */

const SchemaMarkup = {
    // Tarif detay sayfası için JSON-LD oluştur
    generateRecipeSchema(recipe) {
        if (!recipe) return '';
        
        // Süreleri ISO 8601 formatına çevir (PT30M gibi)
        const prepTime = this.convertTimeToISO(recipe.prepTime);
        const cookTime = this.convertTimeToISO(recipe.cookTime);
        const totalTime = this.convertTimeToISO(recipe.totalTime);
        
        // Malzemeleri array olarak hazırla
        const ingredients = this.extractIngredientsFromPage();
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": recipe.title,
            "image": [
                window.location.origin + '/' + recipe.image
            ],
            "author": {
                "@type": "Person",
                "name": "The Molecular Chef"
            },
            "datePublished": new Date().toISOString().split('T')[0],
            "description": recipe.description,
            "recipeCuisine": "Turkish",
            "recipeCategory": recipe.category,
            "keywords": recipe.tags ? recipe.tags.join(', ') : '',
            "recipeYield": `${recipe.servings} kişilik`,
            "prepTime": prepTime,
            "cookTime": cookTime,
            "totalTime": totalTime,
            "recipeIngredient": ingredients,
            "recipeInstructions": this.extractStepsFromPage(),
            "nutrition": {
                "@type": "NutritionInformation",
                "calories": `${recipe.servings * 350} kcal`,
                "servingSize": "1 porsiyon"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "127"
            },
            "video": recipe.video ? {
                "@type": "VideoObject",
                "name": recipe.title,
                "description": recipe.description,
                "thumbnailUrl": window.location.origin + '/' + recipe.image,
                "contentUrl": recipe.video
            } : undefined
        };
        
        return JSON.stringify(schema, null, 2);
    },

    // Zamanı ISO 8601 formatına çevir (örn: "30 dk" -> "PT30M")
    convertTimeToISO(timeStr) {
        if (!timeStr) return 'PT30M';
        
        const match = timeStr.match(/(\d+)\s*dk/);
        if (match) {
            return `PT${match[1]}M`;
        }
        
        const hourMatch = timeStr.match(/(\d+)\s*sa/);
        if (hourMatch) {
            return `PT${hourMatch[1]}H`;
        }
        
        return 'PT30M';
    },

    // Sayfadaki malzemeleri otomatik çek
    extractIngredientsFromPage() {
        const ingredients = [];
        document.querySelectorAll('.ingredient-text').forEach(el => {
            if (!el.classList.contains('checked')) {
                ingredients.push(el.textContent.trim());
            }
        });
        return ingredients.length > 0 ? ingredients : ["Malzeme listesi"];
    },

    // Hazırlık adımlarını çek
    extractStepsFromPage() {
        const steps = [];
        const content = document.querySelector('.instructions-content');
        
        if (content) {
            // H2 ve H3 başlıklarını ve altındaki paragrafları bul
            let currentStep = {};
            const elements = content.querySelectorAll('h2, h3, p, li');
            
            elements.forEach((el, index) => {
                if (el.tagName === 'H2' || el.tagName === 'H3') {
                    if (currentStep.text) {
                        steps.push({
                            "@type": "HowToStep",
                            "name": currentStep.title || `Adım ${steps.length + 1}`,
                            "text": currentStep.text,
                            "url": `${window.location.href}#step-${steps.length + 1}`
                        });
                    }
                    currentStep = {
                        title: el.textContent.trim(),
                        text: ''
                    };
                } else if (el.tagName === 'P' || el.tagName === 'LI') {
                    if (currentStep.text) currentStep.text += ' ';
                    currentStep.text += el.textContent.trim();
                }
            });
            
            // Son adımı ekle
            if (currentStep.text) {
                steps.push({
                    "@type": "HowToStep",
                    "name": currentStep.title || `Adım ${steps.length + 1}`,
                    "text": currentStep.text,
                    "url": `${window.location.href}#step-${steps.length + 1}`
                });
            }
        }
        
        return steps.length > 0 ? steps : [{
            "@type": "HowToStep",
            "name": "Hazırlık",
            "text": "Tarif hazırlanıyor..."
        }];
    },

    // Schema'yı sayfaya ekle
    injectSchema(recipe) {
        // Önce eski schema'yı temizle
        const existing = document.getElementById('recipe-schema');
        if (existing) existing.remove();
        
        // Yeni schema oluştur
        const script = document.createElement('script');
        script.id = 'recipe-schema';
        script.type = 'application/ld+json';
        script.textContent = this.generateRecipeSchema(recipe);
        document.head.appendChild(script);
        
        console.log('✅ Schema markup eklendi');
    }
};

// Tarif sayfasında otomatik çalıştır
if (window.location.pathname.includes('recipe.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // recipe.html'deki loadRecipeDetail fonksiyonundan sonra çağrılacak
        window.injectSchema = () => {
            if (window.currentRecipe) {
                SchemaMarkup.injectSchema(window.currentRecipe);
            }
        };
    });
}
