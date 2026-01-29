<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { goto } from '$app/navigation';
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import { FilterIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, ChevronDownIcon } from 'svelte-feather-icons';

    // --- STATE ---
    let products = $state([]); 
    let isLoading = $state(true); 
    
    // UI State
    let filter = $state('all'); // Kategori Utama (Tab Atas)
    let activeSubCategory = $state('all'); // Subkategori (Tombol Bawah)
    let currentPage = $state(1);
    let searchTerm = $state("");
    let sortBy = $state('newest');
    const itemsPerPage = 15;

    // --- SYNC URL ---
    $effect(() => {
        const params = $page.url.searchParams;
        const urlPage = parseInt(params.get('page') || '1');
        const urlCat = params.get('category') || 'all';
        const urlSearch = params.get('search') || '';

        if (currentPage !== urlPage) currentPage = urlPage;
        if (filter !== urlCat) filter = urlCat;
        if (searchTerm !== urlSearch) searchTerm = urlSearch;
    });

    // --- FETCH DATA ---
    onMount(async () => {
        const CACHE_KEY = 'katalog_products_v7_real_sub'; // Update key cache
        
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

        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/?t=${Date.now()}`); 
            if (res.ok) {
                const result = await res.json();
                let finalData = [];
                if (Array.isArray(result)) finalData = result;
                else if (result.products) finalData = result.products;
                else if (result.data) finalData = result.data;

                if (finalData.length > 0) {
                    products = finalData;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(finalData));
                }
            }
        } catch (e) { console.error("Error fetch:", e); } 
        finally { isLoading = false; }
    });

    // --- HELPERS ---
    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num || 0);
    const optimizeUrl = (url) => url; 

    // Opsi Kategori Utama (Manual karena ini Tab Navigasi)
    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'rohani', label: 'Perlengkapan Rohani' },
        { id: 'alkitab', label: 'Alkitab' },
        { id: 'buku', label: 'Buku' }
    ];

    // Helper Keyword untuk Kategori Utama
    const BIBLE_KEYWORDS = ['alkitab', 'kitab suci', 'injil', 'bible'];
    const BOOK_KEYWORDS = ['buku', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah', 'novena'];

    // --- LOGIC 1: AMBIL DATA SUBKATEGORI DARI DATABASE ---
    let availableSubcategories = $derived.by(() => {
        if (!products || products.length === 0) return [];
        
        // 1. Ambil produk yang sesuai Kategori Utama dulu
        let relevantProducts = products;
        if (filter !== 'all') {
            relevantProducts = products.filter(item => {
                const text = ((item.name || "") + " " + (item.slug || "") + " " + (item.category || "")).toLowerCase();
                const isBible = BIBLE_KEYWORDS.some(kw => text.includes(kw));
                const isBook = BOOK_KEYWORDS.some(kw => text.includes(kw)) && !isBible; 
                
                if (filter === 'alkitab') return isBible;
                if (filter === 'buku') return isBook;
                if (filter === 'rohani') return !isBible && !isBook; 
                return true;
            });
        }

        // 2. SCAN kolom 'subcategory' dari produk yang tersaring
        const subs = new Set();
        relevantProducts.forEach(p => {
            // Ambil data MENTAH dari database
            if (p.subcategory && p.subcategory.trim() !== "") {
                // Rapikan huruf depan kapital (opsional)
                const label = p.subcategory.charAt(0).toUpperCase() + p.subcategory.slice(1);
                subs.add(label);
            }
        });
        
        // Urutkan abjad
        return Array.from(subs).sort();
    });

    // --- LOGIC 2: FILTER DATA UTAMA ---
    let allFilteredProducts = $derived.by(() => {
        if (!products || products.length === 0) return [];

        let result = [...products];

        // A. Filter Search
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) || 
                (p.slug && p.slug.toLowerCase().includes(q))
            );
        }

        // B. Filter Kategori Utama (Tab Atas)
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

        // C. Filter Subkategori (Tombol Bawah) - REAL DARI DATABASE
        if (activeSubCategory !== 'all') {
            result = result.filter(p => 
                p.subcategory && p.subcategory.toLowerCase() === activeSubCategory.toLowerCase()
            );
        }

        // D. Sorting
        if (sortBy === 'price_asc') {
            result.sort((a, b) => (a.final_price || 0) - (b.final_price || 0));
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => (b.final_price || 0) - (a.final_price || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => (a.id || 0) - (b.id || 0));
        } else {
            result.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        return result;
    });

    let totalPages = $derived(Math.ceil(allFilteredProducts.length / itemsPerPage));
    let visibleProducts = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFilteredProducts.slice(startIndex, startIndex + itemsPerPage);
    });

    // --- ACTIONS ---
    function updateUrl(newParams) {
        const url = new URL($page.url);
        if (newParams.page) url.searchParams.set('page', newParams.page);
        if (newParams.category) url.searchParams.set('category', newParams.category);
        goto(url.toString(), { keepFocus: true, noScroll: true });
    }

    function changeCategory(id) {
        filter = id;
        activeSubCategory = 'all'; // Reset sub kategori jika kategori utama ganti
        currentPage = 1; 
        updateUrl({ category: id, page: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }

    function changeSubCategory(sub) {
        activeSubCategory = sub;
        currentPage = 1;
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            updateUrl({ page: newPage, category: filter });
            window.scrollTo({ top: 0, behavior: 'instant' }); 
        }
    }

    function resetFilter() {
        const url = new URL($page.url);
        url.searchParams.delete('search');
        url.searchParams.set('category', 'all');
        goto(url.toString());
    }

    function getDiscountLabel(item) {
        if (item.discount_label) return item.discount_label.replace('%', '');
        const final = item.final_price || item.price;
        const strike = item.display_strike_price || item.strike_price;
        if (strike > final) return Math.round(((strike - final) / strike) * 100);
        return 0;
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
    .custom-select {
        background-image: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }
</style>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8" style="font-family: 'Poppins', sans-serif !important;">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-4 bg-white sticky top-0 z-30 pt-2 pb-1 border-b border-gray-50 md:border-none shadow-sm md:shadow-none transition-all">
        
        <div class="flex justify-center w-full mb-2">
            <div class="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide w-full md:w-auto justify-start md:justify-center px-2 pb-1 items-center snap-x">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="pb-2 text-[11px] md:text-sm font-bold tracking-wider transition-all duration-200 border-b-[3px] whitespace-nowrap flex-shrink-0 px-2 snap-start
                    {filter === opt.id ? 'border-[#C4161C] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}"
                >
                    {opt.label}
                </button>
                {/each}
            </div>
        </div>

        {#if availableSubcategories.length > 0}
        <div class="w-full overflow-hidden border-t border-gray-50 pt-2" in:fade>
            <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full px-1 pb-2 items-center snap-x md:justify-center">
                
                <button 
                    onclick={() => changeSubCategory('all')}
                    class="px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border snap-start
                    {activeSubCategory === 'all' 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}"
                >
                    Semua
                </button>

                {#each availableSubcategories as sub}
                <button 
                    onclick={() => changeSubCategory(sub)}
                    class="px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border snap-start
                    {activeSubCategory === sub 
                        ? 'bg-[#C4161C] text-white border-[#C4161C]' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'}"
                >
                    {sub}
                </button>
                {/each}
            </div>
        </div>
        {/if}

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
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 text-[10px] md:text-xs text-gray-500 pb-2 border-b border-gray-50 w-full">
                
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden w-full md:w-auto">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Cari:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate max-w-[100px]">"{searchTerm}"</span>
                        <button onclick={resetFilter} class="ml-2 p-1 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition"><XIcon size="12"/></button>
                    {:else}
                        <span>Total {allFilteredProducts.length} produk</span>
                        {#if activeSubCategory !== 'all'}
                            <span class="text-gray-300">|</span>
                            <span class="font-bold text-gray-700">{activeSubCategory}</span>
                        {/if}
                    {/if}
                </div>

                <div class="flex items-center justify-between w-full md:w-auto gap-3">
                    <div class="relative flex items-center gap-1 group cursor-pointer bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:border-gray-300 transition">
                        <span class="text-gray-400">Urutkan:</span>
                        <select bind:value={sortBy} class="custom-select bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-[10px] md:text-xs pr-4 z-10">
                            <option value="newest">Terbaru</option>
                            <option value="price_asc">Termurah</option>
                            <option value="price_desc">Termahal</option>
                            <option value="oldest">Terlama</option>
                        </select>
                        <ChevronDownIcon size="14" class="absolute right-2 text-gray-400 pointer-events-none"/>
                    </div>
                    <div class="flex-shrink-0 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        Hal {currentPage} / {totalPages || 1}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-y-10 mb-10" in:fade={{duration: 200}}>
                {#each visibleProducts as item (item.id || item.name)}
                    {@const diskonVal = getDiscountLabel(item)}
                    
                    <a href="/produk/{item.slug}" class="group relative flex flex-col h-full cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <div class="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-transparent">
                            {#if diskonVal && parseInt(diskonVal) > 0}
                                <span class="absolute top-0 left-0 bg-[#C4161C] text-white text-[9px] font-bold px-2.5 py-1 z-10 rounded-br-lg shadow-sm">-{diskonVal}%</span>
                            {/if}
                            <img src={optimizeUrl(item.image_1_url)} alt={item.name} loading="lazy" decoding="async" class="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                        </div>

                        <div class="flex flex-col flex-grow px-1">
                            <div class="text-[9px] text-gray-400 uppercase tracking-wider mb-1 truncate font-bold">
                                {item.subcategory || item.category || "Umum"}
                            </div>
                            <h3 class="text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 min-h-[40px] group-hover:text-[#C4161C] transition-colors">{item.name}</h3>
                            <div class="mt-auto">
                                {#if item.display_strike_price > item.final_price}
                                    <div class="text-[10px] text-gray-400 line-through mb-0.5">{formatRupiah(item.display_strike_price)}</div>
                                {/if}
                                <div class="text-base font-extrabold text-[#C4161C]">{formatRupiah(item.final_price)}</div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>

            {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 pb-10 mt-12">
                <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition disabled:cursor-not-allowed">
                    <ChevronLeftIcon size="18"/>
                </button>
                <div class="flex items-center gap-1">
                    {#each Array(totalPages) as _, i}
                        {@const p = i + 1}
                        {#if p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)}
                            <button onclick={() => changePage(p)} class="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition {currentPage === p ? 'bg-[#C4161C] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}">{p}</button>
                        {:else if p === currentPage - 2 || p === currentPage + 2}
                            <span class="text-gray-300 text-xs px-1">...</span>
                        {/if}
                    {/each}
                </div>
                <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition disabled:cursor-not-allowed">
                    <ChevronRightIcon size="18"/>
                </button>
            </div>
            {/if}

        {:else}
            <div class="text-center py-24">
                <div class="inline-block p-4 rounded-full bg-gray-50 mb-3"><FilterIcon size="32" class="text-gray-300"/></div>
                <h3 class="text-sm font-bold text-gray-500 mb-2">{isLoading ? 'Memuat produk...' : 'Tidak ada produk ditemukan'}</h3>
                {#if searchTerm}
                    <button onclick={resetFilter} class="mt-2 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Lihat Semua Produk</button>
                {/if}
            </div>
        {/if}
    </div>
</div>


<!-- <script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { goto } from '$app/navigation';
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import { LoaderIcon, FilterIcon, AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, ChevronDownIcon } from 'svelte-feather-icons';

    let { data } = $props();

    // --- STATE ---
    let products = $state([]); 
    let isLoading = $state(true); 
    
    // UI State
    let filter = $state('all');
    let currentPage = $state(1);
    let searchTerm = $state("");
    let sortBy = $state('newest'); // [BARU] State untuk Sorting
    const itemsPerPage = 15;

    // --- SYNC URL & STATE ---
    $effect(() => {
        const params = $page.url.searchParams;
        const urlPage = parseInt(params.get('page') || '1');
        const urlCat = params.get('category') || 'all';
        const urlSearch = params.get('search') || '';

        if (currentPage !== urlPage) currentPage = urlPage;
        if (filter !== urlCat) filter = urlCat;
        if (searchTerm !== urlSearch) searchTerm = urlSearch;
    });

    // --- FETCH DATA ---
    onMount(async () => {
        const CACHE_KEY = 'katalog_products_v6'; // Update versi cache
        
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

        // 2. Fetch Fresh Data
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/?t=${Date.now()}`); 
            if (res.ok) {
                const result = await res.json();
                let finalData = [];
                
                if (Array.isArray(result)) finalData = result;
                else if (result.products) finalData = result.products;
                else if (result.data) finalData = result.data;

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

    // --- HELPERS ---
    const BIBLE_KEYWORDS = ['alkitab', 'kitab suci', 'injil', 'bible'];
    const BOOK_KEYWORDS = ['buku', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah', 'novena'];

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num || 0);
    const optimizeUrl = (url) => url; 

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'rohani', label: 'Perlengkapan Rohani' },
        { id: 'alkitab', label: 'Alkitab' },
        { id: 'buku', label: 'Buku' }
    ];

    // --- FILTERING & SORTING LOGIC ---
    let allFilteredProducts = $derived.by(() => {
        if (!products || products.length === 0) return [];

        let result = [...products]; // Copy array agar aman

        // 1. Filter Search
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) || 
                (p.slug && p.slug.toLowerCase().includes(q))
            );
        }

        // 2. Filter Kategori
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

        // 3. Sorting (Client Side - Cepat) 🚀
        if (sortBy === 'price_asc') {
            result.sort((a, b) => (a.final_price || 0) - (b.final_price || 0));
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => (b.final_price || 0) - (a.final_price || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => (a.id || 0) - (b.id || 0));
        } else {
            // Default: Newest (ID Descending)
            result.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        return result;
    });

    let totalPages = $derived(Math.ceil(allFilteredProducts.length / itemsPerPage));

    let visibleProducts = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFilteredProducts.slice(startIndex, startIndex + itemsPerPage);
    });

    // --- ACTIONS ---
    function updateUrl(newParams) {
        const url = new URL($page.url);
        if (newParams.page) url.searchParams.set('page', newParams.page);
        if (newParams.category) url.searchParams.set('category', newParams.category);
        goto(url.toString(), { keepFocus: true, noScroll: true });
    }

    function changeCategory(id) {
        filter = id;
        currentPage = 1; 
        updateUrl({ category: id, page: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            updateUrl({ page: newPage, category: filter });
            window.scrollTo({ top: 0, behavior: 'instant' }); 
        }
    }

    function resetFilter() {
        const url = new URL($page.url);
        url.searchParams.delete('search');
        url.searchParams.set('category', 'all');
        url.searchParams.set('page', '1');
        goto(url.toString());
    }

    // [UPDATE] Helper Diskon: Prioritas Label Backend, Fallback Hitung Manual
    function getDiscountLabel(item) {
        if (item.discount_label) return item.discount_label.replace('%', ''); // Ambil angka saja
        
        // Fallback hitung manual jika backend belum sync
        const final = item.final_price || item.price;
        const strike = item.display_strike_price || item.strike_price;
        
        if (strike > final) {
            return Math.round(((strike - final) / strike) * 100);
        }
        return 0;
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
    /* Custom Select Style */
    .custom-select {
        background-image: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }
</style>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8" style="font-family: 'Poppins', sans-serif !important;">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-2 bg-white sticky top-0 z-20 py-2 border-b border-gray-50 md:border-none">
        <div class="flex justify-center w-full">
            <div class="flex gap-3 md:gap-8 overflow-x-auto scrollbar-hide w-full md:w-auto justify-center px-2 pb-2 items-center snap-x">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="pb-2 text-[11px] md:text-sm font-bold tracking-wider transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 px-2 snap-start
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
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 text-[10px] md:text-xs text-gray-500 pb-2 border-b border-gray-50 w-full">
                
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden w-full md:w-auto">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Pencarian:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate max-w-[100px]">"{searchTerm}"</span>
                        <button onclick={resetFilter} class="ml-2 p-1 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition">
                            <XIcon size="12"/>
                        </button>
                    {:else}
                        <span>Menampilkan {allFilteredProducts.length} produk</span>
                    {/if}
                </div>

                <div class="flex items-center justify-between w-full md:w-auto gap-4">
                    <div class="relative flex items-center gap-1 group cursor-pointer bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:border-gray-300 transition">
                        <span class="text-gray-400">Urutkan:</span>
                        <select 
                            bind:value={sortBy} 
                            class="custom-select bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-[10px] md:text-xs pr-4 z-10"
                        >
                            <option value="newest">Terbaru</option>
                            <option value="price_asc">Termurah</option>
                            <option value="price_desc">Termahal</option>
                            <option value="oldest">Terlama</option>
                        </select>
                        <ChevronDownIcon size="14" class="absolute right-2 text-gray-400 pointer-events-none"/>
                    </div>

                    <div class="flex-shrink-0 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        Hal {currentPage} / {totalPages || 1}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-y-10 mb-10" in:fade={{duration: 200}}>
                {#each visibleProducts as item (item.id || item.name)}
                    {@const diskonVal = getDiscountLabel(item)}
                    
                    <a href="/produk/{item.slug}" class="group relative flex flex-col h-full cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <div class="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-transparent">
                            {#if diskonVal && parseInt(diskonVal) > 0}
                                <span class="absolute top-0 left-0 bg-[#C4161C] text-white text-[9px] font-bold px-2.5 py-1 z-10 rounded-br-lg shadow-sm">
                                    -{diskonVal}%
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
                                {#if item.display_strike_price > item.final_price}
                                    <div class="text-[10px] text-gray-400 line-through mb-0.5">
                                        {formatRupiah(item.display_strike_price)}
                                    </div>
                                {/if}
                                
                                <div class="text-base font-extrabold text-[#C4161C]">
                                    {formatRupiah(item.final_price)}
                                </div>
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
                
                <div class="flex items-center gap-1">
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
            <div class="text-center py-24">
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
                    <button onclick={resetFilter} class="mt-2 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Lihat Semua Produk</button>
                {/if}
            </div>
        {/if}
    </div>
</div> -->