
// /** @type {import('./$types').PageLoad} */
// export function load() {
//     // KITA SENGAJA KOSONGKAN.
//     // Tujuannya agar halaman TERBUKA DETIK ITU JUGA (Instant).
//     // Data asli akan diambil oleh browser di file +page.svelte.
//     return {
//         products: [] 
//     };
// }

import { PUBLIC_API_URL } from '$env/static/public';

export async function load({ fetch }) {
    // SvelteKit akan melakukan fetch ini di server/background
    const res = await fetch(`${PUBLIC_API_URL}/products/`);
    const data = await res.json();
    
    // Kembalikan data agar bisa dipakai di +page.svelte
    return {
        products: data.products || data.data || data || []
    };
}