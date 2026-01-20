/** @type {import('./$types').PageLoad} */
export function load() {
    // KITA RETURN KOSONG AGAR NAVIGASI INSTANT
    // Data akan diambil oleh +page.svelte di browser
    return {
        banners: [],
        latestProducts: [],
        bestSellers: [],
        bestPromos: [],
        subcategories: []
    };
}