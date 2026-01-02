<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores'; 
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import { LoaderIcon, FilterIcon, AlertCircleIcon } from 'svelte-feather-icons';

    let { data } = $props();

    // --- STATE ---
    // Inisialisasi dengan array kosong agar aman
    let products = $state([]); 
    let isLoading = $state(true); 

    // --- OPTIMASI 1: Caching & Fetching (Robust) ---
    onMount(async () => {
        const CACHE_KEY = 'katalog_products_v2';
        
        // 1. Cek Cache (Instant Load)
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    products = parsed;
                    isLoading = false; 
                }
            }
        } catch (e) {
            console.error("Cache error", e);
        }

        // 2. Fetch Data Terbaru dari API
        try {
            // Pastikan URL benar
            const res = await fetch(`${PUBLIC_API_URL}/products/`); 
            
            if (res.ok) {
                const result = await res.json();
                console.log("Data API:", result); // Debugging

                // --- SAFETY CHECK: Pastikan format data benar ---
                let finalData = [];
                if (Array.isArray(result)) {
                    finalData = result;
                } else if (result.products && Array.isArray(result.products)) {
                    finalData = result.products;
                } else if (result.data && Array.isArray(result.data)) {
                    finalData = result.data;
                }

                // Hanya update jika ada data
                if (finalData.length > 0) {
                    products = finalData;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(finalData));
                }
            } else {
                console.error("API Error:", res.status);
            }
        } catch (e) {
            console.error("Gagal update produk:", e);
        } finally {
            isLoading = false;
        }
    });

    // --- OPTIMASI 2: Constants & Utils ---
    const NON_BOOK_KEYWORDS = ['lilin', 'salib', 'rosario', 'gelang', 'kalung', 'patung', 'tempat lilin', 'goa', 'perjamuan', 'hosti', 'anggur', 'piala', 'kain', 'kotak', 'alas', 'dw0', 'kcb'];
    const BOOK_KEYWORDS = ['alkitab', 'book', 'buku', 'kitab', 'injil', 'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah'];

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatRupiah = (num) => rupiahFormatter.format(num);

    const optimizeUrl = (url, width) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        // w_200 + q_auto:eco = Super Ringan
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
                const text = ((item.name || "") + " " + (item.slug || "")).toLowerCase();
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
        
        {#if isLoading && products.length === 0}
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mb-10">
                {#each Array(10) as _}
                    <div class="bg-gray-50 rounded-xl aspect-[3/4] animate-pulse"></div>
                {/each}
            </div>

        {:else if visibleProducts.length > 0}
            <div class="flex flex-row justify-between items-center mb-4 gap-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-50 pb-2">
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Hasil:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate">"{searchTerm}"</span>
                        <a href="/katalog" class="ml-2 text-blue-600 hover:underline font-medium flex-shrink-0">Hapus</a>
                    {:else}
                        <span class="font-bold">Semua Produk</span>
                    {/if}
                </div>
                <div class="flex-shrink-0">
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
</style>