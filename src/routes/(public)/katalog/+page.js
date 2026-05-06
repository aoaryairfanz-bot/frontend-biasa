import { PUBLIC_API_URL } from '$env/static/public';

// [PERBAIKAN 1]: Tambahkan 'url' dan 'setHeaders' di dalam kurung parameter
export async function load({ url, fetch, setHeaders }) {
    
    // [PERBAIKAN 2]: Perintahkan SvelteKit untuk menyimpan halaman ini di memori selama 5 menit
    setHeaders({
        'Cache-Control': 'public, max-age=300'
    });

    // [PERBAIKAN 3]: Tangkap parameter filter dan halaman dari URL browser
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '15'; // Hanya ambil 15 produk!
    const category = url.searchParams.get('category') || '';
    const subcategory = url.searchParams.get('subcategory') || '';
    const search = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'newest';

    // [PERBAIKAN 4]: Rakit URL untuk FastAPI Baginda
    let apiUrl = `${PUBLIC_API_URL}/products/?page=${page}&limit=${limit}&sort=${sort}`;
    
    if (category && category !== 'all') apiUrl += `&category=${category}`;
    if (subcategory && subcategory !== 'all') apiUrl += `&subcategory=${subcategory}`;
    if (search) apiUrl += `&q=${search}`;

    try {
        // SvelteKit memanggil FastAPI dengan parameter yang sudah dirakit
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            throw new Error("Gagal mengambil data produk dari server.");
        }

        const responseData = await res.json();
        
        // [PERBAIKAN 5]: Kembalikan data yang lengkap ke +page.svelte
        // Karena FastAPI Baginda sekarang mengirim format dictionary JSON yang lengkap
        return {
            products: responseData.data || [],            // Isi produknya (15 item)
            totalPages: responseData.total_pages || 1,    // Total halamannya
            currentPage: parseInt(responseData.page) || parseInt(page), // Halaman saat ini
            totalItems: responseData.total || 0,          // Total semua produk di database
            
            // Mengirim balik status filter agar UI bisa menyesuaikan (opsional)
            filters: { category, subcategory, search, sort }
        };

    } catch (error) {
        console.error("Gawat Baginda, Error load katalog:", error);
        
        // Fallback jika server sedang tidur/mati, agar Svelte tidak error putih
        return {
            products: [],
            totalPages: 1,
            currentPage: 1,
            totalItems: 0,
            filters: {}
        };
    }
}

// import { PUBLIC_API_URL } from '$env/static/public';

// export async function load({ fetch }) {
//     // SvelteKit akan melakukan fetch ini di server/background
//     const res = await fetch(`${PUBLIC_API_URL}/products/`);
//     const data = await res.json();
    
//     // Kembalikan data agar bisa dipakai di +page.svelte
//     return {
//         products: data.products || data.data || data || []
//     };
// }