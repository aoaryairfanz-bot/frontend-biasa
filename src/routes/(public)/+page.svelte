<script>
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition'; 
    import { browser } from '$app/environment';
    import { XIcon, AlertCircleIcon, RefreshCwIcon, MapPinIcon, MessageCircleIcon, ChevronRightIcon, TagIcon } from 'svelte-feather-icons'; 
    import { PUBLIC_API_URL } from '$env/static/public'; 

    // --- STATE ---
    let banners = $state([]);
    let products = $state([]); 
    
    // --- STATE CABANG & MODAL BELI ---
    let branches = $state([]); 
    let showBranchModal = $state(false);
    let selectedProduct = $state(null);
    let isLoadingBranches = $state(false);

    // State Loading & Error
    let loadingBanner = $state(true);
    let loadingProducts = $state(true);
    let errorMsg = $state("");
    
    let currentIndex = $state(0);

    // --- DERIVED DATA ---
    const displayBanners = $derived(banners.slice(0, 5));
    const latestProducts = $derived(products.slice(0, 12));

    const bestSellers = $derived.by(() => {
        if (products.length === 0) return [];
        return [...products].sort(() => 0.5 - Math.random()).slice(0, 12);
    });

    const bestPromos = $derived.by(() => {
        if (products.length === 0) return [];
        return products
            .filter(p => p.discount_label || (p.display_strike_price > p.final_price))
            .sort((a, b) => {
                const discA = parseInt(a.discount_label) || 0;
                const discB = parseInt(b.discount_label) || 0;
                return discB - discA;
            })
            .slice(0, 12);
    });

    // Data Kategori Gambar Statis Baginda
    const mainCategories = [
        { id: 'rohani', label: 'Perlengkapan Rohani', link: '/katalog?category=rohani', imageUrl: 'https://res.cloudinary.com/dqyztrelw/image/upload/q_auto/f_auto/v1775718745/018cb695-28c1-46cd-abd5-4afe9f8c94ea.png' },
        { id: 'alkitab', label: 'Alkitab', link: '/katalog?category=alkitab', imageUrl: 'https://res.cloudinary.com/dqyztrelw/image/upload/q_auto/f_auto/v1775718461/55b91614-277a-4372-ac52-4a534a1fddd3.png' },
        { id: 'buku', label: 'Buku', link: '/katalog?category=buku', imageUrl: 'https://res.cloudinary.com/dqyztrelw/image/upload/q_auto/f_auto/v1775722688/034b01a0-dea1-4125-b816-42110d8db009.png' },
        { id: 'sekolah-minggu', label: 'Sekolah Minggu', link: '/katalog?search=sekolah%20minggu', imageUrl: 'https://res.cloudinary.com/dqyztrelw/image/upload/q_auto/f_auto/v1775720792/d6c63fd9-e819-4839-ac9b-9587bb2e2003.png' }
    ];

    // --- FETCH DATA ---
    onMount(async () => {
        const CACHE_KEY = 'home_data_optimized_v2';
        const cached = sessionStorage.getItem(CACHE_KEY);
        
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data.banners) { banners = data.banners; loadingBanner = false; }
                if (data.products) { products = data.products; loadingProducts = false; }
                if (data.branches) { branches = data.branches; }
            } catch (e) { console.error(e); }
        }

        await Promise.all([
            fetchBannerData(),
            fetchProductData(), 
            fetchBranches()
        ]);
    });

    async function fetchProductData() {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/?limit=20&sort=newest&t=${Date.now()}`);
            if (res.ok) {
                let raw = await res.json();
                let cleanData = [];
                if (raw.data) cleanData = raw.data;
                else if (Array.isArray(raw)) cleanData = raw; 
                
                products = cleanData.slice(0, 20); 
                updateCache();
            } else { errorMsg = "Gagal memuat produk."; }
        } catch (e) { errorMsg = "Kesalahan jaringan."; }
        finally { loadingProducts = false; }
    }

    async function fetchBranches() {
        isLoadingBranches = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                branches = Array.isArray(raw) ? raw : (raw.data || []);
                updateCache();
            }
        } catch (e) { console.error("Gagal load cabang", e); }
        finally { isLoadingBranches = false; }
    }

    async function fetchBannerData() {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/banners/`); 
            if (res.ok) {
                let raw = await res.json();
                if (!Array.isArray(raw)) raw = raw.data || raw.banners || [];
                banners = raw; 
                updateCache();
            }
        } catch (e) { console.error("Banner Error", e); } 
        finally { loadingBanner = false; }
    }

    function updateCache() {
        if (banners.length > 0 && products.length > 0) {
            sessionStorage.setItem('home_data_optimized_v2', JSON.stringify({ 
                banners, products, branches
            }));
        }
    }

    if (browser) {
        $effect(() => {
            if (displayBanners.length > 1) {
                const timer = setInterval(() => { currentIndex = (currentIndex + 1) % displayBanners.length; }, 5000);
                return () => clearInterval(timer);
            }
        });
    }

    // --- ACTIONS ---
    function chatBranch(branchPhone) {
        if (!selectedProduct || !branchPhone) return;
        const phone = branchPhone.replace(/\D/g, '').replace(/^0/, '62');
        const urlProduk = `${window.location.origin}/produk/${selectedProduct.slug}`;
        const pesan = `*${selectedProduct.name}*\nHarga: ${formatRupiah(selectedProduct.final_price)}\nLink: ${urlProduk}\n\nHallo Admin, apakah stok produk ini masih tersedia di cabang kakak?`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
        showBranchModal = false; 
    }

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    function formatRupiah(angka) { return rupiahFormatter.format(angka || 0); }
    function optimizeUrl(url) { return url; }
