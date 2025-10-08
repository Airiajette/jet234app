// Include the DomainRotator class directly instead of loading from external file
class DomainRotator {
    constructor() {
        // Sertakan domains langsung dalam kode
        this.domains = [
            'https://jet234.com',
            'https://jet234v.com',
            'https://jet234v.net',
            'https://j234.mom',
            'https://jit234.monster',
            'https://jt234.sbs',
            'https://jet234t.it.com',
            'https://jit234.icu',
            'https://jet234h.sbs',
            'https://jyt234.xyz',
            'https://j234.quest',
            'https://jet234q.it.com'
        ];
        console.log('Loaded domains:', this.domains);
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