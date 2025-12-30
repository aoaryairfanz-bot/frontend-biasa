import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, setHeaders }) {
    const { slug } = params;
    
    // PERBAIKAN: Menggunakan PUBLIC_API_URL dari env variable
    const API_URL = `${PUBLIC_API_URL}/products/${slug}`;

    // Optimization 1: HTTP Caching Headers (SWR)
    setHeaders({
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
    });

    try {
        const res = await fetch(API_URL);
        
        if (!res.ok) return { product: null };

        const product = await res.json();

        // Optimization 2: Pre-optimizing Image URLs
        const optimize = (url, w = 800) => {
            if (!url || !url.includes("cloudinary.com")) return url;
            return url.replace("/upload/", `/upload/q_auto,f_auto,w_${w}/`);
        };

        if (product) {
            product.image_1_url = optimize(product.image_1_url, 800);
            product.image_2_url = optimize(product.image_2_url, 800);
            product.image_3_url = optimize(product.image_3_url, 800);
        }

        // Optimization 3: Minimal Data Transfer
        return { 
            product
        };

    } catch (err) {
        return { product: null };
    }
}