</script>

<svelte:head>
    <title>Narwastu - Toko Kristiani</title>
    <meta name="description" content="Toko Rohani Narwastu menjual perlengkapan ibadah." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
</style>

<div class="min-h-screen bg-white font-sans pb-24 text-gray-800" style="font-family: 'Poppins', sans-serif !important;">
    
    <section class="w-full mt-4 mb-16" aria-label="Promo Utama">
        <div class="container mx-auto px-4 max-w-[1200px]">
            {#if loadingBanner && displayBanners.length === 0}
                <div class="relative w-full aspect-[2.5/1] md:aspect-[3/1] rounded-sm bg-gray-100 animate-pulse"></div>
            {:else if displayBanners.length > 0}
                <div class="relative w-full aspect-[2.5/1] md:aspect-[3/1] rounded-sm overflow-hidden bg-gray-50 group">
                    {#each displayBanners as banner, i}
                        {#if i === currentIndex}
                            <div in:fade={{ duration: 800 }} out:fade={{ duration: 800 }} class="absolute inset-0 w-full h-full">
                                <img src={optimizeUrl(banner.image_url)} alt="Promo" class="w-full h-full object-cover" fetchpriority="high" loading="eager" decoding="async" />
                            </div>
                        {/if}
                    {/each}
                    <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                        {#each displayBanners as _, i}
                            <button onclick={() => currentIndex = i} class="h-1.5 rounded-none transition-all duration-300 {i === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}"></button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </section>

    <section class="w-full mb-14 text-center" aria-label="Sambutan">
        <div class="container mx-auto px-4 max-w-[800px]">
            <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                Narwastu Toko Kristiani
            </h1>
            <p class="text-sm md:text-base text-gray-500 font-light leading-relaxed">
                Menyediakan aneka barang rohani Kristiani dan aneka buku rohani berkualitas untuk menemani perjalanan iman Anda.
            </p>
        </div>
    </section>

    <section class="w-full mb-20" aria-label="Kategori Gambar">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {#each mainCategories as cat}
                    <a href={cat.link} class="group relative block w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-gray-100">
                        <img 
                            src={cat.imageUrl} 
                            alt={cat.label} 
                            class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                            loading="lazy" 
                            decoding="async"
                        />
                        <div class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors z-10 duration-500"></div>
                        
                        <div class="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                            <span class="text-white text-base md:text-lg font-semibold tracking-wide text-center drop-shadow-md mb-2">
                                {cat.label}
                            </span>
                            <span class="text-white text-[9px] md:text-[10px] uppercase tracking-widest border-b border-white pb-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                Lihat Koleksi
                            </span>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </section>

    {#snippet productCard(item)}
        <div class="group relative flex flex-col h-full cursor-pointer bg-white">
            <div class="relative w-full aspect-[3/4] mb-4 overflow-hidden bg-white group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <a href="/produk/{item.slug}" class="block w-full h-full border border-gray-100">
                    <img src={optimizeUrl(item.image_1_url)} alt={item.name} loading="lazy" decoding="async" class="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                </a>
                {#if item.discount_label}
                    <span class="absolute top-2 left-2 bg-[#C4161C] text-white text-[10px] font-semibold px-2 py-1 z-10 uppercase tracking-wider">
                        {item.discount_label}
                    </span>
                {/if}
            </div>
            
            <div class="flex flex-col flex-grow px-1">
                <h3 class="text-sm font-normal text-gray-800 leading-snug line-clamp-2 mb-1 group-hover:text-[#C4161C] transition-colors">
                    <a href="/produk/{item.slug}">{item.name}</a>
                </h3>
                
                <div class="mt-auto pt-1 flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-gray-900">{formatRupiah(item.final_price)}</span>
                    {#if item.display_strike_price > item.final_price}
                        <span class="text-xs text-gray-400 line-through decoration-gray-300">{formatRupiah(item.display_strike_price)}</span>
                    {/if}
                </div>
            </div>
        </div>
    {/snippet}

    {#if bestPromos.length > 0}
    <section class="mb-20" aria-label="Promo">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="text-center mb-10 flex flex-col items-center">
                <h2 class="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">Promo Spesial</h2>
                <div class="h-0.5 w-12 bg-[#C4161C] mx-auto mb-4"></div>
                <p class="text-xs md:text-sm text-gray-500">Penawaran terbaik minggu ini</p>
            </div>
            
            <div class="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {#each bestPromos as item}
                    <div class="snap-start flex-shrink-0 w-[160px] md:w-[220px]">{@render productCard(item)}</div>
                {/each}
            </div>
            
            <div class="text-center mt-6">
                <a href="/katalog?sort=promo" class="inline-block border-b border-gray-900 text-gray-900 text-xs font-semibold uppercase tracking-widest pb-1 hover:text-[#C4161C] hover:border-[#C4161C] transition-colors">
                    Lihat Semua Promo
                </a>
            </div>
        </div>
    </section>
    {/if}

    <section class="mb-20" aria-label="Terbaru">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="text-center mb-10 flex flex-col items-center">
                <h2 class="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">Koleksi Terbaru</h2>
                <div class="h-0.5 w-12 bg-[#C4161C] mx-auto mb-4"></div>
                <p class="text-xs md:text-sm text-gray-500">Temukan produk terbaru dari kami</p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-12">
                {#if loadingProducts && products.length === 0}
                    {#each Array(5) as _}
                        <div class="flex flex-col gap-2">
                            <div class="w-full aspect-[3/4] bg-gray-100 animate-pulse"></div>
                            <div class="h-4 w-3/4 bg-gray-100 animate-pulse mt-2"></div>
                            <div class="h-4 w-1/2 bg-gray-100 animate-pulse"></div>
                        </div>
                    {/each}
                {:else}
                    {#each latestProducts as item}{@render productCard(item)}{/each}
                {/if}
            </div>

            <div class="text-center mt-12">
                <a href="/katalog?sort=newest" class="inline-block border-b border-gray-900 text-gray-900 text-xs font-semibold uppercase tracking-widest pb-1 hover:text-[#C4161C] hover:border-[#C4161C] transition-colors">
                    Lihat Semua Koleksi
                </a>
            </div>
        </div>
    </section>

    <section class="mb-16" aria-label="Best Seller">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="text-center mb-10 flex flex-col items-center">
                <h2 class="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">Paling Dicari</h2>
                <div class="h-0.5 w-12 bg-[#C4161C] mx-auto mb-4"></div>
                <p class="text-xs md:text-sm text-gray-500">Produk rohani terfavorit pelanggan kami</p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-12">
                {#each bestSellers as item}{@render productCard(item)}{/each}
            </div>
        </div>
    </section>

    {#if showBranchModal}
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div class="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Pilih Lokasi Cabang</h3>
                    <p class="text-xs text-gray-500">Hubungi cabang terdekat via WhatsApp</p>
                </div>
                <button onclick={() => showBranchModal = false} class="p-2 hover:bg-gray-100 text-gray-400 hover:text-[#C4161C] transition"><XIcon size="20"/></button>
            </div>
            <div class="p-6 bg-white overflow-y-auto custom-scrollbar flex-1">
                {#if isLoadingBranches}
                    <div class="text-center py-10 text-gray-400 animate-pulse text-sm">Memuat data...</div>
                {:else if branches.length === 0}
                    <div class="text-center py-10 text-gray-400 text-sm">Belum ada data cabang.</div>
                {:else}
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {#each branches as branch}
                            <button onclick={() => chatBranch(branch.whatsapp)} class="border border-gray-100 p-4 hover:border-[#C4161C] hover:bg-red-50/10 transition-all text-left group h-full flex flex-col justify-between hover:shadow-sm active:scale-[0.98]">
                                <div>
                                    <div class="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{#if branch.id === 1} PUSAT {:else} CABANG {/if}</div>
                                    <h4 class="font-semibold text-gray-800 text-xs md:text-sm leading-snug mb-3 group-hover:text-[#C4161C] transition-colors">{branch.name.replace('Narwastu ', '')}</h4>
                                </div>
                                <div class="flex items-center gap-1.5 text-[#C4161C] text-[10px] font-semibold mt-auto bg-white border border-[#C4161C]/20 px-2 py-1.5 w-fit group-hover:bg-[#C4161C] group-hover:text-white transition-colors">
                                    <MessageCircleIcon size="12"/><span>Chat WA</span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
    {/if}

    {#if errorMsg}
        <div class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 shadow-xl z-50 text-sm font-semibold flex items-center gap-3">
            <AlertCircleIcon size="18" /><span>{errorMsg}</span><button onclick={() => window.location.reload()}><RefreshCwIcon size="16"/></button>
        </div>
    {/if}

</div>