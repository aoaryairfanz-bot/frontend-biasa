<!-- <script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import { LoaderIcon, FilterIcon, AlertCircleIcon } from 'svelte-feather-icons';

    let { data } = $props();

    // --- STATE ---
    let products = $state([]); 
    let isLoading = $state(true); 

    // --- OPTIMASI 1: Caching & Fetching (Robust) ---
    onMount(async () => {
        const CACHE_KEY = 'katalog_products_v3'; // Versi baru
        
        // 1. Cek Cache
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    products = parsed;
                    isLoading = false; 
                }
            }
        } catch (e) { console.error("Cache error", e); }

        // 2. Fetch Data Terbaru
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/`); 
            
            if (res.ok) {
                const result = await res.json();
                
                let finalData = [];
                if (Array.isArray(result)) {
                    finalData = result;
                } else if (result.products && Array.isArray(result.products)) {
                    finalData = result.products;
                } else if (result.data && Array.isArray(result.data)) {
                    finalData = result.data;
                }

                if (finalData.length > 0) {
                    products = finalData;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(finalData));
                }
            }
        } catch (e) {
            console.error("Gagal update produk:", e);
        } finally {
            isLoading = false;
        }
    });

    // --- LOGIKA KATEGORI ---
    const BIBLE_KEYWORDS = ['alkitab', 'kitab suci', 'injil', 'bible'];
    const BOOK_KEYWORDS = ['buku', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah', 'novena'];

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num);

    // --- PERBAIKAN: DISABLE KOMPRESI CLOUDINARY ---
    // Mengembalikan URL asli tanpa manipulasi parameter Cloudinary
    const optimizeUrl = (url) => {
        return url; 
    };

    // --- STATE UI ---
    let filter = $state('all');
    let currentPage = $state(1);
    const itemsPerPage = 15;

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'rohani', label: 'Perlengkapan Rohani' },
        { id: 'alkitab', label: 'Alkitab' },
        { id: 'buku', label: 'Buku' }
    ];

    // --- SEARCH ---
    let searchTerm = $derived($page.url.searchParams.get('search')?.toLowerCase() || "");

    // --- FILTERING LOGIC ---
    let allFilteredProducts = $derived.by(() => {
        if (!products || products.length === 0) return [];

        let result = products;

        if (searchTerm) {
            result = result.filter(p => 
                (p.name && p.name.toLowerCase().includes(searchTerm)) || 
                (p.slug && p.slug.toLowerCase().includes(searchTerm))
            );
        }

        if (filter !== 'all') {
            result = result.filter(item => {
                const text = ((item.name || "") + " " + (item.slug || "") + " " + (item.category || "")).toLowerCase();
                
                const isBible = BIBLE_KEYWORDS.some(kw => text.includes(kw));
                const isBook = BOOK_KEYWORDS.some(kw => text.includes(kw)) && !isBible; 

                if (filter === 'alkitab') return isBible;
                if (filter === 'buku') return isBook;
                if (filter === 'rohani') return !isBible && !isBook; 
                
                return true;
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
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            window.scrollTo({ top: 0, behavior: 'instant' }); 
        }
    }

    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<svelte:head>
    <title>Katalog Produk - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-2 bg-white sticky top-0 z-20">
        <div class="flex justify-center w-full">
            <div class="flex gap-3 md:gap-8 overflow-x-auto scrollbar-hide w-full md:w-auto justify-center px-2 pb-2 items-center">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="pb-2 text-[11px] md:text-sm font-bold tracking-wider transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 px-2
                    {filter === opt.id ? 'border-[#C4161C] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}"
                >
                    {opt.label}
                </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-[1200px] pt-4">
        
        {#if isLoading && products.length === 0}
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mb-10">
                {#each Array(10) as _}
                    <div class="bg-gray-50 rounded-xl aspect-[3/4] animate-pulse"></div>
                {/each}
            </div>

        {:else if visibleProducts.length > 0}
            <div class="flex flex-row justify-between items-center mb-4 gap-2 text-[10px] md:text-xs text-gray-500 pb-2">
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Hasil:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate">"{searchTerm}"</span>
                        <a href="/katalog" class="ml-2 text-blue-600 hover:underline font-medium flex-shrink-0">Hapus</a>
                    {:else}
                        {/if}
                </div>
                <div class="flex-shrink-0 font-medium opacity-50">
                    Hal {currentPage}/{totalPages}
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
                                src={optimizeUrl(item.image_1_url)} 
                                alt={item.name} 
                                loading="lazy" 
                                decoding="async" 
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
                    <FilterIcon size="32" class="text-gray-300"/>
                </div>
                <h3 class="text-sm font-bold text-gray-500">
                    {#if isLoading}
                        Memuat produk...
                    {:else}
                        Tidak ada produk ditemukan
                    {/if}
                </h3>
                {#if searchTerm}
                    <button onclick={() => window.location.href='/katalog'} class="mt-4 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Lihat Semua Produk</button>
                {/if}
                
                {#if !isLoading && products.length === 0}
                    <p class="text-xs text-red-400 mt-2">Gagal memuat data. Refresh Kembali.</p>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style> -->

<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { goto } from '$app/navigation'; // Wajib untuk update URL
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import { LoaderIcon, FilterIcon, AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';

    let { data } = $props();

    // --- STATE ---
    let products = $state([]); 
    let isLoading = $state(true); 
    
    // UI State (Diinisialisasi dari URL nanti)
    let filter = $state('all');
    let currentPage = $state(1);
    const itemsPerPage = 15;
    
    // --- OPTIMASI 1: Caching & Fetching (Robust) ---
    onMount(async () => {
        // 1. Baca State dari URL saat Load (PENTING untuk Back Button)
        const urlPage = parseInt($page.url.searchParams.get('page') || '1');
        const urlCat = $page.url.searchParams.get('category') || 'all';
        
        currentPage = urlPage;
        filter = urlCat;

        const CACHE_KEY = 'katalog_products_v4'; 
        
        // 2. Cek Cache
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    products = parsed;
                    isLoading = false; 
                }
            }
        } catch (e) { console.error("Cache error", e); }

        // 3. Fetch Data Terbaru
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/?t=${Date.now()}`); 
            if (res.ok) {
                const result = await res.json();
                let finalData = [];
                
                // Normalisasi Data
                if (Array.isArray(result)) finalData = result;
                else if (result.products && Array.isArray(result.products)) finalData = result.products;
                else if (result.data && Array.isArray(result.data)) finalData = result.data;

                if (finalData.length > 0) {
                    products = finalData;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(finalData));
                }
            }
        } catch (e) {
            console.error("Gagal update produk:", e);
        } finally {
            isLoading = false;
        }
    });

    // --- LOGIKA KATEGORI & FILTER ---
    const BIBLE_KEYWORDS = ['alkitab', 'kitab suci', 'injil', 'bible'];
    const BOOK_KEYWORDS = ['buku', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah', 'novena'];

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num);
    const optimizeUrl = (url) => url; 

    const filterOptions = [
        { id: 'all', label: 'Semua Produk' },
        { id: 'rohani', label: 'Perlengkapan Rohani' },
        { id: 'alkitab', label: 'Alkitab' },
        { id: 'buku', label: 'Buku Rohani' }
    ];

    // --- SEARCH diambil dari Layout Header (via URL Param 'search') ---
    let searchTerm = $derived($page.url.searchParams.get('search')?.toLowerCase() || "");

    // --- FILTERING LOGIC ---
    let allFilteredProducts = $derived.by(() => {
        if (!products || products.length === 0) return [];

        let result = products;

        // Filter Search
        if (searchTerm) {
            result = result.filter(p => 
                (p.name && p.name.toLowerCase().includes(searchTerm)) || 
                (p.slug && p.slug.toLowerCase().includes(searchTerm))
            );
        }

        // Filter Kategori
        if (filter !== 'all') {
            result = result.filter(item => {
                const text = ((item.name || "") + " " + (item.slug || "") + " " + (item.category || "")).toLowerCase();
                const isBible = BIBLE_KEYWORDS.some(kw => text.includes(kw));
                const isBook = BOOK_KEYWORDS.some(kw => text.includes(kw)) && !isBible; 

                if (filter === 'alkitab') return isBible;
                if (filter === 'buku') return isBook;
                if (filter === 'rohani') return !isBible && !isBook; 
                return true;
            });
        }
        return result;
    });

    let totalPages = $derived(Math.ceil(allFilteredProducts.length / itemsPerPage));

    let visibleProducts = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFilteredProducts.slice(startIndex, startIndex + itemsPerPage);
    });

    // --- ACTIONS DENGAN HISTORY PUSH (KUNCI BACK BUTTON) ---
    function updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('page', currentPage);
        url.searchParams.set('category', filter);
        
        // Simpan search term jika ada
        if (searchTerm) url.searchParams.set('search', searchTerm);
        
        // PENTING: Gunakan goto dengan keepFocus agar tidak reload penuh
        // Browser akan menyimpan ini di history stack
        goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: false });
    }

    function changeCategory(id) {
        filter = id;
        currentPage = 1; // Reset ke hal 1 jika ganti kategori
        updateUrl();
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updateUrl(); // Push state baru ke browser history
            window.scrollTo({ top: 0, behavior: 'instant' }); 
        }
    }

    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<svelte:head>
    <title>Katalog Produk - Narwastu</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8" style="font-family: 'Poppins', sans-serif !important;">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-2 bg-white sticky top-0 z-20 py-2 border-b border-gray-50 md:border-none md:static">
        <div class="flex justify-center w-full">
            <div class="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide w-full md:w-auto justify-start md:justify-center px-2 pb-2 items-center snap-x">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="snap-start px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                    {filter === opt.id 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900'}"
                >
                    {opt.label}
                </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-[1200px] pt-4">
        
        {#if isLoading && products.length === 0}
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                {#each Array(10) as _}
                    <div class="flex flex-col gap-3">
                        <div class="w-full aspect-[3/4] bg-gray-100 rounded-xl animate-pulse"></div>
                        <div class="h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                        <div class="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                {/each}
            </div>

        {:else if visibleProducts.length > 0}
            
            <div class="flex flex-row justify-between items-center mb-6 gap-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-50 pb-4">
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Hasil pencarian:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate">"{searchTerm}"</span>
                        <a href="/katalog" class="ml-2 text-gray-400 hover:text-gray-900 font-bold underline flex-shrink-0">Reset</a>
                    {:else}
                        <span>Menampilkan {allFilteredProducts.length} produk</span>
                    {/if}
                </div>
                <div class="flex-shrink-0 font-medium bg-gray-100 px-3 py-1 rounded-full">
                    Hal {currentPage} / {totalPages}
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-y-10 mb-10" in:fade={{duration: 200}}>
                {#each visibleProducts as item (item.id || item.name)}
                    {@const diskon = hitungDiskon(item.price, item.strike_price)}
                    
                    <a href="/produk/{item.slug}" class="group relative flex flex-col h-full cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <div class="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-transparent">
                            {#if diskon > 0}
                                <span class="absolute top-0 left-0 bg-[#C4161C] text-white text-[9px] font-bold px-2.5 py-1 z-10 rounded-br-lg shadow-sm">
                                    -{diskon}%
                                </span>
                            {/if}
                            <img 
                                src={optimizeUrl(item.image_1_url)} 
                                alt={item.name} 
                                loading="lazy" 
                                decoding="async" 
                                class="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" 
                            />
                        </div>

                        <div class="flex flex-col flex-grow px-1">
                            <div class="text-[9px] text-gray-400 uppercase tracking-wider mb-1 truncate font-bold">
                                {item.subcategory || item.category || "Umum"}
                            </div>
                            
                            <h3 class="text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 min-h-[40px] group-hover:text-[#C4161C] transition-colors">
                                {item.name}
                            </h3>

                            <div class="mt-auto">
                                {#if item.strike_price > item.price}
                                    <div class="text-[10px] text-gray-400 line-through mb-0.5">{formatRupiah(item.strike_price)}</div>
                                {/if}
                                <div class="text-base font-extrabold text-[#C4161C]">{formatRupiah(item.price)}</div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>

            {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 pb-10 mt-12">
                <button 
                    onclick={() => changePage(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition disabled:cursor-not-allowed"
                >
                    <ChevronLeftIcon size="18"/>
                </button>
                
                <div class="hidden md:flex items-center gap-1">
                    {#each Array(totalPages) as _, i}
                        {@const p = i + 1}
                        {#if p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)}
                            <button 
                                onclick={() => changePage(p)} 
                                class="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition 
                                {currentPage === p ? 'bg-[#C4161C] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}"
                            >
                                {p}
                            </button>
                        {:else if p === currentPage - 2 || p === currentPage + 2}
                            <span class="text-gray-300 text-xs px-1">...</span>
                        {/if}
                    {/each}
                </div>
                
                <span class="md:hidden text-xs font-bold text-gray-500">Hal {currentPage}</span>

                <button 
                    onclick={() => changePage(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition disabled:cursor-not-allowed"
                >
                    <ChevronRightIcon size="18"/>
                </button>
            </div>
            {/if}

        {:else}
            <div class="text-center py-32">
                <div class="inline-block p-4 rounded-full bg-gray-50 mb-3">
                    <FilterIcon size="32" class="text-gray-300"/>
                </div>
                <h3 class="text-sm font-bold text-gray-500 mb-2">
                    {#if isLoading}
                        Memuat produk...
                    {:else}
                        Tidak ada produk ditemukan
                    {/if}
                </h3>
                {#if searchTerm}
                    <button onclick={() => window.location.href='/katalog'} class="mt-2 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Lihat Semua Produk</button>
                {/if}
            </div>
        {/if}
    </div>
</div>