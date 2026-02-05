/**
 * Skeleton Loader - Yükleme animasyonları yöneticisi
 */

const SkeletonLoader = {
    // Grid için skeleton kartları oluştur
    showGridSkeleton(containerId, count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="recipe-card-skeleton">
                    <div class="skeleton skeleton-image skeleton-shimmer"></div>
                    <div class="skeleton-content">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton-meta">
                            <div class="skeleton skeleton-badge"></div>
                            <div class="skeleton skeleton-badge"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },

    // Malzeme listesi skeletonu
    showIngredientsSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '<p style="color: var(--color-text-secondary); font-style: italic; margin-bottom: 1rem;">Malzemeler yükleniyor...</p>';
        
        for (let i = 0; i < 6; i++) {
            html += `
                <div class="ingredient-skeleton">
                    <div class="skeleton skeleton-checkbox"></div>
                    <div class="skeleton skeleton-line"></div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },

    // İçerik skeletonu
    showContentSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-skeleton">
                <div class="skeleton" style="height: 40px; width: 70%; margin-bottom: 2rem;"></div>
                <div class="skeleton" style="height: 20px; width: 100%; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 20px; width: 90%; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 20px; width: 95%; margin-bottom: 2rem;"></div>
                
                <div class="skeleton" style="height: 32px; width: 50%; margin: 2rem 0 1rem;"></div>
                <div class="skeleton" style="height: 16px; width: 100%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 16px; width: 100%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 16px; width: 85%;"></div>
            </div>
        `;
    },

    // Skeleton'u kaldır ve içeriği göster
    hideSkeleton(containerId, contentHtml) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Fade out efekti
        const skeletons = container.querySelectorAll('.recipe-card-skeleton, .content-skeleton');
        skeletons.forEach(el => el.classList.add('skeleton-fade-out'));
        
        // Kısa gecikmeyle içeriği yükle
        setTimeout(() => {
            container.innerHTML = contentHtml;
        }, 300);
    },

    // Tüm skeleton'ları temizle
    clearAll() {
        document.querySelectorAll('.skeleton, [class*="skeleton-"]').forEach(el => {
            el.style.display = 'none';
        });
    }
};

// Export
window.SkeletonLoader = SkeletonLoader;
