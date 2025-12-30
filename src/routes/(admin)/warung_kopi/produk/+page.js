import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    // 1. Gunakan URL dari Environment Variable Cloudflare
    const API_BASE = PUBLIC_API_URL;

    // 2. Logika ini hanya boleh jalan di Browser (Client-Side)
    if (browser) {
        const token = localStorage.getItem("token");

        if (!token) {
            throw redirect(302, '/login');
        }

        try {
            const res = await fetch(`${API_BASE}/products/`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                const products = await res.json();
                return { products };
            } else {
                // Jika token tidak valid (401), arahkan balik ke login
                if (res.status === 401) {
                    localStorage.removeItem("token");
                    throw redirect(302, '/login');
                }
                return { products: [] }; 
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            return { products: [] };
        }
    }

    // 3. Jika sedang dijalankan di Server (SSR), kembalikan data kosong dulu
    return { products: [] };
}