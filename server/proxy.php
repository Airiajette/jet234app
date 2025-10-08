<?php
// Aktifkan pelaporan error untuk debugging (HAPUS BARIS INI DI PRODUKSI)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set header untuk mengizinkan request dari mana saja (CORS)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Daftar domain yang akan dirotasi
 $domains = [
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

// Endpoint untuk mendapatkan domain yang berfungsi
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get-working-domain') {
    // Cek setiap domain untuk menemukan yang berfungsi
    $workingDomain = null;
    
    foreach ($domains as $domain) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5, // timeout 5 detik
                'method' => 'GET',
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"
            ]
        ]);
        
        // Gunakan @ untuk men-supress warning dan cek hasilnya
        $response = @file_get_contents($domain, false, $context);
        
        // Periksa apakah ada response dan tidak error
        if ($response !== false) {
            $workingDomain = $domain;
            break; // Keluar dari loop jika domain ditemukan
        }
    }
    
    if ($workingDomain) {
        echo json_encode(['success' => true, 'domain' => $workingDomain]);
    } else {
        // Kirim pesan error yang lebih jelas
        http_response_code(503); // Service Unavailable
        echo json_encode(['success' => false, 'message' => 'No working domains found after checking all options.']);
    }
    exit();
}

// Default response jika akses langsung atau endpoint tidak dikenal
echo json_encode(['message' => 'Domain Rotator API is running. Use ?action=get-working-domain to get a domain.']);
?>