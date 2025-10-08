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

    // --- Fungsi Utama ---

    /**
     * Mengambil daftar domain dari file konfigurasi eksternal.
     * @returns {Promise<string[]|null>} Array of domains or null on failure.
     */
    async function getDomains() {
        try {
            // Ganti URL ini jika config.json berada di lokasi berbeda.
            // Tambahan `?t=${new Date().getTime()}` adalah untuk mencegah caching.
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
     * Memeriksa setiap domain untuk menemukan yang aktif.
     * @returns {Promise<string|null>} The first working domain URL or null if none are found.
     */
    async function checkDomainStatus() {
        const domains = await getDomains();
        if (!domains) {
            domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
            domainName.textContent = 'Config Error';
            launchButton.disabled = true;
            return null;
        }

        domainStatus.className = 'w-2 h-2 bg-yellow-500 rounded-full mr-2';
        domainName.textContent = 'Checking...';
        launchButton.disabled = true;

        for (const domain of domains) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                await fetch(domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                
                clearTimeout(timeoutId);
                
                domainStatus.className = 'w-2 h-2 bg-green-500 rounded-full mr-2';
                domainName.textContent = new URL(domain).hostname;
                launchButton.disabled = false; // Aktifkan tombol jika domain ditemukan
                return domain;
            } catch (error) {
                console.log(`Domain ${domain} failed:`, error.message);
                continue; // Coba domain berikutnya
            }
        }
        
        // Jika loop selesai tanpa menemukan domain
        domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
        domainName.textContent = 'Connection Failed';
        showNotification('Gagal terhubung ke server. Coba lagi nanti.', 'error');
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
                
                // Reset tombol setelah mencoba membuka link
                buttonText.textContent = 'Masuk Applikasi';
                buttonSpinner.classList.add('hidden');
                launchButton.disabled = false;
            }, 1500);
        } else {
            // Jika checkDomainStatus gagal lagi saat diklik
            buttonText.textContent = 'Masuk Applikasi';
            buttonSpinner.classList.add('hidden');
            // Tombol akan tetap disabled oleh checkDomainStatus
        }
    });

    // --- Inisialisasi & Pengecekan Berkala ---
    checkDomainStatus();
    setInterval(checkDomainStatus, 30000);
});