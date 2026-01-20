<script>
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { Share2Icon, CheckIcon, XIcon, MessageCircleIcon, MapPinIcon, BoxIcon } from 'svelte-feather-icons';
    import { fly, fade } from 'svelte/transition';

    // AMBIL DATA
    let { data } = $props();
    let product = $derived(data.product); 
    let slug = $derived(data.slug);

    // STATE
    let relatedProducts = $state([]);       
    let isLoadingRelated = $state(true);
    let isDescriptionExpanded = $state(false);
    let isCopied = $state(false);
    let branches = $state([]); 
    let showBranchModal = $state(false); 
    let isLoadingBranches = $state(false);

    let centralBranch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281"
    });

    let activeIndex = $state(0); 
    let sliderRef; 

    let mediaList = $derived.by(() => {
        if (!product) return [];
        let list = [product.image_1_url, product.image_2_url, product.image_3_url].filter(Boolean);
        if (product.video_url) list.push(product.video_url);
        return list;
    });

    $effect(() => {
        if (product) {
            activeIndex = 0;
            loadBranches();
            loadRelatedProducts();
        }
    });

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

    function openBuyModal() { showBranchModal = true; }

    // [UPDATE PENTING] Hapus URL Gambar di Text Body agar Preview Card WA Muncul
    function chatBranch(branchPhone) {
        if (!branchPhone) return;
        const phone = branchPhone.replace(/\D/g, '').replace(/^0/, '62');
        const urlProduk = $page.url.href;
        
        // Cukup kirim Link Produk. WhatsApp akan otomatis ambil og:image sebagai preview card.
        const pesan = 
            `*${product.name}*\n` +
            `Harga: ${formatRupiah(product.final_price)}\n` + 
            `Link: ${urlProduk}\n\n` + 
            `Hallo Admin, apakah stok produk ini masih tersedia?`;
            
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
        showBranchModal = false; 
    }

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
        if (p || l || t) return `${p}x${l}x${t}`; // Disingkat agar muat di mobile
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
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />

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

