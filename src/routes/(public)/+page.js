// D:\1_GARAPAN\narwastu\frontend_svelte\src\routes\(public)\+page.js
import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export const load = async ({ fetch }) => {
    // PUBLIC_API_URL akan diambil dari .env (lokal) atau Dashboard Cloudflare (saat deploy)
    const API_URL = PUBLIC_API_URL;

    // Fetch data secara parallel agar loading halaman sangat kencang
    const [resBanner, resProduct] = await Promise.all([
        fetch(`${API_URL}/banners/`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/products/`).catch(() => ({ ok: false }))
    ]);

    const bannersRaw = resBanner.ok ? await resBanner.json() : [];
    const allProductsRaw = resProduct.ok ? await resProduct.json() : [];

    /**
     * FUNGSI HELPER: Optimasi URL Cloudinary
     * f_auto,q_auto: memastikan gambar ringan dan jernih otomatis
     */
    const optimizeUrl = (url, width = 600) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
    };

    // --- TRANSFORMASI DATA ---

    // Banner (Resolusi Tinggi 1200px)
    const banners = bannersRaw.map(b => ({
        ...b,
        image_url: optimizeUrl(b.image_url, 1200)
    }));

    // Produk (Resolusi 400px - Optimal untuk Grid Mobile & Desktop)
    const allProducts = allProductsRaw.map(p => ({
        ...p,
        image_1_url: optimizeUrl(p.image_1_url, 400),
        image_2_url: optimizeUrl(p.image_2_url, 400),
        image_3_url: optimizeUrl(p.image_3_url, 400)
    }));

    // --- LOGIKA FILTERING DATA ---

    const getDiscount = (p) => {
        if (!p.strike_price || p.strike_price <= p.price) return 0;
        return ((p.strike_price - p.price) / p.strike_price) * 100;
    };

    // 1. AMBIL SUB-CATEGORY (Raw list)
    const uniqueSubcategories = allProducts.map(p => p.subcategory || p.category || "Lainnya");

    // 2. PRODUK TERBARU (10 item teratas)
    const latestProducts = allProducts.slice(0, 10);

    // 3. BEST SELLER (Logika per subkategori unik)
    const bestSellers = [];
    const processedSubs = new Set();
    const sortedByPrice = [...allProducts].sort((a, b) => b.price - a.price);

    for (const p of sortedByPrice) {
        const sub = p.subcategory || p.category || "Lainnya";
        if (!processedSubs.has(sub)) {
            bestSellers.push(p);
            processedSubs.add(sub);
        }
        if (bestSellers.length >= 10) break;
    }

    // 4. BEST PROMO (Urutkan dari diskon terbesar)
    const bestPromos = allProducts
        .filter(p => p.strike_price > p.price)
        .sort((a, b) => getDiscount(b) - getDiscount(a))
        .slice(0, 10);

    return {
        banners,
        subcategories: uniqueSubcategories,
        latestProducts,
        bestSellers,
        bestPromos
    };
};