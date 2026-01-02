// // src/routes/katalog/+page.js
// import { PUBLIC_API_URL } from '$env/static/public';

// export const load = async ({ fetch, url }) => {
//     // Ambil parameter URL untuk filter kategori aktif
//     const categoryParam = url.searchParams.get('cat'); 
    
//     // PERBAIKAN: Menggunakan PUBLIC_API_URL dari environment variable
//     const API_URL = `${PUBLIC_API_URL}/products/`;

//     /**
//      * FUNGSI HELPER: Optimasi URL Cloudinary
//      * Mengubah URL asli menjadi versi ringan (KB saja)
//      */
//     const optimizeUrl = (imageUrl, width = 500) => {
//         if (!imageUrl || !imageUrl.includes("cloudinary.com")) return imageUrl;
//         // Menyisipkan parameter q_auto (kualitas), f_auto (format), dan w (lebar)
//         return imageUrl.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
//     };

//     try {
//         const res = await fetch(API_URL);
//         const rawProducts = res.ok ? await res.json() : [];

//         // --- TRANSFORMASI DATA: Optimasi Gambar Produk ---
//         // Kita petakan ulang semua produk agar menggunakan gambar yang sudah dioptimasi
//         const products = rawProducts.map(p => ({
//             ...p,
//             // Gambar utama di katalog cukup 500px agar load sangat cepat di mobile
//             image_1_url: optimizeUrl(p.image_1_url, 500),
//             image_2_url: optimizeUrl(p.image_2_url, 500),
//             image_3_url: optimizeUrl(p.image_3_url, 500)
//         }));

//         return {
//             products,
//             activeTab: categoryParam || 'all' 
//         };
//     } catch (err) {
//         console.error("Gagal ambil produk:", err);
//         return { products: [], activeTab: 'all' };
//     }
// };

// SUPER CEPAT
// src/routes/(public)/katalog/+page.js

/** @type {import('./$types').PageLoad} */
export function load() {
    // KITA SENGAJA KOSONGKAN.
    // Tujuannya agar halaman TERBUKA DETIK ITU JUGA (Instant).
    // Data asli akan diambil oleh browser di file +page.svelte.
    return {
        products: [] 
    };
}