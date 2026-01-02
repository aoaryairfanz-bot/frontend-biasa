<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';

    let { data } = $props();
    let slug = $derived(data.slug);

    // --- STATE ---
    let product = $state(null); 
    let isLoading = $state(true); 
    
    let relatedProducts = $state([]);       
    let isLoadingRelated = $state(true);
    let isDescriptionExpanded = $state(false);

    // --- STATE CABANG ---
    let selectedBranch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Sedang memuat lokasi...",
        whatsapp: ""
    });
    let branchList = $state([]); 
    let showBranchModal = $state(false); 

    // --- SLIDER STATE ---
    let activeIndex = $state(0); 
    let sliderRef; 

    let mediaList = $derived.by(() => {
        if (!product) return [];
        let list = [product.image_1_url, product.image_2_url, product.image_3_url].filter(Boolean);
        if (product.video_url) list.push(product.video_url);
        return list;
    });

    $effect(() => {
        if (slug) loadProductDetail();
    });

    async function loadProductDetail() {
        isLoading = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/${slug}`);
            if (res.ok) {
                const raw = await res.json();
                product = raw;
                loadBranches();
                loadRelatedProducts();
                activeIndex = 0;
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
        } catch (e) { console.error(e); } 
        finally { isLoading = false; }
    }

    async function loadBranches() {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                branchList = list;
                if (branchList.length > 0) selectedBranch = branchList[0];
            }
        } catch (error) { console.error(error); }
    }

    function selectBranch(branch) {
        selectedBranch = branch;
        showBranchModal = false; 
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

    // --- UTILS ---
    function cleanPhoneNumber(phone) {
        if (!phone) return "";
        let clean = phone.replace(/\D/g, ''); 
        if (clean.startsWith('0')) clean = '62' + clean.slice(1);
        return clean;
    }

    // --- FITUR WA (DIPERBAIKI) ---
    function handleBeli() {
        if (!selectedBranch || !selectedBranch.whatsapp) {
            showBranchModal = true;
            return;
        }
        const phone = cleanPhoneNumber(selectedBranch.whatsapp);
        const urlProduk = window.location.href;
        
        // Menambahkan URL Gambar Utama agar Admin bisa lihat foto produknya
        const imgUrl = product.image_1_url || "";

        const pesan = 
            `*ORDER BARU DARI WEB*\n\n` +
            `Hallo "${selectedBranch.name}"\n` +
            `Saya Ingin Pesan:\n` +
            `*${product.name}*\n\n` +
            `SKU: ${product.sku || '-'}\n` +
            `Harga: ${formatRupiah(product.price)}\n` +
            `Link: ${urlProduk}\n` +
            `Foto: ${imgUrl}\n\n` + // Mengirim Link Foto Langsung
            `Mohon info ketersediaan stok & totalan. Terima kasih.`;
            
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
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

    function optimizeCloudinary(url, width = 'auto') {
        if (!url || !url.includes('cloudinary.com')) return url;
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
    
    function isVideo(url) { return url === product?.video_url; }
    function formatRupiah(n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
    function hitungDiskon(a, b) { if (!b || b <= a) return 0; return Math.round(((b - a) / b) * 100); }
    
    function formatDimensi() {
        const { length: p, width: l, height: t } = product || {};
        if (!p && !l && !t) return null;
        return `${p}x${l}x${t}`;
    }
</script>

<svelte:head>
    <meta property="og:image" content={product?.image_1_url} />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="800" />
    <title>{product ? product.name : 'Memuat...'} - Narwastu</title>
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    img, video { content-visibility: auto; }
</style>

<div class="min-h-screen bg-white pb-32 font-sans text-gray-800">
    
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
                            <button onclick={() => scrollTo(i)} class="relative w-14 h-14 rounded overflow-hidden p-0.5 cursor-pointer transition flex-shrink-0 bg-white {activeIndex === i ? 'ring-1 ring-[#C4161C]' : 'opacity-70 hover:opacity-100'}">
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
                        <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Lokasi Stok</h3>
                        <button onclick={() => showBranchModal = true} class="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#C4161C] transition bg-white text-left group">
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-bold text-gray-800 truncate group-hover:text-[#C4161C]">{selectedBranch.name}</div>
                                <div class="text-[10px] text-gray-500 truncate">{selectedBranch.address || "Pilih lokasi..."}</div>
                            </div>
                            <div class="text-[#C4161C] text-xs font-bold uppercase">Ubah</div>
                        </button>
                    </div>

                    <div class="mb-8">
                        <div class="grid grid-cols-4 gap-4 text-center md:text-left">
                            {#if product.sku}
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">SKU</span>
                                    <span class="text-[10px] md:text-xs font-extrabold text-gray-700 truncate">{product.sku}</span>
                                </div>
                            {/if}
                            
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Berat</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700">{product.weight || 0}gr</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Stok</span>
                                <span class="text-[10px] md:text-xs font-extrabold text-gray-700">{product.stock}</span>
                            </div>
                            {#if formatDimensi()}
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Dimensi</span>
                                    <span class="text-[10px] md:text-xs font-extrabold text-gray-700 truncate">{formatDimensi()}</span>
                                </div>
                            {/if}
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

                    <div class="hidden md:flex gap-4 pt-4 border-t border-gray-100">
                        <button onclick={handleBeli} class="flex-1 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold h-12 rounded-lg shadow-md transition text-base tracking-wide uppercase">Beli Sekarang</button>
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

        <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onclick={handleBeli} class="w-full bg-[#C4161C] active:scale-95 transition-transform text-white font-bold py-3.5 rounded-lg text-sm shadow-md uppercase tracking-wide">Beli Sekarang</button>
        </div>
    
    {:else}
        <div class="container mx-auto px-4 max-w-7xl pt-6">
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
    <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4" transition:fade={{duration:150}}>
        <div class="bg-white w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 class="text-sm font-extrabold text-gray-800 uppercase tracking-wide">Pilih Lokasi Cabang</h3>
                <button onclick={() => showBranchModal = false} class="p-2 text-gray-400 hover:text-[#C4161C] font-bold text-xs uppercase">Tutup</button>
            </div>
            <div class="overflow-y-auto p-4 flex flex-col gap-2 bg-gray-50">
                {#each branchList as branch}
                    <button onclick={() => selectBranch(branch)} class="w-full text-left p-3 rounded-lg border-2 transition-all bg-white shadow-sm {selectedBranch.name === branch.name ? 'border-[#C4161C] ring-1 ring-[#C4161C] bg-red-50' : 'border-white hover:border-gray-300'}">
                        <div class="font-bold text-gray-800 uppercase text-xs tracking-tight mb-1">{branch.name.replace('Cabang ', '').replace('Narwastu ', '')}</div>
                        <div class="text-[10px] text-gray-500 leading-snug">{branch.address}</div>
                    </button>
                {/each}
            </div>
        </div>
    </div>
    {/if}
</div>