<script>
    import { fade, slide } from 'svelte/transition';
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public'; // Hamba tambahkan import ini

    let { data } = $props();
    let product = $derived(data.product);

    // --- STATE ---
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
        let list = [product?.image_1_url, product?.image_2_url, product?.image_3_url].filter(Boolean);
        if (product?.video_url) list.push(product.video_url);
        return list;
    });

    // --- EFFECT ---
    $effect(() => {
        if (product) {
            activeIndex = 0;
            if (sliderRef) scrollTo(0);
            isDescriptionExpanded = false;
            window.scrollTo({ top: 0, behavior: 'instant' }); 
            loadRelatedProducts();
            loadBranches(); 
        }
    });

    // --- LOGIC CABANG ---
    async function loadBranches() {
        try {
            // PERBAIKAN: Menggunakan PUBLIC_API_URL
            const res = await fetch(`${PUBLIC_API_URL}/branches`);
            const data = await res.json();
            if (data && data.length > 0) {
                branchList = data;
                selectedBranch = data[0]; 
            }
        } catch (error) {
            console.error("Gagal ambil cabang:", error);
        }
    }

    function selectBranch(branch) {
        selectedBranch = branch;
        showBranchModal = false; 
    }

    // --- LOGIC TRANSAKSI WHATSAPP ---
    function cleanPhoneNumber(phone) {
        let clean = phone.replace(/\D/g, ''); 
        if (clean.startsWith('0')) clean = '62' + clean.slice(1);
        return clean;
    }

    function handleBeli() {
        if (!selectedBranch || !selectedBranch.whatsapp) {
            showBranchModal = true;
            return;
        }
        const phone = cleanPhoneNumber(selectedBranch.whatsapp);
        const urlProduk = window.location.href;
        const pesan = 
            `${urlProduk}\n\n` +
            `Hallo "${selectedBranch.name}"\n` +
            `Saya Ingin Pesan "${product.name}"\n` +
            `SKU: "${product.sku || '-'}" Harga: "${formatRupiah(product.price)}"\n` +
            `Bisa diproses secepatnya?`;
        const encodedPesan = encodeURIComponent(pesan);
        window.open(`https://wa.me/${phone}?text=${encodedPesan}`, '_blank');
    }

    // --- LOGIC LAINNYA ---
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
    async function loadRelatedProducts() {
        isLoadingRelated = true;
        try {
            // PERBAIKAN: Menggunakan PUBLIC_API_URL
            const res = await fetch(`${PUBLIC_API_URL}/products/`); 
            const allProducts = await res.json();
            relatedProducts = allProducts.filter(p => p.slug !== product.slug).slice(0, 6); 
        } catch (error) { console.error(error); } finally { isLoadingRelated = false; }
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
        return `${p} x ${l} x ${t} cm`;
    }
</script>

<svelte:head>
    <meta property="og:image" content={product?.image_1_url} />
    <meta property="og:title" content={product ? product.name : 'Narwastu - Toko Kristiani'} />
    <meta property="og:description" content="Pesan produk rohani terbaik di Narwastu" />
    <meta property="og:url" content={$page.url.href} />
    <meta property="og:type" content="product" />
    <title>{product ? product.name : 'Narwastu - Toko Kristiani'}</title>
</svelte:head>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    img, video { content-visibility: auto; }
</style>

