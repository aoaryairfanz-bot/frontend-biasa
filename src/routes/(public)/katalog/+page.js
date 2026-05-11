import { PUBLIC_API_URL } from '$env/static/public';

export async function load({ url, fetch, setHeaders }) {
    // Simpan halaman di memori browser selama 5 menit
    setHeaders({
        'Cache-Control': 'public, max-age=300'
    });

    // Tangkap parameter filter dan halaman dari URL browser
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '15'; // Hanya ambil 15 produk per halaman
    const category = url.searchParams.get('category') || '';
    const subcategory = url.searchParams.get('subcategory') || '';
    const search = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'newest';

    // Rakit URL untuk FastAPI
    let apiUrl = `${PUBLIC_API_URL}/products/?page=${page}&limit=${limit}&sort=${sort}`;
    
    if (category && category !== 'all') apiUrl += `&category=${category}`;
    if (subcategory && subcategory !== 'all') apiUrl += `&subcategory=${subcategory}`;
    if (search) apiUrl += `&q=${search}`;

    try {
        // Panggil 2 API sekaligus: Ambil 15 Produk DAN Ambil Seluruh Daftar Subkategori
        const [resProducts, resSubcat] = await Promise.all([
            fetch(apiUrl),
            fetch(`${PUBLIC_API_URL}/products/subcategories`)
        ]);
        
        if (!resProducts.ok) {
            throw new Error("Gagal mengambil data produk dari server.");
        }

        const responseData = await resProducts.json();
        const allSubcategories = resSubcat.ok ? await resSubcat.json() : [];
        
        return {
            products: responseData.data || [],            
            totalPages: responseData.total_pages || 1,    
            currentPage: parseInt(responseData.page) || parseInt(page), 
            totalItems: responseData.total || 0,          
            filters: { category, subcategory, search, sort },
            allSubcategories: allSubcategories 
        };

    } catch (error) {
        console.error("Gawat Baginda, Error load katalog:", error);
        
        // Fallback jika server sedang tidur/mati
        return {
            products: [],
            totalPages: 1,
            currentPage: 1,
            totalItems: 0,
            filters: {},
            allSubcategories: []
        };
    }
}