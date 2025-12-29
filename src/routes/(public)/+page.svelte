<script>
    import { onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { browser } from '$app/environment';
    import kategoriImg from '$lib/assets/kategori.png';

    let { data } = $props();
    
    const { banners = [], latestProducts = [], bestSellers = [], bestPromos = [], rawSubcategories = data.subcategories || [] } = data;

    // --- SEO METADATA DINAMIS ---
    const pageTitle = "Narwastu - Toko Perlengkapan Rohani & Buku Kristiani Terlengkap";
    const pageDescription = "Temukan berbagai lilin rohani, rosario, salib, patung kudus, dan buku Alkitab berkualitas di Narwastu. Pelayanan sepenuh hati untuk menguatkan iman Anda.";

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

    const rupiahFormatter = new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
    });

    const optimizeUrl = (url, width) => {
        if (!url || !url.includes("cloudinary.com")) return url;
        return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
    };

    let currentIndex = $state(0);
    
    if (browser && banners.length > 1) {
        $effect(() => {
            const timer = setInterval(() => {
                currentIndex = (currentIndex + 1) % banners.length;
            }, 5000);
            return () => clearInterval(timer);
        });
    }

    function formatRupiah(angka) { return rupiahFormatter.format(angka); }
    function hitungDiskon(hargaAsli, hargaCoret) {
        if (!hargaCoret || hargaCoret <= hargaAsli) return 0;
        return Math.round(((hargaCoret - hargaAsli) / hargaCoret) * 100);
    }
</script>

<svelte:head>
    <title>{pageTitle}</title>
    <meta name="description" content={pageDescription} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={pageDescription} />
    <meta property="og:type" content="website" />
    <meta name="keywords" content="toko rohani, lilin rohani, rosario, salib kristen, patung yesus, alkitab, narwastu" />
</svelte:head>

<div class="min-h-screen bg-white font-sans">
    
    <h1 class="sr-only">{pageTitle}</h1>

    <section class="section-banner w-full mb-10 mt-4" aria-label="Promo Utama">
        <div class="container mx-auto px-4">
            <div class="relative w-full h-40 md:h-[380px] rounded-2xl overflow-hidden shadow-md bg-gray-100 mx-auto max-w-[1200px]">
                {#if banners.length > 0}
                    {#each banners as banner, i}
                        {#if i === currentIndex}
                            <img 
                                src={optimizeUrl(banner.image_url, 1200)} 
                                alt="Promo Narwastu - {banner.title || 'Terbaru'}" 
                                in:fade={{ duration: 300 }} 
                                class="absolute inset-0 w-full h-full object-cover" 
                                fetchpriority={i === 0 ? "high" : "low"}
                                loading={i === 0 ? "eager" : "lazy"}
                                decoding="async" 
                            />
                        {/if}
                    {/each}
                    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                        {#each banners as _, i}
                            <div class="h-1.5 rounded-full transition-all duration-500 {i === currentIndex ? 'bg-white w-5' : 'bg-white/60 w-1.5'}"></div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </section>

    <nav class="section-category w-full mb-12" aria-label="Kategori Produk">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="flex gap-6 overflow-x-auto pb-4 px-2 snap-x scrollbar-hide justify-start md:justify-center translate-z-0">
                {#each subcategories as sub}
                    <a href="/katalog?search={sub}" class="flex-shrink-0 flex flex-col items-center gap-3 w-20 cursor-pointer group snap-start">
                        <div class="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-yellow-400 transition-colors duration-200">
                            <img 
                                src={getSubIcon(sub)} 
                                alt="Kategori {sub}" 
                                class="w-9 h-9 object-contain opacity-90 transition-transform duration-200 group-hover:scale-110" 
                                loading="lazy" 
                                decoding="async"
                            />
                        </div>
                        <span class="text-[10px] font-bold text-gray-500 text-center leading-tight line-clamp-1 w-full group-hover:text-yellow-600 uppercase tracking-tighter">
                            {sub}
                        </span>
                    </a>
                {/each}
            </div>
        </div>
    </nav>

    {#snippet productRow(title, rowProducts, badgeText, badgeColor, link)}
        <section class="product-area mb-16" aria-label={title}>
            <div class="container mx-auto px-4 max-w-[1200px]">
                <div class="flex items-center justify-between mb-6 border-b border-gray-100 pb-2">
                    <h2 class="text-xl font-extrabold text-gray-800">{title}</h2>
                    <a href={link} class="text-xs font-bold text-yellow-600 hover:text-yellow-700">Lihat Semua {title}</a>
                </div>
                <div class="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide translate-z-0">
                    {#each rowProducts as item (item.id)}
                        {@const diskon = hitungDiskon(item.price, item.strike_price)}
                        <article class="snap-start flex-shrink-0 w-[170px] md:w-[190px] flex flex-col group min-h-[380px] bg-white">
                            <div class="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-gray-50 border-none shadow-sm group-hover:shadow-md transition-shadow">
                                <a href="/produk/{item.slug}">
                                    <img 
                                        src={optimizeUrl(item.image_1_url, 350)} 
                                        alt="Jual {item.name}" 
                                        loading="lazy" 
                                        decoding="async" 
                                        class="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                                    />
                                </a>
                                {#if badgeText}
                                    <span class="absolute top-3 left-0 {badgeColor} text-white text-[9px] font-black px-2 py-1 rounded-r-full z-10">{badgeText}</span>
                                {/if}
                            </div>
                            
                            <div class="flex flex-col px-1 flex-grow">
                                <h3 class="text-xs font-bold text-gray-800 h-9 line-clamp-2 leading-tight mb-1 lowercase">
                                    <a href="/produk/{item.slug}" class="hover:text-yellow-600">{item.name}</a>
                                </h3>
                                <p class="text-[10px] text-gray-400 font-medium mb-1 capitalize">{item.subcategory || "Produk Narwastu"}</p>
                                
                                <div class="flex flex-col h-10 justify-center">
                                    <span class="text-sm font-black text-gray-900 leading-tight">{formatRupiah(item.price)}</span>
                                    {#if item.strike_price > item.price}
                                        <span class="text-[10px] text-gray-400 line-through leading-none">{formatRupiah(item.strike_price)}</span>
                                    {/if}
                                </div>
                                <button class="mt-auto w-full bg-gray-900 hover:bg-[#C4161C] text-white text-[10px] font-bold py-2.5 rounded-lg transition-all active:scale-95 uppercase tracking-tighter">
                                    Beli Sekarang
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
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .translate-z-0 { transform: translateZ(0); will-change: transform; }
</style>