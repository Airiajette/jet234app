// Include the DomainRotator class directly instead of loading from external file
class DomainRotator {
    constructor() {
        this.domains = [];
        this.loadDomains();
    }

    async loadDomains() {
        try {
            const response = await fetch('./domains.json');
            this.domains = await response.json();
            console.log('Loaded domains:', this.domains);
        } catch (error) {
            console.error('Failed to load domains:', error);
        }
    }

    async getWorkingDomain() {
        try {
            const response = await fetch('./server/proxy.php?action=get-working-domain');
            const data = await response.json();
            
            if (data.success) {
                return data.domain;
            } else {
                throw new Error(data.message || 'No working domain found');
            }
        } catch (error) {
            console.error('Failed to get working domain:', error);
            return null;
        }
    }
}