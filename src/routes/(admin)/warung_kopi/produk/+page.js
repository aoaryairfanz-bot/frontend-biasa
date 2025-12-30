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
            // Jika token kadaluarsa (401)
            if (res.status === 401) {
                localStorage.removeItem("token");
                // Redirect ini ada di dalam TRY, jadi harus hati-hati
                throw redirect(302, '/login');
            }
            
            console.error("Gagal ambil produk. Status:", res.status);
            return { products: [] }; 
        }

    } catch (err) {
        // --- PERBAIKAN PENTING ---
        // Kita harus cek: apakah error ini sebenarnya adalah perintah redirect?
        // Jika iya (status 302), kita harus lempar ulang (re-throw) agar SvelteKit menangkapnya
        if (err?.status === 302) {
            throw err;
        }

        // Jika bukan redirect (error koneksi beneran), baru kita log
        console.error("Fetch Error:", err);
        return { products: [] };
    }
}