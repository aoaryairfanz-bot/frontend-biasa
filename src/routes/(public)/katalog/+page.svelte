<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores'; 

    let { data } = $props();

    // --- STATE DATA PRODUK (Default Array Kosong) ---
    let products = $state([]);

    // --- OPTIMASI 1: Caching & Session Storage ---
    onMount(() => {
        // 1. Cek apakah ada data tersimpan di Session Storage?
        const cachedData = sessionStorage.getItem('katalog_products');
        
        if (cachedData) {
            // Jika ada, pakai data dari cache dulu (INSTANT LOAD)
            products = JSON.parse(cachedData);
        }

        // 2. Jika ada data baru dari Server (Props), Update Cache & Tampilan
        if (data.products && data.products.length > 0) {
            products = data.products;
            // Simpan data terbaru ke Session Storage
            sessionStorage.setItem('katalog_products', JSON.stringify(data.products));
        }
    });

    // --- OPTIMASI 2: Konstanta filter statis ---
    const NON_BOOK_KEYWORDS = ['lilin', 'salib', 'rosario', 'gelang', 'kalung', 'patung', 'tempat lilin', 'goa', 'perjamuan', 'hosti', 'anggur', 'piala', 'kain', 'kotak', 'alas', 'dw0', 'kcb'];
    const BOOK_KEYWORDS = ['alkitab', 'book', 'buku', 'kitab', 'injil', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah'];

    // --- OPTIMASI 3: Formatter & Gambar Super Kecil ---
    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num);

    const optimizeUrl = (url, width) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        // q_auto:eco -> Kompresi maksimal (hemat kuota)
        // f_auto -> Format otomatis (WebP)
        // w_200 -> Lebar cuma 200px (Sangat ringan untuk HP)
        return url.replace("/upload/", `/upload/q_auto:eco,f_auto,w_${width}/`);
    };

    // --- STATE UI ---
    let filter = $state('all');
    let currentPage = $state(1);
    const itemsPerPage = 15;

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'nonbook', label: 'Perlengkapan Rohani' },
        { id: 'book', label: 'Buku & Alkitab' }
    ];

    // --- SEARCH ---
    let searchTerm = $derived($page.url.searchParams.get('search')?.toLowerCase() || "");

    // --- FILTERING ---
    let allFilteredProducts = $derived.by(() => {
        // Jika products belum dimuat, return kosong
        if (!products.length) return [];

        let result = products;

        if (searchTerm) {
            result = result.filter(p => 
                p.name?.toLowerCase().includes(searchTerm) || 
                p.slug?.toLowerCase().includes(searchTerm)
            );
        }

        if (filter !== 'all') {
            result = result.filter(item => {
                const text = (item.name + " " + (item.slug || "")).toLowerCase();
                const isBook = BOOK_KEYWORDS.some(kw => text.includes(kw));
                
                if (filter === 'book') return isBook;
                return !isBook || NON_BOOK_KEYWORDS.some(kw => text.includes(kw));
            });
        }
        
        return result;
    });

    let totalPages = $derived(Math.ceil(allFilteredProducts.length / itemsPerPage));

    let visibleProducts = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFilteredProducts.slice(startIndex, startIndex + itemsPerPage);
    });

    // --- ACTIONS ---
    function changeCategory(id) {
        filter = id;
        currentPage = 1;
        // Scroll smooth ke atas
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            // Scroll langsung (instant) agar cepat
            window.scrollTo({ top: 0, behavior: 'instant' }); 
        }
    }

    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-6 md:mb-8 bg-white py-2">
        <div class="flex justify-center border-b border-gray-200">
            <div class="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide w-full md:w-auto justify-start md:justify-center px-2">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="pb-3 text-[11px] md:text-sm font-bold tracking-wider transition-all duration-200 border-b-4 whitespace-nowrap flex-shrink-0
                    {filter === opt.id ? 'border-[#C4161C] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}"
                >
                    {opt.label}
                </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-[1200px]">
        {#if visibleProducts.length > 0}
            <div class="flex flex-row justify-between items-center mb-4 gap-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-50 pb-2">
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Hasil:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate">"{searchTerm}"</span>
                        <a href="/katalog" class="ml-2 text-blue-600 hover:underline font-medium flex-shrink-0">Hapus Filter</a>
                    {:else}
                        <span class="font-bold">Semua Produk</span>
                    {/if}
                </div>
                <div class="flex-shrink-0">
                    Halaman {currentPage} dari {totalPages}
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mb-10" in:fade={{duration: 200}}>
                {#each visibleProducts as item (item.id || item.name)}
                    {@const diskon = hitungDiskon(item.price, item.strike_price)}
                    
                    <a href="/produk/{item.slug}" class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col relative group overflow-hidden hover:shadow-md transition-all duration-300">
                        <div class="relative w-full aspect-[3/4] bg-gray-50">
                            {#if diskon > 0}
                                <div class="absolute top-0 left-0 bg-[#C4161C] text-white text-[9px] font-bold px-2 py-1 z-10 rounded-br-lg">-{diskon}%</div>
                            {/if}
                            <img 
                                src={optimizeUrl(item.image_1_url, 200)} 
                                alt={item.name} 
                                loading="lazy" 
                                decoding="async" 
                                width="200" height="267"
                                class="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500" 
                            />
                        </div>

                        <div class="p-3 flex flex-col flex-grow">
                            <div class="text-[9px] text-gray-400 uppercase tracking-wide mb-1 truncate">
                                {item.subcategory || item.category || "Umum"}
                            </div>
                            
                            <h3 class="text-xs font-bold text-gray-800 leading-snug mb-2 line-clamp-2 h-8 group-hover:text-[#C4161C] transition-colors">
                                {item.name}
                            </h3>

                            <div class="mt-auto">
                                {#if item.strike_price > item.price}
                                    <div class="text-[9px] text-gray-400 line-through mb-0.5">{formatRupiah(item.strike_price)}</div>
                                {/if}
                                <div class="text-sm font-extrabold text-gray-900">{formatRupiah(item.price)}</div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>

            {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 pb-10 mt-8">
                <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition">❮</button>
                
                {#each Array(totalPages) as _, i}
                    {@const p = i + 1}
                    {#if p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)}
                        <button onclick={() => changePage(p)} class="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition {currentPage === p ? 'bg-[#C4161C] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
                            {p}
                        </button>
                    {:else if p === currentPage - 2 || p === currentPage + 2}
                        <span class="text-gray-300 text-xs">...</span>
                    {/if}
                {/each}

                <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition">❯</button>
            </div>
            {/if}

        {:else}
            <div class="text-center py-32">
                <div class="inline-block p-4 rounded-full bg-gray-50 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 class="text-sm font-bold text-gray-500">Tidak ada produk ditemukan</h3>
                {#if searchTerm}
                    <button onclick={() => window.location.href='/katalog'} class="mt-4 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Lihat Semua Produk</button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>