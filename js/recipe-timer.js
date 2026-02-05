/**
 * Recipe Timer - Tarif içi zamanlayıcılar
 */

const RecipeTimer = {
    activeTimers: {},

    // Tarif içindeki süreleri otomatik tespit et ve buton ekle
    init() {
        this.scanForTimes();
        this.createTimerModal();
    },

    // Metin içindeki süreleri bul (örn: "30 dakika", "15 dk")
    scanForTimes() {
        const content = document.querySelector('.instructions-content');
        if (!content) return;

        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            // Süre pattern'larını bul: "30 dk", "15 dakika", "1.5 saat", "45-50 dk"
            const timeRegex = /(\d+)[-\s]*(\d*)\s*(dk|dakika|saat|sa|min|minute)/gi;
            
            let match;
            let newText = text;
            const replacements = [];

            while ((match = timeRegex.exec(text)) !== null) {
                const fullMatch = match[0];
                const minutes = this.parseTime(match);
                
                replacements.push({
                    match: fullMatch,
                    minutes: minutes
                });
            }

            // Eğer süre bulunduysa, span ile sarmala
            if (replacements.length > 0) {
                const parent = textNode.parentNode;
                if (parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
                    let html = text;
                    replacements.forEach(rep => {
                        html = html.replace(
                            rep.match,
                            `<span class="timer-trigger" data-minutes="${rep.minutes}" onclick="RecipeTimer.openModal(${rep.minutes}, '${rep.match}')" style="background: var(--color-accent-light); color: var(--color-accent); padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 500; border-bottom: 1px dashed var(--color-accent);">
                                ⏱️ ${rep.match}
                            </span>`
                        );
                    });
                    
                    if (parent.innerHTML) {
                        parent.innerHTML = parent.innerHTML.replace(text, html);
                    }
                }
            }
        });
    },

    // Süreyi dakikaya çevir
    parseTime(match) {
        const num1 = parseInt(match[1]);
        const num2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();
        
        let minutes = num1;
        
        if (unit.includes('sa')) {
            minutes = num1 * 60;
            if (num2) minutes += num2;
        } else {
            // Eğer "45-50 dk" gibi aralık varsa ortasını al
            if (num2) {
                minutes = Math.floor((num1 + num2) / 2);
            }
        }
        
        return minutes;
    },

    // Zamanlayıcı modal'ını oluştur
    createTimerModal() {
        if (document.getElementById('timerModal')) return;

        const modal = document.createElement('div');
        modal.id = 'timerModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="RecipeTimer.closeModal()"></div>
            <div class="modal-content modal-sm" style="text-align: center;">
                <button class="modal-close" onclick="RecipeTimer.closeModal()">×</button>
                <div class="modal-header">
                    <h3 class="modal-title">⏱️ Zamanlayıcı</h3>
                </div>
                <div class="modal-body">
                    <div id="timerDisplay" style="font-size: 4rem; font-weight: 600; color: var(--color-accent); font-family: monospace; margin: 2rem 0;">
                        00:00
                    </div>
                    <div id="timerLabel" style="font-size: 1.1rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                        Hazırlanıyor...
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="timerToggleBtn" class="btn btn-primary" onclick="RecipeTimer.toggleTimer()" style="min-width: 120px;">
                            Başlat
                        </button>
                        <button class="btn btn-ghost" onclick="RecipeTimer.resetTimer()">
                            Sıfırla
                        </button>
                    </div>
                    <div style="margin-top: 1.5rem; font-size: 0.875rem; color: var(--color-text-muted);">
                        💡 Tarayıcı sekmesini kapatsanız bile zamanlayıcı çalışmaya devam eder
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // CSS ekle
        const style = document.createElement('style');
        style.textContent = `
            .timer-trigger:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .timer-active #timerDisplay {
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    },

    // Modal'ı aç
    openModal(minutes, label) {
        this.currentMinutes = minutes;
        this.currentLabel = label;
        this.remainingSeconds = minutes * 60;
        this.isRunning = false;
        
        document.getElementById('timerLabel').textContent = label;
        this.updateDisplay();
        
        const modal = document.getElementById('timerModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Butonu sıfırla
        const btn = document.getElementById('timerToggleBtn');
        btn.textContent = 'Başlat';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        modal.classList.remove('timer-active');
    },

    // Modal'ı kapat
    closeModal() {
        const modal = document.getElementById('timerModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.pauseTimer();
    },

    // Zamanlayıcıyı başlat/durdur
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        this.isRunning = true;
        const btn = document.getElementById('timerToggleBtn');
        btn.textContent = 'Durdur';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        document.getElementById('timerModal').classList.add('timer-active');
        
        this.interval = setInterval(() => {
            this.remainingSeconds--;
            this.updateDisplay();
            
            if (this.remainingSeconds <= 0) {
                this.timerComplete();
            }
        }, 1000);
        
        // Başlığı güncelle (sekmede görünsün)
        this.originalTitle = document.title;
    },

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.interval);
        const btn = document.getElementById('timerToggleBtn');
        btn.textContent = 'Devam Et';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        document.getElementById('timerModal').classList.remove('timer-active');
    },

    resetTimer() {
        this.pauseTimer();
        this.remainingSeconds = this.currentMinutes * 60;
        this.updateDisplay();
        const btn = document.getElementById('timerToggleBtn');
        btn.textContent = 'Başlat';
    },

    updateDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = display;
        
        // Sekme başlığını güncelle
        if (this.isRunning) {
            document.title = `⏱️ ${display} - ${this.currentLabel}`;
        } else {
            document.title = this.originalTitle || 'Tarif';
        }
    },

    timerComplete() {
        this.pauseTimer();
        document.getElementById('timerDisplay').textContent = '00:00';
        
        // Bildirim gönder
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏱️ Zaman Doldu!', {
                body: `${this.currentLabel} tamamlandı!`,
                icon: 'assets/images/Logo.png'
            });
        } else {
            alert(`⏱️ ${this.currentLabel} tamamlandı!`);
        }
        
        // Ses çal (isteğe bağlı)
        this.playBeep();
        
        document.title = this.originalTitle || 'Tarif';
    },

    playBeep() {
        try {
            const audio = new AudioContext();
            const oscillator = audio.createOscillator();
            const gainNode = audio.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audio.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);
            
            oscillator.start(audio.currentTime);
            oscillator.stop(audio.currentTime + 0.5);
        } catch (e) {
            console.log('Ses çalınamadı:', e);
        }
    }
};

// Bildirim izni iste
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Global erişim
window.RecipeTimer = RecipeTimer;
