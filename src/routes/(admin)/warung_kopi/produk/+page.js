import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    // 1. Ambil URL dari Environment Variable
    const API_BASE = PUBLIC_API_URL;
    
    // 2. Cek Token hanya jika di Browser (karena localStorage milik browser)
    let token = null;
    if (browser) {
        token = localStorage.getItem("token");
    }

    // Jika tidak ada token, arahkan ke login
    // Catatan: Redirect ini paling aman dilakukan di sisi client untuk halaman admin CSR
    if (browser && !token) {
        throw redirect(302, '/login');
    }

    // Jika sedang SSR (server render), kita kembalikan data kosong dulu agar tidak error
    if (!browser) return { products: [] };

    try {
        console.log("Mulai Fetch ke:", `${API_BASE}/products/`);
        
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
        } else if (res.status === 401) {
            // Jika token kadaluarsa atau tidak valid
            localStorage.removeItem("token");
            throw redirect(302, '/login');
        } else {
            console.error("Gagal ambil produk. Status:", res.status);
            return { products: [] }; 
        }
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        return { products: [] };
    }
}