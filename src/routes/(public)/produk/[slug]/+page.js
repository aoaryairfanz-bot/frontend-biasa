/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, setHeaders }) {
    const { slug } = params;
    const API_URL = `https://aryairfan-backendbiasa.hf.space/products/${slug}`;

    // Optimization 1: HTTP Caching Headers (SWR)
    // Memberitahu browser/CDN untuk menyimpan cache halaman ini selama 1 menit 
    // dan melakukan update di background jika sudah lewat (stale-while-revalidate).
    setHeaders({
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
    });

    try {
        const res = await fetch(API_URL);
        
        if (!res.ok) return { product: null };

        const product = await res.json();

        // Optimization 2: Pre-optimizing Image URLs
        // Kita modifikasi URL Cloudinary langsung di sini agar saat +page.svelte render, 
        // browser langsung mengunduh gambar versi ringan tanpa menunggu eksekusi JS di client.
        const optimize = (url, w = 800) => {
            if (!url || !url.includes("cloudinary.com")) return url;
            // q_auto: kualitas otomatis, f_auto: format terbaik (WebP/AVIF), w: lebar spesifik
            return url.replace("/upload/", `/upload/q_auto,f_auto,w_${w}/`);
        };

        if (product) {
            product.image_1_url = optimize(product.image_1_url, 800);
            product.image_2_url = optimize(product.image_2_url, 800);
            product.image_3_url = optimize(product.image_3_url, 800);
        }

        // Optimization 3: Minimal Data Transfer
        // Pastikan kita hanya mengirim objek yang dibutuhkan. 
        // Jika ada field besar di backend yang tidak dipakai, hapus di sini.
        return { 
            product,
            // Streamed data untuk "Related Products" (Opsional - SvelteKit Stream)
            // Jika backend mendukung, Anda bisa mengembalikan promise di sini untuk lazy loading
        };

    } catch (err) {
        // Silent error agar tidak merusak UI, cukup tampilkan produk null
        return { product: null };
    }
}