<script>
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { Share2Icon, CheckIcon, XIcon, MessageCircleIcon, MapPinIcon } from 'svelte-feather-icons';
    import { fly, fade } from 'svelte/transition';

    // AMBIL DATA DARI +page.js
    let { data } = $props();
    let product = $derived(data.product); 
    let slug = $derived(data.slug);

    // --- STATE PENDUKUNG ---
    let relatedProducts = $state([]);       
    let isLoadingRelated = $state(true);
    let isDescriptionExpanded = $state(false);
    let isCopied = $state(false);

    // --- STATE CABANG & MODAL ---
    let branches = $state([]); 
    let showBranchModal = $state(false); 
    let isLoadingBranches = $state(false);

    // Default Alamat Pusat
    let centralBranch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281"
    });

    // --- SLIDER STATE ---
    let activeIndex = $state(0); 
    let sliderRef; 

    // List Media
    let mediaList = $derived.by(() => {
        if (!product) return [];
        let list = [product.image_1_url, product.image_2_url, product.image_3_url].filter(Boolean);
        if (product.video_url) list.push(product.video_url);
        return list;
    });

    // --- EFFECT ---
    $effect(() => {
        if (product) {
            activeIndex = 0;
            loadBranches();
            loadRelatedProducts();
        }
    });

    // --- LOAD DATA ---
    async function loadBranches() {
        isLoadingBranches = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                branches = list; 
                const pusat = list.find(b => b.id === 1);
                if (pusat) centralBranch = pusat; 
            }
        } catch (error) { console.error("Gagal load cabang:", error); }
        finally { isLoadingBranches = false; }
    }

    async function loadRelatedProducts() {
        isLoadingRelated = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/`); 
            if (res.ok) {
                const allProducts = await res.json();
                let list = Array.isArray(allProducts) ? allProducts : (allProducts.products || []);
                relatedProducts = list.filter(p => p.slug !== slug).slice(0, 6); 
            }
        } catch (error) { console.error(error); } finally { isLoadingRelated = false; }
    }

    // --- ACTIONS ---
    function handleShare() {
        const shareData = {
            title: product.name,
            text: `Cek produk ini: ${product.name}`,
            url: $page.url.href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            navigator.clipboard.writeText($page.url.href);
            isCopied = true;
            setTimeout(() => isCopied = false, 2000);
        }
    }

    function openBuyModal() {
        showBranchModal = true;
    }

    // [UPDATE] Fix Kirim Gambar ke WA
    function chatBranch(branchPhone) {
        if (!branchPhone) return;
        const phone = branchPhone.replace(/\D/g, '').replace(/^0/, '62');
        const urlProduk = $page.url.href;
        
        // Ambil URL Gambar Utama (jika ada)
        const imgUrl = product.image_1_url || '';

        const pesan = 
            `*${product.name}*\n` +
            `Harga: ${formatRupiah(product.final_price)}\n` + // Pakai harga final
            `Link: ${urlProduk}\n` + 
            (imgUrl ? `Gambar: ${imgUrl}\n\n` : `\n`) +
            `Hallo Admin, apakah stok produk ini masih tersedia?`;
            
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
        showBranchModal = false; 
    }

    // --- UI UTILS ---
    function scrollTo(index) {
        if (!sliderRef || index < 0 || index >= mediaList.length) return;
        activeIndex = index;
        const scrollAmount = sliderRef.offsetWidth * index;
        sliderRef.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
    
    function handleScroll() {
        if (!sliderRef) return;
        const newIndex = Math.round(sliderRef.scrollLeft / sliderRef.offsetWidth);
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < mediaList.length) activeIndex = newIndex;
    }

    function optimizeCloudinary(url) { return url; }
    function isVideo(url) { return url === product?.video_url; }
    function formatRupiah(n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0); }
    
    function formatDimensi() {
        const { length: p, width: l, height: t } = product || {};
        if (p || l || t) return `${p || 0}x${l || 0}x${t || 0}cm`;
        return "-";
    }
</script>

<svelte:head>
    <title>{product ? product.name : 'Narwastu Store'}</title>
    <meta property="og:type" content="product" />
    <meta property="og:title" content={product ? product.name : 'Narwastu Store'} />
    <meta property="og:description" content={product ? `Harga: ${formatRupiah(product.final_price)}` : 'Toko Rohani Terlengkap'} />
    <meta property="og:url" content={$page.url.href} />
    <meta property="og:image" content={product ? product.image_1_url : ''} />
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    img, video { content-visibility: auto; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
</style>

<div class="min-h-screen bg-white pb-32 font-sans text-gray-800 relative">
    
    {#if product}
        <div class="border-b border-gray-100 mb-4 bg-white sticky top-0 z-20">
            <div class="container mx-auto px-4 py-3 max-w-7xl text-[10px] md:text-xs font-medium text-gray-500 truncate flex items-center">
                <a href="/" class="hover:text-[#C4161C]">Home</a> <span class="mx-1">/</span> 
                <a href="/katalog" class="hover:text-[#C4161C]">Katalog</a> <span class="mx-1">/</span> 
                <span class="text-gray-900 truncate">{product.name}</span>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl">
            <div class="flex flex-col md:flex-row gap-8 md:gap-12">
                
                <div class="w-full md:w-[450px] shrink-0 flex flex-col gap-4">
                    <div class="relative w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
                        
                        {#if product.discount_label}
                            <div class="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                {product.discount_label} OFF
                            </div>
                        {/if}

                        <div bind:this={sliderRef} onscroll={handleScroll} class="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide">
                            {#each mediaList as item, i}
                                <div class="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-transparent">
                                    {#if isVideo(item)}
                                        <video src={item} class="w-full h-full object-contain" autoplay muted loop playsinline></video>
                                    {:else}
                                        <img 
                                            src={optimizeCloudinary(item)} 
                                            alt="{product.name}" 
                                            class="w-full h-full object-contain transition-transform duration-500 hover:scale-105" 
                                            loading={i === 0 ? "eager" : "lazy"} 
                                        />
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                        {#each mediaList as item, i}
                            <button 
                                onclick={() => scrollTo(i)} 
                                class="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition flex-shrink-0 bg-gray-50
                                {activeIndex === i ? 'ring-2 ring-[#C4161C] opacity-100' : 'opacity-50 hover:opacity-100'}"
                            >
                                {#if isVideo(item)} <video src={item} class="w-full h-full object-cover" muted></video>
                                {:else} <img src={optimizeCloudinary(item)} alt="Thumb" class="w-full h-full object-cover" /> {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex-1 flex flex-col min-w-0 pt-2">
                    <div class="flex flex-col gap-2 mb-6">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.author || "Narwastu Store"}</span>
                        <h1 class="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
                    </div>
                    
                    <div class="flex flex-col gap-1 mb-8">
                        <div class="flex items-baseline gap-3">
                            <span class="text-3xl md:text-5xl font-black text-[#C4161C] tracking-tight">
                                {formatRupiah(product.final_price)}
                            </span>
                            
                            {#if product.display_strike_price > product.final_price}
                                <span class="text-sm md:text-base text-gray-400 line-through font-medium">
                                    {formatRupiah(product.display_strike_price)}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Spesifikasi</h3>
                        <div class="space-y-3 text-sm text-gray-600">
                            {#if product.sku}
                                <div class="flex justify-between py-2 border-b border-gray-50">
                                    <span class="text-gray-400">SKU</span>
                                    <span class="font-bold text-gray-900">{product.sku}</span>
                                </div>
                            {/if}
                            <div class="flex justify-between py-2 border-b border-gray-50">
                                <span class="text-gray-400">Berat</span>
                                <span class="font-bold text-gray-900">{product.weight ? product.weight + ' gr' : '-'}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-50">
                                <span class="text-gray-400">Stok</span>
                                <span class="font-bold text-gray-900">{product.stock || "-"}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-50">
                                <span class="text-gray-400">Dimensi</span>
                                <span class="font-bold text-gray-900">{formatDimensi()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Deskripsi</h3>
                        <div class="relative">
                            <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line text-justify {isDescriptionExpanded ? '' : 'line-clamp-4'}">
                                {product.description || "Deskripsi belum tersedia."}
                            </p>
                            {#if !isDescriptionExpanded && (product.description?.length > 150)}
                                <button onclick={() => isDescriptionExpanded = true} class="text-xs font-bold text-[#C4161C] mt-2 hover:underline">Baca Selengkapnya</button>
                            {:else if isDescriptionExpanded}
                                <button onclick={() => isDescriptionExpanded = false} class="text-xs font-bold text-gray-400 mt-2 hover:text-gray-600">Tutup</button>
                            {/if}
                        </div>
                    </div>

                    <div class="hidden md:flex gap-4 items-center mt-auto pt-6 border-t border-gray-100">
                        <div class="text-xl font-bold text-gray-900 mr-4">
                            {formatRupiah(product.final_price)}
                        </div>
                        <button onclick={openBuyModal} class="flex-1 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold h-14 rounded-xl shadow-lg hover:shadow-xl transition-all text-base tracking-wide uppercase flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                            <span>Beli Sekarang</span>
                        </button>
                        <button onclick={handleShare} class="w-14 h-14 flex items-center justify-center border-2 border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition" title="Bagikan">
                            {#if isCopied} <CheckIcon size="24" class="text-green-600" />
                            {:else} <Share2Icon size="24" /> {/if}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-16 pt-10 border-t border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-6">Mungkin Anda Suka</h3>
            <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
                {#if isLoadingRelated}
                    {#each Array(6) as _}<div class="bg-gray-50 rounded-xl aspect-[3/4] animate-pulse"></div>{/each}
                {:else}
                    {#each relatedProducts as item}
                        <a href="/produk/{item.slug}" class="group block">
                            <div class="bg-gray-50 rounded-xl aspect-[3/4] mb-3 overflow-hidden">
                                <img src={optimizeCloudinary(item.image_1_url)} class="w-full h-full object-contain p-4 group-hover:scale-110 transition duration-500" alt={item.name} loading="lazy">
                            </div>
                            <h4 class="text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-[#C4161C] uppercase leading-relaxed">{item.name}</h4>
                            <div class="text-xs font-bold text-[#C4161C]">{formatRupiah(item.final_price)}</div>
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3 items-center">
            <div class="flex-1">
                <div class="text-[10px] text-gray-400 font-bold uppercase">Total Harga</div>
                <div class="text-lg font-black text-[#C4161C] leading-none">{formatRupiah(product.final_price)}</div>
            </div>
            <button onclick={handleShare} class="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 bg-white">
                {#if isCopied} <CheckIcon size="20" class="text-green-600" />
                {:else} <Share2Icon size="20" /> {/if}
            </button>
            <button onclick={openBuyModal} class="bg-[#C4161C] text-white font-bold h-12 px-6 rounded-xl text-sm shadow-md uppercase tracking-wide">
                Beli
            </button>
        </div>
    
    {:else}
        <div class="container mx-auto px-4 max-w-7xl pt-6" in:fade>
            <div class="flex flex-col md:flex-row gap-12 animate-pulse">
                <div class="w-full md:w-[450px] aspect-square bg-gray-100 rounded-2xl"></div>
                <div class="flex-1 space-y-6">
                    <div class="h-8 bg-gray-100 rounded w-3/4"></div>
                    <div class="h-10 bg-gray-100 rounded w-1/3"></div>
                    <div class="h-40 bg-gray-100 rounded w-full"></div>
                </div>
            </div>
        </div>
    {/if}

    {#if showBranchModal}
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div class="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Pilih Lokasi Cabang</h3>
                    <p class="text-sm text-gray-500">Hubungi cabang terdekat untuk ketersediaan stok</p>
                </div>
                <button onclick={() => showBranchModal = false} class="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <XIcon size="24"/>
                </button>
            </div>
            
            <div class="p-6 bg-gray-50 overflow-y-auto custom-scrollbar flex-1">
                {#if isLoadingBranches}
                    <div class="text-center py-10 text-gray-400 animate-pulse">Memuat data...</div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each branches as branch}
                            <button onclick={() => chatBranch(branch.whatsapp)} class="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#C4161C] hover:shadow-lg transition-all group text-left flex flex-col h-full active:scale-[0.98]">
                                <div class="flex items-start gap-4 mb-4">
                                    <div class="w-10 h-10 rounded-full bg-red-50 text-[#C4161C] flex items-center justify-center shrink-0 group-hover:bg-[#C4161C] group-hover:text-white transition-colors">
                                        <MapPinIcon size="18"/>
                                    </div>
                                    <div>
                                        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            {#if branch.id === 1} PUSAT {:else} CABANG {/if}
                                        </div>
                                        <h4 class="font-bold text-gray-800 text-base leading-tight group-hover:text-[#C4161C] transition-colors">
                                            {branch.name.replace('Narwastu ', '')}
                                        </h4>
                                    </div>
                                </div>
                                <div class="mt-auto pt-4 border-t border-gray-50 w-full">
                                    <div class="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-bold py-2.5 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors text-sm">
                                        <MessageCircleIcon size="16"/>
                                        <span>Hubungi via WhatsApp</span>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
    {/if}

</div>