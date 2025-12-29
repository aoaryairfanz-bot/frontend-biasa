import { redirect } from '@sveltejs/kit';

export async function load({ fetch }) {
    const API_BASE = "https://aryairfan-backendbiasa.hf.space";
    const token = localStorage.getItem("token");

    console.log("1. Cek Token:", token); // Cek di Console Browser

    if (!token) {
        console.log("Token tidak ada, redirect ke login");
        throw redirect(302, '/login');
    }

    try {
        console.log("2. Mulai Fetch ke:", `${API_BASE}/products/`);
        
        const res = await fetch(`${API_BASE}/products/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("3. Status API:", res.status); // Harus 200

        if (res.ok) {
            const products = await res.json();
            console.log("4. Data Berhasil:", products); // Cek isinya apa
            return { products };
        } else {
            console.error("Gagal ambil produk. Status:", res.status);
            // Kembalikan array kosong biar halaman gak crash, tapi kita tau errornya
            return { products: [] }; 
        }
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        return { products: [] };
    }
}