// import { PUBLIC_API_URL } from '$env/static/public';

// /** @type {import('./$types').PageLoad} */
// export async function load({ params, fetch, setHeaders }) {
//     const { slug } = params;

//     // KUNCI KECEPATAN 1: Caching
//     // Browser akan mengingat data JSON ini selama 5 menit.
//     // Jika user kembali ke produk yang sama, tidak perlu fetch ulang ke API.
//     setHeaders({
//         'cache-control': 'public, max-age=300, stale-while-revalidate=600'
//     });

//     try {
//         const res = await fetch(`${PUBLIC_API_URL}/products/${slug}`);
        
//         if (res.ok) {
//             const product = await res.json();
            
//             // PERBAIKAN: HAPUS LOGIKA KOMPRESI
//             // Sekarang URL dikirim apa adanya (Original) ke halaman.
//             // Tidak ada lagi proses manipulasi string atau resize di sini.
            
//             return { product, slug };
//         }
//     } catch (err) {
//         console.error("Error load produk:", err);
//     }

//     return { product: null, slug };
// }


import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, setHeaders }) {
    const { slug } = params;

    // Cache Browser: Data disimpan 5 menit. 
    // Jika user klik produk yg sama, INSTANT 0 detik.
    setHeaders({
        'cache-control': 'public, max-age=300'
    });

    try {
        const res = await fetch(`${PUBLIC_API_URL}/products/${slug}`);
        if (res.ok) {
            const product = await res.json();
            return { product, slug }; // Data dikirim ke .svelte sudah matang
        }
    } catch (err) {
        console.error("Gagal load produk:", err);
    }

    return { product: null, slug };
}