{#key $page.url.pathname}
<div class="min-h-screen bg-white pb-32 font-sans text-gray-800">
    {#if product}
        <div class="border-b border-gray-100 mb-6 bg-white">
            <div class="container mx-auto px-4 py-4 max-w-7xl text-xs font-medium text-gray-500">
                <a href="/" class="hover:text-[#C4161C]">Home</a> <span class="mx-1">/</span> 
                <a href="/katalog" class="hover:text-[#C4161C]">Katalog</a> <span class="mx-1">/</span> 
                <span class="text-gray-900 truncate">{product.name}</span>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl">
            <div class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-[384px] shrink-0 flex flex-col gap-4">
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
                    
                    <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                        {#each mediaList as item, i}
                            <button onclick={() => scrollTo(i)} class="relative w-16 h-16 rounded-md overflow-hidden p-1 cursor-pointer transition flex-shrink-0 bg-white opacity-100">
                                {#if isVideo(item)} <video src={item} class="w-full h-full object-cover" muted></video>
                                {:else} <img src={optimizeCloudinary(item, 150)} alt="Thumb" class="w-full h-full object-contain" loading="lazy" /> {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex-1 flex flex-col min-w-0">
                    <div class="flex flex-col gap-1 mb-4">
                        <span class="text-sm font-semibold text-gray-500">{product.author || "Narwastu Store"}</span>
                        <h1 class="text-3xl font-extrabold text-gray-700 leading-tight">{product.name}</h1>
                    </div>
                    <div class="flex flex-col gap-1 mb-6">
                        <div class="text-4xl font-extrabold text-gray-800">{formatRupiah(product.price)}</div>
                        {#if product.strike_price > product.price}
                            <div class="flex items-center gap-2">
                                <span class="bg-red-50 text-[#C4161C] rounded px-2 py-0.5 text-sm font-medium">{hitungDiskon(product.price, product.strike_price)}%</span>
                                <span class="text-gray-400 line-through text-sm font-medium">{formatRupiah(product.strike_price)}</span>
                            </div>
                        {/if}
                    </div>

                    <div class="flex items-end gap-3 mb-6">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-base font-extrabold text-gray-700 mb-2 uppercase tracking-tighter">Cabang (Lokasi)</h3>
                            <button onclick={() => showBranchModal = true} class="w-full flex items-center gap-3 hover:bg-red-50 transition bg-white h-12 text-left group outline-none">
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-bold text-gray-800 truncate group-hover:text-[#C4161C]">{selectedBranch.name}</div>
                                    <div class="text-[10px] text-gray-500 truncate">{selectedBranch.address || "Pilih lokasi..."}</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div class="mb-10">
                        <h3 class="text-base font-extrabold text-gray-700 mb-4 tracking-tighter">Detail Barang</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {#if product.sku}
                                <div>
                                    <div class="text-xs font-medium text-gray-500">SKU</div>
                                    <div class="text-sm font-medium text-gray-700">{product.sku}</div>
                                </div>
                            {/if}
                            <div>
                                <div class="text-xs font-medium text-gray-500">Kategori</div>
                                <div class="text-sm font-medium text-gray-700 capitalize">{product.subcategory}</div>
                            </div>
                            <div>
                                <div class="text-xs font-medium text-gray-500">Berat</div>
                                <div class="text-sm font-medium text-gray-700">{product.weight || 0} gr</div>
                            </div>
                            <div>
                                <div class="text-xs font-medium text-gray-500">Stok</div>
                                <div class="text-sm font-medium text-gray-700">{product.stock} pcs</div>
                            </div>
                            {#if formatDimensi()}
                                <div>
                                    <div class="text-xs font-medium text-gray-500">Dimensi</div>
                                    <div class="text-sm font-medium text-gray-700">{formatDimensi()}</div>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-base font-extrabold text-gray-700 mb-3 tracking-tighter">Deskripsi</h3>
                        <div class="relative">
                            <p class="text-sm text-gray-500 leading-relaxed whitespace-pre-line text-justify {isDescriptionExpanded ? '' : 'line-clamp-3'}">{product.description || "Deskripsi belum tersedia."}</p>
                            {#if !isDescriptionExpanded && (product.description?.length > 150)}
                            <button onclick={() => isDescriptionExpanded = true} class="text-xs font-bold text-[#C4161C] mt-2 uppercase">Baca Selengkapnya</button>
                            {:else if isDescriptionExpanded}
                            <button onclick={() => isDescriptionExpanded = false} class="text-xs font-bold text-gray-500 mt-2 uppercase">Tutup</button>
                            {/if}
                        </div>
                    </div>

                    <div class="hidden md:flex gap-4 pt-6 border-t border-gray-100">
                        <button onclick={handleBeli} class="flex-1 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold h-14 rounded-lg shadow-md transition text-lg tracking-wide uppercase">Beli Sekarang</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-16 pt-10 border-t border-gray-100">
            <h3 class="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wider italic tracking-tighter">Produk Lainnya</h3>
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                {#if isLoadingRelated}
                    {#each Array(6) as _}<div class="bg-white rounded-lg p-2 animate-pulse"><div class="aspect-[3/4] bg-gray-200 rounded mb-2"></div><div class="h-3 bg-gray-200 rounded w-3/4 mb-1"></div></div>{/each}
                {:else}
                    {#each relatedProducts as item}
                        <a href="/produk/{item.slug}" class="block bg-white rounded-lg p-2 hover:shadow-lg transition group">
                            <div class="aspect-[3/4] bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden"><img src={optimizeCloudinary(item.image_1_url, 300)} class="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition" alt={item.name} loading="lazy"></div>
                            <div class="text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-[#C4161C] leading-tight uppercase">{item.name}</div>
                            <div class="text-xs font-bold text-[#C4161C]">{formatRupiah(item.price)}</div>
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <button onclick={handleBeli} class="w-full bg-[#C4161C] hover:bg-[#a51318] text-white font-bold py-4 rounded-lg text-sm shadow-md uppercase tracking-wide">Beli Sekarang</button>
        </div>
    {:else}
        <div class="text-center py-20 font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Produk...</div>
    {/if}

    {#if showBranchModal}
    <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4" transition:fade={{duration:200}}>
        <div class="bg-white w-full max-w-md rounded-t-xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 class="text-lg font-bold text-gray-800 uppercase tracking-tighter">Pilih Lokasi Cabang</h3>
                <button onclick={() => showBranchModal = false} class="p-2 text-gray-500 hover:text-[#C4161C]">Tutup</button>
            </div>
            <div class="overflow-y-auto p-4 flex flex-col gap-3">
                {#each branchList as branch}
                    <button onclick={() => selectBranch(branch)} class="w-full text-left p-4 rounded-lg border-2 transition-all {selectedBranch.name === branch.name ? 'border-[#C4161C] bg-red-50' : 'border-gray-100 hover:border-gray-300'}">
                        <div class="font-bold text-gray-800 uppercase text-sm tracking-tighter">{branch.name}</div>
                        <div class="text-xs text-gray-500 mt-1 leading-tight">{branch.address}</div>
                    </button>
                {/each}
            </div>
        </div>
    </div>
    {/if}
</div>
{/key}