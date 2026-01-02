// import { PUBLIC_API_URL } from '$env/static/public';

// /** @type {import('./$types').PageLoad} */
// export async function load({ fetch, params, setHeaders }) {
//     const { slug } = params;
    
//     // PERBAIKAN: Menggunakan PUBLIC_API_URL dari env variable
//     const API_URL = `${PUBLIC_API_URL}/products/${slug}`;

//     // Optimization 1: HTTP Caching Headers (SWR)
//     setHeaders({
//         'cache-control': 'public, max-age=60, stale-while-revalidate=300'
//     });

//     try {
//         const res = await fetch(API_URL);
        
//         if (!res.ok) return { product: null };

//         const product = await res.json();

//         // Optimization 2: Pre-optimizing Image URLs
//         const optimize = (url, w = 800) => {
//             if (!url || !url.includes("cloudinary.com")) return url;
//             return url.replace("/upload/", `/upload/q_auto,f_auto,w_${w}/`);
//         };

//         if (product) {
//             product.image_1_url = optimize(product.image_1_url, 800);
//             product.image_2_url = optimize(product.image_2_url, 800);
//             product.image_3_url = optimize(product.image_3_url, 800);
//         }

//         // Optimization 3: Minimal Data Transfer
//         return { 
//             product
//         };

//     } catch (err) {
//         return { product: null };
//     }
// }


// SUPER CEPAT TAPI GA BISA AMBIL META TAG DINAMIS
// /** @type {import('./$types').PageLoad} */
// export function load({ params }) {
//     // KITA HAPUS FETCH DI SINI.
//     // Return slug saja agar halaman langsung terbuka INSTAN.
//     // Data produk akan diambil oleh +page.svelte di browser.
//     return {
//         slug: params.slug,
//         product: null // Placeholder awal
//     };
// }

import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, setHeaders }) {
    const { slug } = params;

    // KUNCI KECEPATAN 1: Caching
    // Browser akan mengingat data ini selama 5 menit. 
    // Jika user bolak-balik produk, load-nya 0 detik.
    setHeaders({
        'cache-control': 'public, max-age=300, stale-while-revalidate=600'
    });

    try {
        const res = await fetch(`${PUBLIC_API_URL}/products/${slug}`);
        if (res.ok) {
            const product = await res.json();
            
            // Helper Optimasi Gambar untuk Meta Tag
            const optimize = (url) => {
                if (!url || !url.includes("cloudinary.com")) return url;
                return url.replace("/upload/", "/upload/f_auto,q_auto,w_600/");
            };

            if (product) {
                // Siapkan gambar untuk Meta Tag (OG Image)
                product.image_1_url = optimize(product.image_1_url);
                product.image_2_url = optimize(product.image_2_url);
                product.image_3_url = optimize(product.image_3_url);
            }

            return { product, slug };
        }
    } catch (err) {
        console.error("Error load produk:", err);
    }

    return { product: null, slug };
}