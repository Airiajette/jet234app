class DomainRotator {
    constructor() {
        // Sertakan domains langsung dalam kode untuk menghindari masalah loading file
        this.domains = [
            'https://jet234.com/register/4D38B453',
            'https://jet234v.com/register/4D38B453',
            'https://jet234v.net/register/4D38B453',
            'https://j234.mom/register/4D38B453',
            'https://jit234.monster/register/4D38B453',
            'https://jt234.sbs/register/4D38B453',
            'https://jet234t.it.com/register/4D38B453',
            'https://jit234.icu/register/4D38B453',
            'https://jet234h.sbs/register/4D38B453',
            'https://jyt234.xyz/register/4D38B453',
            'https://j234.quest/register/4D38B453',
            'https://jet234q.it.com/register/4D38B453'
        ];
        console.log('Loaded domains:', this.domains);
    }

    async getWorkingDomain() {
        try {
            // Coba setiap domain untuk menemukan yang berfungsi
            for (const domain of this.domains) {
                try {
                    // Gunakan fetch dengan timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch(domain, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // Jika kita sampai di sini, domain dapat diakses
                    console.log(`Domain ${domain} is reachable`);
                    return domain;
                } catch (error) {
                    console.log(`Domain ${domain} failed:`, error.message);
                    continue;
                }
            }
            
            throw new Error('No working domains found');
        } catch (error) {
            console.error('Failed to get working domain:', error);
            return null;
        }
    }
}