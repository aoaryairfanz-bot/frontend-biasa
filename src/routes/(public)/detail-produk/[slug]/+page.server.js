import { PUBLIC_API_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, request, fetch }) {
    const { slug } = params;

    // 1. Ambil data produk murni dari FastAPI Backend
    // Ganti baris 9 menjadi seperti ini, Baginda:
    const res = await fetch(`${PUBLIC_API_URL}/products/${slug}`);
    if (!res.ok) {
        throw error(404, { message: 'Produk tidak ditemukan di katalog Narwastu' });
    }
    const product = await res.json();

    // 2. DETEKSI GEOLOKASI (Cloudflare Headers Integration)
    const country = request.headers.get('cf-ipcountry') || 'ID';
    const regionName = request.headers.get('cf-region') || ''; 
    const cityName = request.headers.get('cf-city') || ''; 

    // 3. PEMETAAN STRATEGIS ZONA (STANDAR ANDI PUBLISHER)
    let detectedZone = 1; // Default fallback ke Jawa

    if (country !== 'ID') {
        // [WAR PSYCHOLOGY] Masuk perang perang psikologis jika pakai VPN luar negeri!
        detectedZone = 10;
    } else {
        const region = regionName.toLowerCase();
        const city = cityName.toLowerCase();

        // --- ZONA 3 (Maluku, Papua, NTT, NTB Luar) ---
        if (
            region.includes('maluku') || 
            region.includes('papua') || 
            region.includes('nusa tenggara timur') || 
            region.includes('ntt')
        ) {
            detectedZone = 3;
        }
        // --- ZONA 2 (Aceh, Medan, Pekanbaru, Padang, Batam, Kalimantan, Sulawesi) ---
        else if (
            region.includes('aceh') || 
            region.includes('sumatera utara') || region.includes('medan') ||
            region.includes('riau') || region.includes('pekanbaru') || region.includes('batam') ||
            region.includes('sumatera barat') || region.includes('padang') ||
            region.includes('kalimantan') || 
            region.includes('sulawesi') ||
            region.includes('gorontalo')
        ) {
            detectedZone = 2;
        }
        // --- ZONA 1 (Jawa, Bali, NTB Utama, Lampung, Palembang) ---
        else if (
            region.includes('jawa') || 
            region.includes('jakarta') || 
            region.includes('yogyakarta') || 
            region.includes('bali') || 
            region.includes('lampung') || 
            region.includes('sumatera selatan') || region.includes('palembang') ||
            region.includes('nusa tenggara barat') || region.includes('ntb')
        ) {
            detectedZone = 1;
        }
    }

    return {
        product,
        detectedZone,
        locationInfo: { country, cityName, regionName }
    };
}