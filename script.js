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
     * Acak urutan elemen dalam sebuah array (algoritma Fisher-Yates).
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
     * Memeriksa setiap domain (dalam urutan acak) untuk menemukan yang aktif.
     * @returns {Promise<string|null>} The first active domain URL or null if none are found.
     */
    async function checkDomainStatus() {
        const domains = await getDomains();
        if (!domains) {
            domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
            domainName.textContent = 'Config Error';
            launchButton.disabled = true;
            return null;
        }

        // Acak urutan domain untuk mendistribusikan beban
        shuffleArray(domains);

        domainStatus.className = 'w-2 h-2 bg-yellow-500 rounded-full mr-2';
        domainName.textContent = 'Mencari...';
        launchButton.disabled = true;

        for (const domain of domains) {
            try {
                // Cek apakah domain bisa dijangkau
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout 3 detik
                
                await fetch(domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                
                // Jika berhasil, domain ini adalah yang kita cari
                console.log(`Domain aktif ditemukan: ${domain}`);
                domainStatus.className = 'w-2 h-2 bg-green-500 rounded-full mr-2';
                domainName.textContent = 'Aktif'; // Teks status diubah menjadi generik
                launchButton.disabled = false;
                return domain;

            } catch (error) {
                // Jika gagal, lanjut ke domain berikutnya
                console.log(`Domain ${domain} tidak dapat dijangkau.`);
                continue;
            }
        }
        
        // Jika loop selesai tanpa menemukan domain yang aktif
        domainStatus.className = 'w-2 h-2 bg-red-500 rounded-full mr-2';
        domainName.textContent = 'Gagal Terhubung'; // Teks status diubah menjadi generik
        showNotification('Tidak dapat menemukan server yang aktif. Coba lagi nanti.', 'error');
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