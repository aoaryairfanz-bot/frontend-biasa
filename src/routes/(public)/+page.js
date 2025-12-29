// src/routes/+page.js

export const load = async ({ fetch }) => {
    const API_URL = "https://aryairfan-backendbiasa.hf.space";

    const [resBanner, resProduct] = await Promise.all([
        fetch(`${API_URL}/banners/`),
        fetch(`${API_URL}/products/`)
    ]);

    const bannersRaw = resBanner.ok ? await resBanner.json() : [];
    const allProductsRaw = resProduct.ok ? await resProduct.json() : [];

    /**
     * FUNGSI HELPER: Optimasi URL Cloudinary
     * q_auto: kualitas optimal otomatis
     * f_auto: format file paling ringan (WebP/Avif) otomatis
     * w_xxx : lebar gambar disesuaikan kebutuhan agar tidak overkill
     */
    const optimizeUrl = (url, width = 600) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        // Kita masukkan parameter optimasi setelah folder '/upload/'
        return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
    };

    // --- TRANSFORMASI DATA (Optimasi Gambar) ---

    // Optimasi gambar Banner (Biasanya butuh lebih lebar, misal 1000px)
    const banners = bannersRaw.map(b => ({
        ...b,
        image_url: optimizeUrl(b.image_url, 1000)
    }));

    // Optimasi semua produk (Gambar produk di katalog cukup 500px-600px)
    const allProducts = allProductsRaw.map(p => ({
        ...p,
        image_1_url: optimizeUrl(p.image_1_url, 600),
        image_2_url: optimizeUrl(p.image_2_url, 600),
        image_3_url: optimizeUrl(p.image_3_url, 600)
    }));

    // --- LOGIKA DATA ---

    const getDiscount = (p) => {
        if (!p.strike_price || p.strike_price <= p.price) return 0;
        return ((p.strike_price - p.price) / p.strike_price) * 100;
    };

    // 1. AMBIL SUB-CATEGORY
    const uniqueSubcategories = [...new Set(allProducts.map(p => p.subcategory || p.category || "Lainnya"))].slice(0, 10);

    // 2. PRODUK TERBARU
    const latestProducts = allProducts.slice(0, 10);

    // 3. BEST SELLER
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

    // 4. BEST PROMO
    const bestPromos = [...allProducts]
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