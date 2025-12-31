<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition'; 
    import { browser } from '$app/environment';
    import { page } from '$app/stores'; 
    import { XIcon, ShoppingBagIcon } from 'svelte-feather-icons'; 
    import { PUBLIC_API_URL } from '$env/static/public'; 
    import kategoriImg from '$lib/assets/kategori.png';

    let { data } = $props();
    
    const { banners = [], latestProducts = [], bestSellers = [], bestPromos = [], rawSubcategories = data.subcategories || [] } = data;

    // --- STATE ---
    let showBranchModal = $state(false);
    let selectedProduct = $state(null);
    let branches = $state([]); 
    let currentIndex = $state(0);

    // Ambil 5 Banner Terbaru Saja
    const displayBanners = $derived(banners.slice(0, 5));

    // --- OPTIMASI GAMBAR MAXIMAL (Performance Score 90+) ---
    const optimizeUrl = (url, width) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        // q_auto:eco = Kompresi agresif tapi visual bagus (Sangat ringan di HP)
        // f_auto = Format otomatis (WebP/AVIF)
        return url.replace("/upload/", `/upload/f_auto,q_auto:eco,w_${width}/`);
    };

    // --- FETCH DATA CABANG ---
    onMount(async () => {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches`);
            if (res.ok) {
                const result = await res.json();
                branches = result.filter(b => b.is_active && b.whatsapp); 
            }
        } catch (e) {
            console.error("Gagal ambil cabang", e);
        }
    });

    // --- BANNER SLIDE AUTO ---
    if (browser && displayBanners.length > 1) {
        $effect(() => {
            const timer = setInterval(() => {
                currentIndex = (currentIndex + 1) % displayBanners.length;
            }, 5000);
            return () => clearInterval(timer);
        });
    }

    // --- ACTIONS ---
    function openBuyModal(product) {
        selectedProduct = product;
        showBranchModal = true;
    }

    function getBranchWALink(branchPhone) {
        if (!selectedProduct) return '#';
        const cleanPhone = branchPhone.replace(/\D/g, '');
        // Menyertakan Link Produk agar muncul Preview Gambar di WA
        const productLink = `${$page.url.origin}/produk/${selectedProduct.slug}`;
        const text = `Halo, saya tertarik dengan produk ini:\n${productLink}\n\nNama: ${selectedProduct.name}\nMohon infonya.`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }

    // --- CONSTANTS ---
    const pageTitle = "Narwastu - Toko Perlengkapan Rohani & Buku Kristiani";
    const subcategories = $derived.by(() => {
        const unique = new Set();
        for (const s of rawSubcategories) {
            const trimmed = s.trim();
            unique.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
        }
        return Array.from(unique).sort();
    });

    const ICON_MAP = {
        'lilin': 'https://cdn-icons-png.flaticon.com/512/10632/10632653.png',
        'rosario': 'https://cdn-icons-png.flaticon.com/512/3552/3552047.png',
        'salib': 'https://cdn-icons-png.flaticon.com/512/18635/18635997.png',
        'patung': 'https://cdn-icons-png.flaticon.com/512/15119/15119407.png',
        'alkitab': 'https://cdn-icons-png.flaticon.com/512/2142/2142712.png',
        'gelang': 'https://cdn-icons-png.flaticon.com/512/3985/3985817.png',
        'natal': 'https://cdn-icons-png.flaticon.com/512/6279/6279334.png',
        'buku': 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
        'kalung': 'https://cdn-icons-png.flaticon.com/512/10437/10437198.png'
    };

    const getSubIcon = (name) => ICON_MAP[name.toLowerCase()] || kategoriImg;
    const rupiahFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    function formatRupiah(angka) { return rupiahFormatter.format(angka); }
    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<svelte:head>
    <title>{pageTitle}</title>
    <meta name="description" content="Toko Rohani Narwastu terlengkap." />
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link 
        rel="preload" 
        as="style" 
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" 
        onload="this.onload=null;this.rel='stylesheet'"
    >
    <noscript>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap">
    </noscript>
</svelte:head>

<div class="min-h-screen bg-white font-sans relative">
    <h1 class="sr-only">{pageTitle}</h1>

    <section class="w-full mb-8 mt-4" aria-label="Promo Utama">
        <div class="container mx-auto px-4">
            <div class="relative w-full aspect-[2.5/1] rounded-2xl overflow-hidden shadow-sm bg-gray-100 mx-auto max-w-[1200px]">
                {#if displayBanners.length > 0}
                    {#each displayBanners as banner, i}
                        {#if i === currentIndex}
                            <div 
                                in:fly={{ x: 300, duration: 400 }} 
                                out:fly={{ x: -300, duration: 400 }} 
                                class="absolute inset-0 w-full h-full"
                            >
                                <img 
                                    srcset="{optimizeUrl(banner.image_url, 480)} 480w, 
                                            {optimizeUrl(banner.image_url, 800)} 800w, 
                                            {optimizeUrl(banner.image_url, 1200)} 1200w"
                                    sizes="(max-width: 600px) 480px, (max-width: 1000px) 800px, 1200px"
                                    src={optimizeUrl(banner.image_url, 1200)} 
                                    alt={banner.title || 'Promo'} 
                                    class="w-full h-full object-cover" 
                                    fetchpriority={i === 0 ? "high" : "low"}
                                    loading={i === 0 ? "eager" : "lazy"}
                                    decoding="async"
                                />
                            </div>
                        {/if}
                    {/each}
                    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                        {#each displayBanners as _, i}
                            <div class="h-1.5 rounded-full transition-all duration-300 {i === currentIndex ? 'bg-white w-5' : 'bg-white/60 w-1.5'}"></div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </section>

    <nav class="w-full mb-8" aria-label="Kategori">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="flex gap-4 overflow-x-auto pb-4 px-1 snap-x scrollbar-hide justify-start md:justify-center">
                {#each subcategories as sub}
                    <a href="/katalog?search={sub}" class="flex-shrink-0 flex flex-col items-center gap-2 w-[70px] md:w-20 cursor-pointer group snap-start">
                        <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-yellow-400 transition-colors">
                            <img 
                                src={getSubIcon(sub)} 
                                alt={sub} 
                                class="w-7 h-7 md:w-9 md:h-9 object-contain opacity-90" 
                                loading="lazy" width="36" height="36"
                            />
                        </div>
                        <span class="text-[9px] md:text-[10px] font-bold text-gray-500 text-center leading-tight line-clamp-2 w-full uppercase tracking-tighter">
                            {sub}
                        </span>
                    </a>
                {/each}
            </div>
        </div>
    </nav>

    {#snippet productRow(title, rowProducts, badgeText, badgeColor, link)}
        <section class="mb-10" aria-label={title}>
            <div class="container mx-auto px-4 max-w-[1200px]">
                <div class="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                    <h2 class="text-lg md:text-xl font-extrabold text-gray-800">{title}</h2>
                    <a href={link} class="text-xs font-bold text-yellow-600 hover:text-yellow-700">Lihat Semua</a>
                </div>
                <div class="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                    {#each rowProducts as item (item.id)}
                        <article class="snap-start flex-shrink-0 w-[150px] md:w-[190px] flex flex-col group bg-white">
                            <div class="relative w-full aspect-[3/4] mb-2 overflow-hidden rounded-xl bg-gray-50 border-none shadow-sm">
                                <a href="/produk/{item.slug}">
                                    <img 
                                        src={optimizeUrl(item.image_1_url, 250)} 
                                        alt={item.name} 
                                        loading="lazy" decoding="async" 
                                        width="150" height="200"
                                        class="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                                    />
                                </a>
                                {#if badgeText}
                                    <span class="absolute top-2 left-0 {badgeColor} text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-r-full z-10">{badgeText}</span>
                                {/if}
                            </div>
                            
                            <div class="flex flex-col px-1 flex-grow">
                                <h3 class="text-xs font-bold text-gray-800 h-8 line-clamp-2 leading-tight mb-1 lowercase">
                                    <a href="/produk/{item.slug}">{item.name}</a>
                                </h3>
                                <div class="flex flex-col h-9 justify-center mb-2">
                                    <span class="text-sm font-black text-gray-900">{formatRupiah(item.price)}</span>
                                    {#if item.strike_price > item.price}
                                        <span class="text-[9px] text-gray-400 line-through">{formatRupiah(item.strike_price)}</span>
                                    {/if}
                                </div>
                                <button onclick={() => openBuyModal(item)} class="mt-auto w-full bg-gray-900 hover:bg-[#C4161C] text-white text-[10px] font-bold py-2 rounded-lg active:scale-95 uppercase tracking-tighter">
                                    Beli
                                </button>
                            </div>
                        </article>
                    {/each}
                </div>
            </div>
        </section>
    {/snippet}

    {@render productRow("Produk Terbaru", latestProducts, "New", "bg-[#C4161C]", "/katalog?sort=newest")}
    {@render productRow("Best Seller", bestSellers, "Hot", "bg-yellow-500", "/katalog?sort=bestseller")}
    {@render productRow("Promo Spesial", bestPromos, null, "", "/promo")}

    {#if showBranchModal}
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div class="bg-white w-[95%] md:w-full md:max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                <div class="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h3 class="text-base font-bold text-gray-800">Pilih Cabang</h3>
                        <p class="text-[10px] text-gray-500 truncate max-w-[200px]">Item: <span class="text-[#C4161C]">{selectedProduct?.name}</span></p>
                    </div>
                    <button onclick={() => showBranchModal = false} class="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100 rounded-full">
                        <XIcon size="18" />
                    </button>
                </div>

                <div class="p-4 overflow-y-auto custom-scrollbar bg-white">
                    {#if branches.length === 0}
                        <div class="text-center py-6 text-gray-400">
                            <ShoppingBagIcon size="24" class="mx-auto mb-2 opacity-50"/>
                            <p class="text-xs">Memuat...</p>
                        </div>
                    {:else}
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {#each branches as branch}
                                <a 
                                    href={getBranchWALink(branch.whatsapp)} 
                                    target="_blank"
                                    class="flex items-center justify-center text-center px-2 py-3 rounded-lg border border-gray-200 hover:border-[#C4161C] hover:bg-red-50 active:scale-95 transition-all duration-150 group h-full"
                                >
                                    <span class="text-[11px] font-bold text-gray-700 group-hover:text-[#C4161C] leading-tight">
                                        {branch.name.replace('Cabang ', '').replace('Narwastu ', '')}
                                    </span>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
</style>