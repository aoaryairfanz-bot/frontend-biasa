<script>
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { Share2Icon, CheckIcon, XIcon, MessageCircleIcon } from 'svelte-feather-icons';
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
    let branches = $state([]); // Data semua cabang
    let showBranchModal = $state(false); // Kontrol modal
    let isLoadingBranches = $state(false);

    // Default Alamat Pusat (untuk tampilan info di bawah harga)
    let centralBranch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281"
    });

    // --- SLIDER STATE ---
    let activeIndex = $state(0); 
    let sliderRef; 

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

    // --- LOAD DATA CLIENT SIDE ---
    async function loadBranches() {
        isLoadingBranches = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                branches = list; // Simpan semua cabang untuk modal

                // Cari pusat untuk info di halaman
                const pusat = list.find(b => b.id === 1);
                if (pusat) {
                    centralBranch = pusat; 
                }
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

    // Fungsi Buka Modal
    function openBuyModal() {
        showBranchModal = true;
    }

    // Fungsi Chat ke Cabang Tertentu
    function chatBranch(branchPhone) {
        if (!branchPhone) return;
        const phone = branchPhone.replace(/\D/g, '').replace(/^0/, '62');
        const urlProduk = $page.url.href;
        
        const pesan = 
            `${urlProduk}\n\n` + 
            `Hallo Admin Narwastu\n` +
            `Saya Ingin Pesan "${product.name}"\n` +
            `SKU: "${product.sku || '-'}" Harga: "${formatRupiah(product.price)}"\n` +
            `Apakah stok masih tersedia di cabang ini?`;
            
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
        showBranchModal = false; // Tutup modal setelah klik
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

    function optimizeCloudinary(url, width = 'auto') {
        if (!url || !url.includes('cloudinary.com')) return url;
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
    
    function isVideo(url) { return url === product?.video_url; }
    function formatRupiah(n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
    function hitungDiskon(a, b) { if (!b || b <= a) return 0; return Math.round(((b - a) / b) * 100); }
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
    <meta property="og:description" content={product ? `Harga: ${formatRupiah(product.price)}` : 'Toko Rohani Terlengkap'} />
    <meta property="og:url" content={$page.url.href} />
    <meta property="og:image" content={product ? optimizeCloudinary(product.image_1_url, 600) : ''} />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta name="twitter:card" content="summary_large_image">
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    img, video { content-visibility: auto; }
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
            <div class="flex flex-col md:flex-row gap-6 md:gap-8">
                
                <div class="w-full md:w-[384px] shrink-0 flex flex-col gap-3">
                    <div class="relative w-full aspect-square md:h-[411px] md:w-[384px] bg-white rounded-lg overflow-hidden group">
                        <div bind:this={sliderRef} onscroll={handleScroll} class="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide">
                            {#each mediaList as item, i}
                                <div class="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-white">
                                    {#if isVideo(item)}
                                        <video src={item} class="w-full h-full object-contain bg-white" autoplay muted loop playsinline preload="metadata"></video>
                                    {:else}
                                        <img src={optimizeCloudinary(item, 800)} alt="{product.name}" class="w-full h-full object-contain" loading={i === 0 ? "eager" : "lazy"} fetchpriority={i === 0 ? "high" : "auto"} decoding="async" />
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
                        {#each mediaList as item, i}
                            <button 
                                onclick={() => scrollTo(i)} 
                                class="relative w-14 h-14 rounded overflow-hidden p-0.5 cursor-pointer transition flex-shrink-0 bg-white 
                                {activeIndex === i ? 'opacity-100' : 'opacity-40 hover:opacity-100'}"
                            >
                                {#if isVideo(item)} <video src={item} class="w-full h-full object-cover" muted></video>
                                {:else} <img src={optimizeCloudinary(item, 150)} alt="Thumb" class="w-full h-full object-contain" loading="lazy" /> {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex-1 flex flex-col min-w-0">
                    <div class="flex flex-col gap-1 mb-3">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.author || "Narwastu Store"}</span>
                        <h1 class="text-xl md:text-3xl font-extrabold text-gray-800 leading-tight">{product.name}</h1>
                    </div>
                    
                    <div class="flex flex-col gap-0.5 mb-5 border-b border-gray-100 pb-4">
                        <div class="text-3xl md:text-4xl font-extrabold text-[#C4161C]">{formatRupiah(product.price)}</div>
                        {#if product.strike_price > product.price}
                            <div class="flex items-center gap-2">
                                <span class="bg-red-50 text-[#C4161C] rounded px-1.5 py-0.5 text-[10px] font-bold">-{hitungDiskon(product.price, product.strike_price)}%</span>
                                <span class="text-gray-400 line-through text-xs font-medium">{formatRupiah(product.strike_price)}</span>
                            </div>
                        {/if}
                    </div>

                    <div class="mb-6">
                        <div class="flex flex-col gap-1">
                            <div class="text-xs font-bold text-gray-800">{centralBranch.name}</div>
                            <div class="text-[10px] text-gray-500 leading-relaxed">{centralBranch.address}</div>
                        </div>
                    </div>

                    <div class="mb-8">
                        <div class="grid grid-cols-4 gap-4 text-center md:text-left">
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">SKU</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700 truncate">{product.sku || "-"}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Berat</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700">{product.weight ? product.weight + 'gr' : '-'}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Stok</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700">{product.stock || "-"}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Dimensi</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700 truncate">{formatDimensi()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="mb-8 border-t border-gray-100 pt-6">
                        <h3 class="text-sm font-extrabold text-gray-800 mb-3 uppercase tracking-tight">Deskripsi Produk</h3>
                        <div class="relative">
                            <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line text-justify {isDescriptionExpanded ? '' : 'line-clamp-3'}">{product.description || "Deskripsi belum tersedia."}</p>
                            {#if !isDescriptionExpanded && (product.description?.length > 150)}
                            <button onclick={() => isDescriptionExpanded = true} class="text-xs font-bold text-[#C4161C] mt-1 hover:underline">Selengkapnya...</button>
                            {:else if isDescriptionExpanded}
                            <button onclick={() => isDescriptionExpanded = false} class="text-xs font-bold text-gray-400 mt-1 hover:text-gray-600">Tutup</button>
                            {/if}
                        </div>
                    </div>

                    <div class="hidden md:flex gap-3 pt-4 border-t border-gray-100">
                        <button onclick={openBuyModal} class="flex-1 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold h-12 rounded-lg shadow-md transition text-base tracking-wide uppercase">Beli Sekarang</button>
                        <button onclick={handleShare} class="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition" title="Bagikan">
                            {#if isCopied} <CheckIcon size="20" class="text-green-600" />
                            {:else} <Share2Icon size="20" /> {/if}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-10 pt-8 border-t border-gray-100">
            <h3 class="text-sm font-extrabold text-gray-800 mb-4 uppercase tracking-wider">Produk Lainnya</h3>
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                {#if isLoadingRelated}
                    {#each Array(6) as _}<div class="bg-white rounded-lg p-2 animate-pulse"><div class="aspect-[3/4] bg-gray-200 rounded mb-2"></div><div class="h-3 bg-gray-200 rounded w-3/4 mb-1"></div></div>{/each}
                {:else}
                    {#each relatedProducts as item}
                        <a href="/produk/{item.slug}" class="block bg-white rounded-lg p-2 border border-transparent hover:border-gray-200 hover:shadow-sm transition group">
                            <div class="aspect-[3/4] bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden"><img src={optimizeCloudinary(item.image_1_url, 300)} class="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition" alt={item.name} loading="lazy"></div>
                            <div class="text-[10px] md:text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-[#C4161C] leading-tight uppercase">{item.name}</div>
                            <div class="text-[10px] md:text-xs font-bold text-[#C4161C]">{formatRupiah(item.price)}</div>
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3">
            <button onclick={handleShare} class="w-12 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 bg-white">
                {#if isCopied} <CheckIcon size="18" class="text-green-600" />
                {:else} <Share2Icon size="18" /> {/if}
            </button>
            <button onclick={openBuyModal} class="flex-1 bg-[#C4161C] active:scale-95 transition-transform text-white font-bold py-3.5 rounded-lg text-sm shadow-md uppercase tracking-wide">Beli Sekarang</button>
        </div>
    
    {:else}
        <div class="container mx-auto px-4 max-w-7xl pt-6" in:fade>
            <div class="flex flex-col md:flex-row gap-8 animate-pulse">
                <div class="w-full md:w-[384px] aspect-square bg-gray-100 rounded-lg"></div>
                <div class="flex-1 space-y-4">
                    <div class="h-8 bg-gray-100 rounded w-3/4"></div>
                    <div class="h-6 bg-gray-100 rounded w-1/4"></div>
                    <div class="h-32 bg-gray-100 rounded w-full mt-6"></div>
                </div>
            </div>
        </div>
    {/if}

    {#if showBranchModal}
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 class="text-lg font-bold text-gray-800">Pilih Lokasi Cabang</h3>
                <button onclick={() => showBranchModal = false} class="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition">
                    <XIcon size="24"/>
                </button>
            </div>
            
            <div class="p-4 md:p-6 bg-gray-50 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {#if isLoadingBranches}
                    <div class="text-center py-10 text-gray-400">Memuat cabang...</div>
                {:else if branches.length === 0}
                    <div class="text-center py-10 text-gray-400">Belum ada data cabang.</div>
                {:else}
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {#each branches as branch}
                            <button onclick={() => chatBranch(branch.whatsapp)} class="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all group text-left flex flex-col justify-between h-full">
                                <div>
                                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        {#if branch.id === 1} PUSAT {:else} CABANG {/if}
                                    </div>
                                    <h4 class="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 mb-2 leading-tight">
                                        {branch.name.replace('Narwastu ', '')}
                                    </h4>
                                </div>
                                <div class="mt-3 flex items-center gap-2 text-green-600 font-bold text-[10px] md:text-xs bg-green-50 px-2 py-1.5 rounded-lg w-fit group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <MessageCircleIcon size="14"/>
                                    <span>Chat Admin</span>
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