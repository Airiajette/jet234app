document.addEventListener('DOMContentLoaded', () => {
    // --- Seleksi Elemen DOM (Termasuk yang baru) ---
    const loadingScreen = document.getElementById('loadingScreen');
    const appContainer = document.getElementById('appContainer');
    const launchButton = document.getElementById('launchButton');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationText = document.getElementById('notificationText');
    const domainStatus = document.getElementById('domainStatus');
    const domainName = document.getElementById('domainName');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');

    // --- Inisialisasi Aplikasi ---
    try {
        if (typeof Telegram !== 'undefined') {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    } catch (e) {
        console.warn("Telegram Web App script not loaded or running outside Telegram.");
    }

    // --- Fungsi Bantuan ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Fungsi Utama ---
    async function getDomains() {
        try {
            const response = await fetch('./domains.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error('Failed to load domain configuration.');
            const config = await response.json();
            return config.domains;
        } catch (error) {
            console.error("Error fetching domain list:", error);
            showNotification('Gagal memuat konfigurasi domain.', 'error');
            return null;
        }
    }

    /**
     * Memeriksa setiap domain (dalam urutan acak) untuk menemukan yang aktif.
     * @returns {Promise<string|null>} The first active domain URL or null if none are found.
     */
    async function checkDomainStatus(isInitialCheck = true) {
        const domains = await getDomains();
        if (!domains) {
            if (isInitialCheck) showApp(); // Tetap tampilkan app meski error
            domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
            domainName.textContent = 'Config Error';
            launchButton.disabled = true;
            return null;
        }

        shuffleArray(domains);

        // Hanya tampilkan status "Mencari..." jika bukan pengecekan berkala
        if (isInitialCheck) {
            domainName.textContent = 'Mencari...';
        }
        launchButton.disabled = true;

        for (const domain of domains) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                await fetch(domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                
                console.log(`Domain aktif ditemukan: ${domain}`);
                domainStatus.className = 'w-2 h-2 bg-green-500 rounded-full mr-2';
                domainName.textContent = 'Aktif';
                launchButton.disabled = false;

                // Jika ini adalah pengecekan awal, tampilkan aplikasi
                if (isInitialCheck) {
                    showApp();
                }
                
                return domain;

            } catch (error) {
                console.log(`Domain ${domain} tidak dapat dijangkau.`);
                continue;
            }
        }
        
        // Jika loop selesai tanpa menemukan domain
        if (isInitialCheck) {
            showApp(); // Tetap tampilkan app agar user bisa coba lagi
            showNotification('Tidak dapat menemukan server yang aktif. Coba lagi nanti.', 'error');
        }
        domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
        domainName.textContent = 'Gagal Terhubung';
        launchButton.disabled = true;
        return null;
    }

    /**
     * Fungsi untuk menyembunyikan loading dan menampilkan aplikasi.
     */
    function showApp() {
        // Mulai transisi fade-out
        loadingScreen.style.opacity = '0';
        
        // Tunggu transisi selesai, lalu sembunyikan loading dan tampilkan app
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            appContainer.classList.remove('hidden');
        }, 500); // Durasi harus sama dengan CSS transition-duration
    }

    function showNotification(message, type = 'info') {
        notificationText.textContent = message;
        
        const typeClasses = {
            'error': 'font-bold text-red-400',
            'success': 'font-bold text-green-400',
            'info': 'font-bold text-cyan-400'
        };
        notificationTitle.className = typeClasses[type] || typeClasses['info'];
        
        notification.classList.remove('translate-x-[200%]', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
        
        setTimeout(() => {
            notification.classList.remove('translate-x-0', 'opacity-100');
            notification.classList.add('translate-x-[200%]', 'opacity-0');
        }, 3000);
    }

    // --- Event Listeners ---
    launchButton.addEventListener('click', async () => {
        buttonText.textContent = 'Connecting...';
        buttonSpinner.classList.remove('hidden');
        launchButton.disabled = true;
        
        // Panggil checkDomainStatus untuk pengecekan ulang saat tombol diklik
        const workingDomain = await checkDomainStatus(false); // false = bukan pengecekan awal
        
        if (workingDomain) {
            showNotification('Menyambungkan ke server...', 'success');
            setTimeout(() => {
                try {
                    if (typeof Telegram !== 'undefined' && Telegram.WebApp.openLink) {
                        Telegram.WebApp.openLink(workingDomain);
                    } else {
                        window.open(workingDomain, '_blank');
                    }
                } catch (e) {
                    console.error("Failed to open link:", e);
                    window.open(workingDomain, '_blank');
                }
                
                buttonText.textContent = 'Masuk Applikasi';
                buttonSpinner.classList.add('hidden');
                launchButton.disabled = false;
            }, 1500);
        } else {
            buttonText.textContent = 'Masuk Applikasi';
            buttonSpinner.classList.add('hidden');
        }
    });

    // --- Inisialisasi & Pengecekan Berkala ---
    // Jalankan pengecekan awal sekali saja
    checkDomainStatus(true); // true = ini adalah pengecekan awal
    
    // Jalankan pengecekan berkala setiap 30 detik, tanpa memicu ulang layar loading
    setInterval(() => checkDomainStatus(false), 30000);
});