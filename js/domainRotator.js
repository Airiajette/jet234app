class DomainRotator {
    constructor() {
        this.domains = [];
        this.currentIndex = 0;
        this.loadDomains();
    }

    async loadDomains() {
        try {
            // Dalam implementasi nyata, ini akan mengambil dari server Anda
            const response = await fetch('./server/domains.json');
            this.domains = await response.json();
            console.log('Loaded domains:', this.domains);
        } catch (error) {
            console.error('Failed to load domains:', error);
            // Fallback ke domain default jika gagal
            this.domains = ['https://t.ly/jet234'];
        }
    }

    getCurrentDomain() {
        if (this.domains.length === 0) return null;
        return this.domains[this.currentIndex];
    }

    rotateDomain() {
        this.currentIndex = (this.currentIndex + 1) % this.domains.length;
        return this.getCurrentDomain();
    }

    async checkDomainStatus(domain) {
        try {
            const response = await fetch(`${domain}/api/status`, {
                method: 'GET',
                mode: 'no-cors', // Untuk menghindari CORS issues
                cache: 'no-cache'
            });
            return true; // Jika berhasil
        } catch (error) {
            console.error(`Domain ${domain} appears to be blocked:`, error);
            return false;
        }
    }

    async getWorkingDomain() {
        // Coba domain saat ini
        const currentDomain = this.getCurrentDomain();
        if (currentDomain && await this.checkDomainStatus(currentDomain)) {
            return currentDomain;
        }

        // Jika tidak berhasil, coba domain lainnya
        for (let i = 0; i < this.domains.length; i++) {
            this.rotateDomain();
            const domain = this.getCurrentDomain();
            if (await this.checkDomainStatus(domain)) {
                return domain;
            }
        }

        // Jika semua domain gagal
        throw new Error('All domains appear to be blocked');
    }
}

// Ekspor untuk digunakan di aplikasi
window.DomainRotator = DomainRotator;