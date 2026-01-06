import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        // Panggil API /branches
        const res = await fetch(`${PUBLIC_API_URL}/branches`);
        
        if (res.ok) {
            const branches = await res.json();
            return { branches };
        } else {
            console.error("Gagal ambil data cabang:", res.status);
            return { branches: [] };
        }
    } catch (err) {
        console.error("Error koneksi:", err);
        return { branches: [] };
    }
}