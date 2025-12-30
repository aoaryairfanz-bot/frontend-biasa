import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    // 1. SSR (Server Side): Langsung return kosong karena tidak ada localStorage
    if (!browser) {
        return { products: [] };
    }

    // 2. CSR (Client Side): Mulai logika token
    const API_BASE = PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    // Jika tidak ada token, tendang ke login
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
            // Jika token kadaluarsa (401), hapus token dan tendang ke login
            if (res.status === 401) {
                localStorage.removeItem("token");
                throw redirect(302, '/login');
            }
            
            console.error("Gagal ambil produk. Status:", res.status);
            return { products: [] }; 
        }

    } catch (err) {
        // --- PERISAI REDIRECT ---
        // Menangkap perintah redirect (302) dan melemparnya keluar agar SvelteKit bisa memprosesnya
        if (err?.status === 302) {
            throw err;
        }

        // Jika error koneksi biasa (internet mati, backend down)
        console.error("Fetch Error:", err);
        return { products: [] };
    }
}