document.addEventListener('DOMContentLoaded', () => {
    // --- Inisialisasi Aplikasi ---
    try {
        if (typeof Telegram !== 'undefined') {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    } catch (e) {
        console.warn("Telegram Web App script not loaded or running outside Telegram.");
    }

    // --- Seleksi Elemen DOM ---
    const launchButton = document.getElementById('launchButton');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationText = document.getElementById('notificationText');
    const domainStatus = document.getElementById('domainStatus');
    const domainName = document.getElementById('domainName');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');

    // --- Fungsi Bantuan ---

    /**
     * MEMBARU: Acak urutan elemen dalam sebuah array (algoritma Fisher-Yates).
     * @param {Array} array - Array yang akan diacak.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Fungsi Utama ---

    /**
     * Mengambil daftar domain dari file konfigurasi eksternal.
     * @returns {Promise<string[]|null>} Array of domains or null on failure.
     */
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
     * Memeriksa apakah sebuah domain diblokir oleh TrustPositif.
     * @param {string} domainUrl - URL domain yang akan diperiksa.
     * @returns {Promise<boolean>} True jika diblokir, false jika tidak.
     */
    async function isBlockedByTrustpositif(domainUrl) {
        const apiKey = '9e98e4bc9a2a9a4f5c2b8f7e6d1a5c3b'; 
        const apiUrl = 'https://trustpositif.komdigi.go.id/Rest_server/getstatusname';
        
        try {
            const hostname = new URL(domainUrl).hostname;
            const params = new URLSearchParams({ name: hostname, key: apiKey });
            
            const response = await fetch(`${apiUrl}?${params.toString()}`);
            if (!response.ok) {
                console.warn(`TrustPositif API error for ${hostname}: ${response.statusText}`);
                return false; 
            }
            
            const data = await response.json();
            console.log(`TrustPositif check for ${hostname}: ${data.status}`);
            return data.status === 'positif';
        } catch (error) {
            console.error(`Error checking TrustPositif for ${domainUrl}:`, error);
            return false;
        }
    }

    /**
     * Memeriksa setiap domain (dalam urutan acak) untuk menemukan yang aktif dan tidak diblokir.
     * @returns {Promise<string|null>} The first working and unblocked domain URL or null if none are found.
     */
    async function checkDomainStatus() {
        const domains = await getDomains();
        if (!domains) {
            domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
            domainName.textContent = 'Config Error';
            launchButton.disabled = true;
            return null;
        }

        // --- PERUBAHAN DI SINI ---
        // Acak urutan domain setiap kali fungsi ini dipanggil.
        // Ini membantu mendistribusikan beban dan menghindari pengecekan urutan yang sama terus-menerus.
        shuffleArray(domains);
        // --- AKHIR PERUBAHAN ---

        domainStatus.className = 'w-2 h-2 bg-yellow-500 rounded-full mr-2';
        domainName.textContent = 'Checking...';
        launchButton.disabled = true;

        for (const domain of domains) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                await fetch(domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                
                console.log(`Domain ${domain} is reachable. Checking TrustPositif...`);

                const blocked = await isBlockedByTrustpositif(domain);
                
                if (blocked) {
                    console.log(`Domain ${domain} is BLOCKED by TrustPositif. Trying next...`);
                    continue;
                }

                domainStatus.className = 'w-2 h-2 bg-green-500 rounded-full mr-2';
                domainName.textContent = new URL(domain).hostname;
                launchButton.disabled = false;
                return domain;

            } catch (error) {
                console.log(`Domain ${domain} failed (unreachable):`, error.message);
                continue;
            }
        }
        
        domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
        domainName.textContent = 'No Working Domain';
        showNotification('Tidak ada domain yang tersedia dan tidak diblokir. Coba lagi nanti.', 'error');
        launchButton.disabled = true;
        return null;
    }

    /**
     * Menampilkan notifikasi popup.
     * @param {string} message - Pesan yang akan ditampilkan.
     * @param {'info'|'success'|'error'} type - Jenis notifikasi.
     */
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
        
        const workingDomain = await checkDomainStatus();
        
        if (workingDomain) {
            showNotification('Menyambungkan ke ' + new URL(workingDomain).hostname + '...', 'success');
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
    checkDomainStatus();
    setInterval(checkDomainStatus, 30000);
});