<div class="min-h-screen bg-white pb-32 font-sans text-gray-800 relative" style="font-family: 'Poppins', sans-serif !important;">
    
    {#if product}
        <div class="border-b border-gray-50 bg-white">
            <div class="container mx-auto px-4 py-3 max-w-7xl text-[10px] md:text-xs font-medium text-gray-400 flex items-center">
                <a href="/" class="hover:text-gray-900 transition-colors">Home</a> <span class="mx-2">/</span> 
                <a href="/katalog" class="hover:text-gray-900 transition-colors">Katalog</a> <span class="mx-2">/</span> 
                <span class="text-gray-900 truncate font-semibold">{product.name}</span>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-8 md:mt-12">
            <div class="flex flex-col md:flex-row gap-10 md:gap-16">
                
                <div class="w-full md:w-[480px] shrink-0 flex flex-col gap-6">
                    <div class="relative w-full aspect-square overflow-hidden group">
                        {#if product.discount_label}
                            <div class="absolute top-0 left-0 z-10 bg-[#C4161C] text-white text-xs font-bold px-3 py-1.5 rounded-br-xl shadow-sm">
                                {product.discount_label} OFF
                            </div>
                        {/if}

                        <div bind:this={sliderRef} onscroll={handleScroll} class="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide">
                            {#each mediaList as item, i}
                                <div class="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center">
                                    {#if isVideo(item)}
                                        <video src={item} class="w-full h-full object-contain" autoplay muted loop playsinline></video>
                                    {:else}
                                        <img 
                                            src={optimizeCloudinary(item)} 
                                            alt="{product.name}" 
                                            class="w-full h-full object-contain hover:scale-105 transition-transform duration-700 ease-out" 
                                            loading={i === 0 ? "eager" : "lazy"} 
                                        />
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                    
                    {#if mediaList.length > 1}
                    <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
                        {#each mediaList as item, i}
                            <button 
                                onclick={() => scrollTo(i)} 
                                class="relative w-16 h-16 cursor-pointer transition flex-shrink-0 rounded-lg overflow-hidden
                                {activeIndex === i ? 'opacity-100 border-2 border-[#C4161C]' : 'opacity-40 hover:opacity-100 border border-transparent'}"
                            >
                                {#if isVideo(item)} <video src={item} class="w-full h-full object-cover" muted></video>
                                {:else} <img src={optimizeCloudinary(item)} alt="Thumb" class="w-full h-full object-cover" /> {/if}
                            </button>
                        {/each}
                    </div>
                    {/if}
                </div>

                <div class="flex-1 flex flex-col min-w-0 pt-2">
                    <div class="mb-4">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{product.author || "Narwastu Collection"}</span>
                        <h1 class="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
                    </div>

                    <div class="mb-8 border-b border-gray-100 pb-6">
                        <div class="flex items-baseline gap-3">
                            <span class="text-4xl md:text-5xl font-black text-[#C4161C] tracking-tight">
                                {formatRupiah(product.final_price)}
                            </span>
                            {#if product.display_strike_price > product.final_price}
                                <div class="flex flex-col items-start leading-none">
                                    <span class="text-base text-gray-400 line-through decoration-gray-300">
                                        {formatRupiah(product.display_strike_price)}
                                    </span>
                                    <span class="text-[10px] font-bold text-red-500 uppercase tracking-wide mt-0.5">Hemat {formatRupiah(product.display_strike_price - product.final_price)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-2 text-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
                        {#if product.sku}
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">SKU</span>
                                <span class="font-bold text-gray-900 truncate">{product.sku}</span>
                            </div>
                        {/if}
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Berat</span>
                            <span class="font-bold text-gray-900 truncate">{product.weight ? product.weight + 'g' : '-'}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Stok</span>
                            <span class="font-bold text-gray-900 truncate">{product.stock || "-"}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Dimensi</span>
                            <span class="font-bold text-gray-900 truncate text-xs">{formatDimensi()}</span>
                        </div>
                    </div>

                    <div class="mb-10">
                        <h3 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <BoxIcon size="14"/> Detail Produk
                        </h3>
                        <div class="relative text-gray-600 text-sm leading-relaxed whitespace-pre-line text-justify">
                            <p class={isDescriptionExpanded ? '' : 'line-clamp-4'}>
                                {product.description || "Deskripsi belum tersedia."}
                            </p>
                            {#if !isDescriptionExpanded && (product.description?.length > 150)}
                                <button onclick={() => isDescriptionExpanded = true} class="text-xs font-bold text-[#C4161C] mt-2 hover:underline">Baca Selengkapnya</button>
                            {:else if isDescriptionExpanded}
                                <button onclick={() => isDescriptionExpanded = false} class="text-xs font-bold text-gray-400 mt-2 hover:text-gray-600">Tutup</button>
                            {/if}
                        </div>
                    </div>

                    <div class="hidden md:flex items-center gap-4 mt-auto pt-6 border-t border-gray-100">
                        <button onclick={openBuyModal} class="flex-1 h-14 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg uppercase tracking-wide">
                            <span>Beli Sekarang</span>
                        </button>
                        
                        <button onclick={handleShare} class="h-14 w-14 flex items-center justify-center border-2 border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" title="Bagikan">
                            {#if isCopied} <CheckIcon size="24" class="text-green-600" />
                            {:else} <Share2Icon size="24" /> {/if}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-20 pt-10 border-t border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>Mungkin Anda Suka</span>
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-8">
                {#if isLoadingRelated}
                    {#each Array(6) as _}<div class="bg-gray-50 rounded-xl aspect-[3/4] animate-pulse"></div>{/each}
                {:else}
                    {#each relatedProducts as item}
                        <a href="/produk/{item.slug}" class="group block">
                            <div class="rounded-xl aspect-[3/4] mb-3 overflow-hidden bg-white flex items-center justify-center">
                                <img src={optimizeCloudinary(item.image_1_url)} class="max-w-full max-h-full object-contain p-2 group-hover:scale-110 transition duration-500" alt={item.name} loading="lazy">
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
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</div>
                <div class="text-xl font-black text-[#C4161C] leading-none">{formatRupiah(product.final_price)}</div>
            </div>
            <button onclick={handleShare} class="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 bg-white">
                {#if isCopied} <CheckIcon size="20" class="text-green-600" />
                {:else} <Share2Icon size="20" /> {/if}
            </button>
            <button onclick={openBuyModal} class="bg-[#C4161C] text-white font-bold h-12 px-8 rounded-xl text-sm shadow-md uppercase tracking-wide">
                Beli
            </button>
        </div>
    
    {:else}
        <div class="container mx-auto px-4 max-w-7xl pt-12" in:fade>
            <div class="flex flex-col md:flex-row gap-12 animate-pulse">
                <div class="w-full md:w-[480px] aspect-square bg-gray-100 rounded-2xl"></div>
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
        <div class="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div class="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
                <h3 class="text-lg font-bold text-gray-900">Pilih Lokasi</h3>
                <button onclick={() => showBranchModal = false} class="text-gray-400 hover:text-red-500 transition">
                    <XIcon size="24"/>
                </button>
            </div>
            
            <div class="p-5 bg-white overflow-y-auto custom-scrollbar flex-1">
                {#if isLoadingBranches}
                    <div class="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
                {:else}
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {#each branches as branch}
                            <button onclick={() => chatBranch(branch.whatsapp)} class="border border-gray-200 rounded-lg p-3 hover:border-[#C4161C] hover:bg-red-50/30 transition-all text-left group h-full flex flex-col justify-between">
                                <div>
                                    <div class="text-[9px] font-bold text-gray-400 uppercase mb-1">
                                        {#if branch.id === 1} PUSAT {:else} CABANG {/if}
                                    </div>
                                    <h4 class="font-bold text-gray-800 text-xs md:text-sm leading-tight mb-2 group-hover:text-[#C4161C]">
                                        {branch.name.replace('Narwastu ', '')}
                                    </h4>
                                </div>
                                <div class="flex items-center gap-1.5 text-[#C4161C] text-[10px] font-bold mt-auto">
                                    <MessageCircleIcon size="12"/>
                                    <span>Chat WA</span>
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