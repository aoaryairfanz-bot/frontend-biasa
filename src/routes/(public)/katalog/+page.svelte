<script>
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores'; 

    let { data } = $props();
    let products = data.products || [];

    // --- OPTIMASI 1: Konstanta filter statis ---
    const NON_BOOK_KEYWORDS = [
        'lilin', 'salib', 'rosario', 'gelang', 'kalung', 
        'patung', 'tempat lilin', 'goa', 'perjamuan', 
        'hosti', 'anggur', 'piala', 'kain', 'kotak', 'alas', 'dw0', 'kcb'
    ];
    const BOOK_KEYWORDS = [
        'alkitab', 'book', 'buku', 'kitab', 'injil', 
        'renungan', 'kamus', 'tafsir', 'kidung', 'puji syukur', 'madah'
    ];

    // --- OPTIMASI 2: Memoize Formatter ---
    const rupiahFormatter = new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    });

    const optimizeUrl = (url, width = 400) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
    };

    // --- STATE ---
    let filter = $state('all');
    let currentPage = $state(1);
    const itemsPerPage = 15; // Ditingkatkan sedikit agar grid lebih penuh

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'nonbook', label: 'Perlengkapan Rohani' },
        { id: 'book', label: 'Buku & Alkitab' }
    ];

    // --- SEARCH LOGIC ---
    let searchTerm = $derived($page.url.searchParams.get('search')?.toLowerCase() || "");

    // --- LOGIKA FILTER GABUNGAN ---
    let allFilteredProducts = $derived.by(() => {
        let baseProducts = products;
        
        if (searchTerm) {
            baseProducts = baseProducts.filter(p => 
                p.name?.toLowerCase().includes(searchTerm) || 
                p.slug?.toLowerCase().includes(searchTerm)
            );
        }

        if (filter === 'all') return baseProducts;
        return baseProducts.filter(item => {
            const text = (item.name + " " + (item.slug || "")).toLowerCase();
            const isNonBook = NON_BOOK_KEYWORDS.some(kw => text.includes(kw));
            const isBook = BOOK_KEYWORDS.some(kw => text.includes(kw));
            if (filter === 'nonbook') return isNonBook || !isBook;
            if (filter === 'book') return isBook;
            return true;
        });
    });

    let totalPages = $derived(Math.ceil(allFilteredProducts.length / itemsPerPage));

    let visibleProducts = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFilteredProducts.slice(startIndex, startIndex + itemsPerPage);
    });

    // --- FUNGSI ---
    function changeCategory(id) {
        filter = id;
        currentPage = 1;
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }

    function formatRupiah(angka) { return rupiahFormatter.format(angka); }
    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<div class="min-h-screen bg-white pb-20 font-sans pt-4 md:pt-8">
    
    <div class="container mx-auto px-4 max-w-[1200px] mb-6 md:mb-8">
        <div class="flex justify-center border-b border-gray-200">
            <div class="flex gap-4 md:gap-8">
                {#each filterOptions as opt}
                <button 
                    onclick={() => changeCategory(opt.id)}
                    class="pb-3 text-[10px] md:text-sm font-bold tracking-wider transition-all duration-200 border-b-4
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
            <div class="flex flex-row justify-between items-center mb-4 gap-2 text-[9px] md:text-[10px] text-gray-400 italic border-b border-gray-50 pb-2">
                
                <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {#if searchTerm}
                        <span class="whitespace-nowrap flex-shrink-0">Hasil:</span>
                        <span class="text-[#C4161C] font-bold not-italic truncate">"{searchTerm}"</span>
                        <span class="text-gray-300 flex-shrink-0">|</span>
                        <a href="/katalog" class="text-blue-500 hover:underline not-italic font-medium flex-shrink-0">Hapus</a>
                    {:else}
                        <span class="whitespace-nowrap">Semua Produk</span>
                    {/if}
                </div>

                <div class="flex items-center gap-2 md:gap-4 flex-shrink-0 whitespace-nowrap ml-2">
                    <span>Total {allFilteredProducts.length}</span>
                    <span class="text-gray-300">|</span>
                    <span>Hal {currentPage}/{totalPages}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-10" in:fade>
                {#each visibleProducts as item (item.id || item.name)}
                    {@const diskon = hitungDiskon(item.price, item.strike_price)}
                    <div class="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col relative group overflow-hidden">
                        <div class="relative w-full aspect-[2/3] bg-gray-50 border-b border-gray-100">
                            {#if diskon > 0}
                                <div class="absolute top-0 right-0 bg-[#C4161C] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 z-10 rounded-bl-lg">-{diskon}%</div>
                            {/if}
                            <a href="/produk/{item.slug}">
                                <img src={optimizeUrl(item.image_1_url, 350)} alt={item.name} loading="lazy" decoding="async" class="w-full h-full object-contain p-2 md:p-4 group-hover:scale-105 transition duration-500" />
                            </a>
                        </div>
                        <div class="p-2 md:p-3 flex flex-col flex-grow">
                            <div class="h-8 md:h-9 mb-1 overflow-hidden">
                                <a href="/produk/{item.slug}" class="text-[10px] md:text-[11px] font-bold text-gray-800 hover:text-[#C4161C] leading-tight line-clamp-2 uppercase">
                                    {item.name}
                                </a>
                            </div>
                            <div class="text-[8px] md:text-[10px] text-gray-400 truncate mb-1 md:mb-2 capitalize font-medium">
                                {item.subcategory || item.category || "Produk Rohani"}
                            </div>
                            <div class="mt-auto mb-2 md:mb-3">
                                {#if item.strike_price > item.price}
                                    <div class="text-[8px] md:text-[10px] text-gray-400 line-through leading-none">{formatRupiah(item.strike_price)}</div>
                                {/if}
                                <div class="text-xs md:text-sm font-black text-[#C4161C] leading-tight">{formatRupiah(item.price)}</div>
                            </div>
                            <button class="w-full bg-gray-50 hover:bg-[#C4161C] hover:text-white text-gray-700 text-[9px] md:text-[10px] font-bold py-1.5 md:py-2 rounded transition border border-gray-100">
                                Beli Sekarang
                            </button>
                        </div>
                    </div>
                {/each}
            </div>

            {#if totalPages > 1}
            <div class="flex justify-center items-center gap-1.5 md:gap-2 pb-10 mt-8">
                <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-30 text-xs">❮</button>
                {#each Array(totalPages) as _, i}
                    {@const pageNum = i + 1}
                    {#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)}
                        <button onclick={() => changePage(pageNum)} class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold transition {currentPage === pageNum ? 'bg-[#C4161C] text-white' : 'bg-white border border-gray-300 text-gray-600'}">{pageNum}</button>
                    {:else if pageNum === currentPage - 2 || pageNum === currentPage + 2}
                        <span class="text-gray-400 text-xs">...</span>
                    {/if}
                {/each}
                <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-30 text-xs">❯</button>
            </div>
            {/if}
        {:else}
            <div class="text-center py-20">
                <h3 class="text-lg font-bold text-gray-400 italic">Tidak ada produk ditemukan</h3>
                {#if searchTerm}
                    <button onclick={() => window.location.href='/katalog'} class="mt-4 text-xs text-[#C4161C] border border-[#C4161C] px-4 py-2 rounded">Lihat Semua Produk</button>
                {/if}
            </div>
        {/if}
    </div>
</div>