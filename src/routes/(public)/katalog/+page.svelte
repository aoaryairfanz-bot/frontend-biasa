<script>
    import { fade, fly } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { goto } from '$app/navigation';
    import { FilterIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, ChevronDownIcon, CheckIcon } from 'svelte-feather-icons';

    // [BARU] Menangkap data hasil fetch dari +page.js
    let { data } = $props(); 
    
    // [BARU] Jadikan products reactive terhadap data dari server. 
    // Kita hapus isLoading karena halaman akan langsung muncul berkat SSR!
    let products = $derived(data.products || []); 
    
    // --- UI STATE (Tetap sama seperti milik Anda) ---
    let filter = $state('all'); 
    let activeSubCategory = $state('all'); 
    let currentPage = $state(1);
    let searchTerm = $state("");
    let sortBy = $state('newest');
    
    let minPrice = $state(null);
    let maxPrice = $state(null);
    let inStockOnly = $state(false); 
    
    let isMobileFilterOpen = $state(false);
    
    const itemsPerPage = 15;

    let activeFilterCount = $derived(
        (activeSubCategory !== 'all' ? 1 : 0) + 
        (minPrice || maxPrice ? 1 : 0) + 
        (sortBy !== 'newest' ? 1 : 0) +
        (inStockOnly ? 1 : 0)
    );

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

    // --- HELPERS ---
    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num || 0);
    const optimizeUrl = (url) => url; 

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'rohani', label: 'Perlengkapan Rohani' },
        { id: 'alkitab', label: 'Alkitab' },
        { id: 'buku', label: 'Buku' }
    ];

    const BIBLE_KEYWORDS = ['alkitab', 'kitab suci', 'injil', 'bible'];
    const BOOK_KEYWORDS = ['buku', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah', 'novena'];

    // --- LOGIC 1: SUBKATEGORI DINAMIS ---
    let availableSubcategories = $derived.by(() => {
        if (!products || products.length === 0) return [];
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
        const subs = new Set();
        relevantProducts.forEach(p => {
            if (p.subcategory && p.subcategory.trim() !== "") {
                const label = p.subcategory.charAt(0).toUpperCase() + p.subcategory.slice(1);
                subs.add(label);
            }
        });
        return Array.from(subs).sort();
    });

    // --- LOGIC 2: FILTERING & SORTING ---
    let allFilteredProducts = $derived.by(() => {
        if (!products || products.length === 0) return [];
        let result = [...products];

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.slug && p.slug.toLowerCase().includes(q)));
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

        if (activeSubCategory !== 'all') {
            result = result.filter(p => p.subcategory && p.subcategory.toLowerCase() === activeSubCategory.toLowerCase());
        }

        if (minPrice) result = result.filter(p => (p.final_price || p.price || 0) >= minPrice);
        if (maxPrice) result = result.filter(p => (p.final_price || p.price || 0) <= maxPrice);
        if (inStockOnly) result = result.filter(p => (p.stock || 0) > 0);

        if (sortBy === 'price_asc') result.sort((a, b) => (a.final_price || 0) - (b.final_price || 0));
        else if (sortBy === 'price_desc') result.sort((a, b) => (b.final_price || 0) - (a.final_price || 0));
        else if (sortBy === 'oldest') result.sort((a, b) => (a.id || 0) - (b.id || 0));
        else result.sort((a, b) => (b.id || 0) - (a.id || 0));

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
        activeSubCategory = 'all'; 
        currentPage = 1; 
        updateUrl({ category: id, page: 1 });
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
        minPrice = null; 
        maxPrice = null; 
        inStockOnly = false;
        filter = 'all';
        activeSubCategory = 'all';
        sortBy = 'newest';
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
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] { -moz-appearance: textfield; }

    /* CSS Sakelar Geser (Toggle) */
    .toggle-checkbox:checked { right: 0; border-color: #68D391; }
    .toggle-checkbox:checked + .toggle-label { background-color: #2D3748; }
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
    </div>

    <div class="container mx-auto px-4 max-w-[1200px] pt-2">
        
        {#if visibleProducts.length > 0}
            
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 text-[10px] md:text-xs text-gray-500 pb-4 border-b border-gray-50 w-full">
                
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden w-full lg:w-auto">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Pencarian:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate max-w-[100px]">"{searchTerm}"</span>
                        <button onclick={() => {searchTerm = ''; resetFilter();}} class="ml-2 p-1 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition">
                            <XIcon size="12"/>
                        </button>
                    {:else}
                        <span>Menampilkan {allFilteredProducts.length} produk</span>
                    {/if}
                </div>

                <div class="flex lg:hidden w-full gap-3 overflow-x-auto scrollbar-hide pb-1">
                    <button 
                        onclick={() => isMobileFilterOpen = true} 
                        class="flex items-center gap-2 border border-gray-300 rounded-full px-5 py-2 text-xs font-bold text-gray-700 bg-white shadow-sm flex-shrink-0 relative"
                    >
                        <FilterIcon size="14"/> Filter
                        {#if activeFilterCount > 0}
                            <span class="absolute -top-1 -right-1 bg-[#C4161C] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        {/if}
                    </button>

                    <button 
                        onclick={() => inStockOnly = !inStockOnly} 
                        class="flex items-center gap-1.5 border rounded-full px-4 py-2 text-xs font-bold transition flex-shrink-0
                        {inStockOnly ? 'bg-gray-800 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}"
                    >
                        {#if inStockOnly} <XIcon size="12"/> {/if}
                        Stok Tersedia
                    </button>
                </div>

                <div class="hidden lg:flex flex-row items-center justify-end gap-3">
                    {#if availableSubcategories.length > 0}
                    <div class="relative w-40" in:fade>
                        <select bind:value={activeSubCategory} onchange={() => currentPage = 1} class="custom-select w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-8 rounded-xl shadow-sm focus:ring-2 focus:ring-[#C4161C] font-semibold text-xs cursor-pointer hover:border-gray-300">
                            <option value="all">Semua Kategori</option>
                            {#each availableSubcategories as sub} <option value={sub}>{sub}</option> {/each}
                        </select>
                        <ChevronDownIcon size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    </div>
                    {/if}

                    <div class="flex items-center gap-2">
                        <div class="relative w-32">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">Rp</span>
                            <input type="number" value={minPrice || ''} onchange={(e) => minPrice = e.target.value ? Number(e.target.value) : null} placeholder="Min" class="w-full bg-white border border-gray-200 text-gray-700 py-2.5 pl-8 pr-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#C4161C] font-semibold text-xs hover:border-gray-300">
                        </div>
                        <span class="text-gray-300 font-bold">-</span>
                        <div class="relative w-32">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">Rp</span>
                            <input type="number" value={maxPrice || ''} onchange={(e) => maxPrice = e.target.value ? Number(e.target.value) : null} placeholder="Max" class="w-full bg-white border border-gray-200 text-gray-700 py-2.5 pl-8 pr-3 rounded-xl shadow-sm focus:ring-2 focus:ring-[#C4161C] font-semibold text-xs hover:border-gray-300">
                        </div>
                    </div>

                    <div class="relative w-44">
                        <select bind:value={sortBy} class="custom-select w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-8 rounded-xl shadow-sm focus:ring-2 focus:ring-[#C4161C] font-semibold text-xs cursor-pointer hover:border-gray-300">
                            <option value="newest">Urutkan: Terbaru</option>
                            <option value="price_asc">Termurah</option>
                            <option value="price_desc">Termahal</option>
                            <option value="oldest">Terlama</option>
                        </select>
                        <ChevronDownIcon size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
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
                            <div class="text-[9px] text-gray-400 uppercase tracking-wider mb-1 truncate font-bold">{item.subcategory || item.category || "Umum"}</div>
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
            <div class="flex justify-center items-center gap-2 pb-10 mt-8">
                <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition"><ChevronLeftIcon size="18"/></button>
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
                <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 transition"><ChevronRightIcon size="18"/></button>
            </div>
            {/if}

        {:else}
            <div class="text-center py-24">
                <div class="inline-block p-4 rounded-full bg-gray-50 mb-3"><FilterIcon size="32" class="text-gray-300"/></div>
                <h3 class="text-sm font-bold text-gray-500 mb-2">
                    Tidak ada produk ditemukan
                </h3>
                {#if searchTerm || minPrice || maxPrice || filter !== 'all' || activeSubCategory !== 'all' || inStockOnly}
                    <button onclick={resetFilter} class="mt-2 text-xs text-[#C4161C] hover:text-red-700 font-bold underline">Hapus Semua Filter</button>
                {/if}
            </div>
        {/if}
    </div>
</div>

{#if isMobileFilterOpen}
    <div class="fixed inset-0 bg-black/60 z-[60] lg:hidden" onclick={() => isMobileFilterOpen = false} in:fade={{duration: 200}} out:fade={{duration: 200}}></div>
    
    <div class="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl flex flex-col max-h-[85vh] lg:hidden shadow-2xl" in:fly={{y: 500, duration: 300}} out:fly={{y: 500, duration: 300}}>
        
        <div class="p-4 flex justify-center pb-0">
            <div class="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        <div class="px-5 py-4 flex justify-between items-center border-b border-gray-50">
            <h2 class="font-bold text-gray-900 text-lg">Filter</h2>
            {#if activeFilterCount > 0}
                <button onclick={resetFilter} class="text-xs font-bold text-gray-400 hover:text-red-500">Reset</button>
            {/if}
        </div>
        
        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-7" style="font-family: 'Poppins', sans-serif !important;">
            
            <div>
                <h3 class="font-bold text-gray-800 mb-3 text-sm">Urutkan</h3>
                <div class="flex flex-wrap gap-2">
                    {#each [{id: 'newest', label: 'Terbaru'}, {id: 'price_asc', label: 'Harga Terendah'}, {id: 'price_desc', label: 'Harga Tertinggi'}] as s}
                        <button 
                            onclick={() => sortBy = s.id}
                            class="px-4 py-2 rounded-full border text-[13px] font-medium transition
                            {sortBy === s.id ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-600'}"
                        >
                            {s.label}
                        </button>
                    {/each}
                </div>
            </div>

            {#if availableSubcategories.length > 0}
            <div>
                <h3 class="font-bold text-gray-800 mb-3 text-sm">Tipe Produk</h3>
                <div class="flex flex-wrap gap-2">
                    <button 
                        onclick={() => activeSubCategory = 'all'}
                        class="px-4 py-2 rounded-full border text-[13px] font-medium transition
                        {activeSubCategory === 'all' ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-600'}"
                    >Semua</button>
                    {#each availableSubcategories as sub}
                        <button 
                            onclick={() => activeSubCategory = sub}
                            class="px-4 py-2 rounded-full border text-[13px] font-medium transition
                            {activeSubCategory === sub ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-600'}"
                        >{sub}</button>
                    {/each}
                </div>
            </div>
            {/if}

            <div>
                <h3 class="font-bold text-gray-800 mb-3 text-sm">Harga</h3>
                <div class="flex items-center gap-3">
                    <div class="relative flex-1">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                        <input type="number" value={minPrice || ''} onchange={(e) => minPrice = e.target.value ? Number(e.target.value) : null} placeholder="Min" class="w-full border border-gray-200 rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold focus:border-gray-400 outline-none text-gray-800 placeholder-gray-300">
                    </div>
                    <div class="relative flex-1">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                        <input type="number" value={maxPrice || ''} onchange={(e) => maxPrice = e.target.value ? Number(e.target.value) : null} placeholder="Max" class="w-full border border-gray-200 rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold focus:border-gray-400 outline-none text-gray-800 placeholder-gray-300">
                    </div>
                </div>
            </div>

            <div class="pb-2">
                <h3 class="font-bold text-gray-800 mb-3 text-sm">Stok</h3>
                <label class="flex items-center justify-between cursor-pointer p-4 border border-gray-100 rounded-2xl bg-gray-50">
                    <span class="text-sm font-bold text-gray-700">Hanya yang tersedia</span>
                    <div class="relative">
                        <input type="checkbox" bind:checked={inStockOnly} class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#C4161C] transition-colors duration-300"></div>
                        <div class="absolute top-[2px] left-[2px] bg-white border-gray-300 border h-5 w-5 rounded-full transition-transform duration-300 peer-checked:translate-x-full peer-checked:border-white shadow-sm"></div>
                    </div>
                </label>
            </div>
        </div>
        
        <div class="p-5 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <button onclick={() => isMobileFilterOpen = false} class="w-full bg-[#C4161C] text-white font-bold py-3.5 rounded-2xl text-sm transition-transform active:scale-[0.98] shadow-md shadow-red-200">
                Terapkan Filter
            </button>
        </div>
    </div>
{/if}