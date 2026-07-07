<script>
    import { page } from '$app/stores';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { Share2Icon, CheckIcon, XIcon, MessageCircleIcon, MapPinIcon, BoxIcon } from 'svelte-feather-icons';
    import { fly, fade } from 'svelte/transition';

    // AMBIL DATA (UPDATED WITH DETECTED ZONE)
    let { data } = $props();
    let product = $derived(data.product); 
    let slug = $derived(data.slug);
    let detectedZone = $derived(data.detectedZone || 1); // [+] Menangkap zona hasil tebakan IP

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

    // [+] LOGIKA REAKTIF MULTI-ZONA TERMASUK MANTRA ZONA 10 (VPN PSYCHOLOGY)
    let activePrice = $derived.by(() => {
        if (!product) return 0;
        if (detectedZone === 10) return 15000000; // Buku Tulis Rp15 Juta biar kaget! wkwkwk
        if (detectedZone === 3) return product.final_price_zone_3 || Math.floor(product.final_price * 1.25);
        if (detectedZone === 2) return product.final_price_zone_2 || Math.floor(product.final_price * 1.10);
        return product.final_price; // Zona 1 (Default)
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

    // [UPDATE PENTING] Sinkronisasi Harga Sesuai Wilayah Terdeteksi ke WhatsApp Admin
    function chatBranch(branchPhone) {
        if (!branchPhone) return;
        const phone = branchPhone.replace(/\D/g, '').replace(/^0/, '62');
        const urlProduk = $page.url.href;
        
        let infoZonaText = `Zona ${detectedZone}`;
        if (detectedZone === 10) infoZonaText = "Zona Internasional (VPN Luar Negeri)";

        const pesan = 
            `*${product.name}*\n` +
            `Harga (${infoZonaText}): ${formatRupiah(activePrice)}\n` + 
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
        if (p || l || t) return `${p}x${l}x${t}`; 
        return "-";
    }
</script>

<svelte:head>
    <title>{product ? product.name : 'Narwastu Store'}</title>
    <meta property="og:type" content="product" />
    <meta property="og:title" content={product ? product.name : 'Narwastu Store'} />
    <meta property="og:description" content={product ? `Harga: ${formatRupiah(activePrice)}` : 'Toko Rohani Terlengkap'} />
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
        <!-- BANNER PERINGATAN VPN SAKTI (ZONA 10) -->
        {#if detectedZone === 10}
            <div class="bg-red-50 border-b border-red-200 p-3 text-center text-xs font-bold text-red-700 animate-pulse shrink-0 z-50">
                ⚠️ Lokasi Anda terdeteksi di luar negeri (Singapura / Jalur VPN). Kami menampilkan Harga Zona Utama Khusus. Silakan sesuaikan lokasi Anda jika ingin melakukan pengiriman lokal.
            </div>
        {/if}

        <div class="border-b border-gray-50 bg-white">
            <div class="container mx-auto px-4 py-3 max-w-7xl text-[10px] md:text-xs font-medium text-gray-400 flex items-center">
                <a href="/" class="hover:text-gray-900 transition-colors">Home</a> <span class="mx-2">/</span> 
                <a href="/produk" class="hover:text-gray-900 transition-colors">Produk</a> <span class="mx-2">/</span> 
                <span class="text-gray-900 truncate font-semibold">{product.name}</span>
            </div>
        </div>

        <div class="container mx-auto px-4 max-w-7xl mt-8 md:mt-12">
            <div class="flex flex-col md:flex-row gap-10 md:gap-16">
                <!-- [+] BOX FOTO PRODUK DIKECILKAN MENJADI 400px AGAR PROPORSIAL -->
                <div class="w-full md:w-[400px] shrink-0 flex flex-col gap-6">
                    <div class="relative w-full aspect-square overflow-hidden group">
                        {#if product.discount_label && detectedZone !== 10}
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
                    <!-- [+] UKURAN FONT NAMA PRODUK DISESUAIKAN MENJADI TEXT-XL MD:TEXT-2XL -->
                    <div class="mb-4">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{product.author || "Narwastu Collection"}</span>
                        <h1 class="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                    </div>

                    <!-- [+] UKURAN FONT HARGA UTAMA DISESUAIKAN MENJADI TEXT-2XL MD:TEXT-3XL -->
                    <div class="mb-8 border-b border-gray-100 pb-6">
                        <div class="flex items-baseline gap-3">
                            <span class="text-2xl md:text-3xl font-extrabold text-[#C4161C] tracking-tight">
                                {formatRupiah(activePrice)}
                            </span>
                            {#if product.display_strike_price > product.final_price && detectedZone !== 10}
                                <div class="flex flex-col items-start leading-none">
                                    <span class="text-base text-gray-400 line-through decoration-gray-300">
                                        {formatRupiah(product.display_strike_price)}
                                    </span>
                                    <span class="text-[10px] font-bold text-red-500 uppercase tracking-wide mt-0.5">Hemat {formatRupiah(product.display_strike_price - product.final_price)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="mb-8 space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><MapPinIcon size="12"/> Zona Wilayah Pengiriman (Andi Publisher Standar)</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden
                                {detectedZone === 1 ? 'border-[#C4161C] bg-red-50/20 scale-[1.03] ring-1 ring-[#C4161C]/30 shadow-sm' : 'border-gray-200 opacity-60 bg-white'}">
                                {#if detectedZone === 1} <div class="absolute top-0 right-0 bg-[#C4161C] text-white font-bold text-[8px] px-2 py-0.5 rounded-bl-lg tracking-wide uppercase">📍 Lokasi Anda</div> {/if}
                                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Zona 1</div>
                                <div class="text-base font-extrabold text-gray-900 mt-1">{detectedZone === 10 ? formatRupiah(15000000) : formatRupiah(product.final_price)}</div>
                                <div class="text-[9px] text-gray-500 mt-1.5 leading-tight font-medium">Jawa, Bali, NTB Utama, Lampung, Palembang</div>
                            </div>

                            <div class="border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden
                                {detectedZone === 2 ? 'border-[#C4161C] bg-red-50/20 scale-[1.03] ring-1 ring-[#C4161C]/30 shadow-sm' : 'border-gray-200 opacity-60 bg-white'}">
                                {#if detectedZone === 2} <div class="absolute top-0 right-0 bg-[#C4161C] text-white font-bold text-[8px] px-2 py-0.5 rounded-bl-lg tracking-wide uppercase">📍 Lokasi Anda</div> {/if}
                                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Zona 2 (+10%)</div>
                                <div class="text-base font-extrabold text-gray-900 mt-1">{detectedZone === 10 ? formatRupiah(15000000) : formatRupiah(product.final_price_zone_2 || Math.floor(product.final_price * 1.10))}</div>
                                <div class="text-[9px] text-gray-500 mt-1.5 leading-tight font-medium">Aceh, Medan, Pekanbaru, Padang, Batam, Kalimantan, Sulawesi</div>
                            </div>

                            <div class="border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden
                                {detectedZone === 3 ? 'border-[#C4161C] bg-red-50/20 scale-[1.03] ring-1 ring-[#C4161C]/30 shadow-sm' : 'border-gray-200 opacity-60 bg-white'}">
                                {#if detectedZone === 3} <div class="absolute top-0 right-0 bg-[#C4161C] text-white font-bold text-[8px] px-2 py-0.5 rounded-bl-lg tracking-wide uppercase">📍 Lokasi Anda</div> {/if}
                                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Zona 3 (+25%)</div>
                                <div class="text-base font-extrabold text-gray-900 mt-1">{detectedZone === 10 ? formatRupiah(15000000) : formatRupiah(product.final_price_zone_3 || Math.floor(product.final_price * 1.25))}</div>
                                <div class="text-[9px] text-gray-500 mt-1.5 leading-tight font-medium">Maluku, Papua, NTT, NTB Luar</div>
                            </div>
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

                    <!-- [+] FLOATING BAR PREMIUM ALA GRAMEDIA (DESKTOP & MOBILE INTEGRATED) 🚀 -->
                    <!-- ========================================================================= -->
                    <div class="fixed bottom-0 left-0 right-0 z-50 mx-auto px-4 mb-4 max-w-7xl">
                        <div class="mx-auto bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] rounded-xl border border-gray-100 animate-in slide-in-from-bottom duration-500">
                            <div class="flex items-center justify-between gap-4">
                                
                                <!-- KIRI: FOTO KECIL & INFO PRODUK (TIDAK SEMBUNYI DI DESKTOP/MOBILE, COCOK UNTUK SEMUA) -->
                                <div class="flex items-center gap-3 min-w-0">
                                    <!-- Foto Kecil Produk -->
                                    <div class="relative h-14 w-14 shrink-0 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center overflow-hidden">
                                        <img alt="{product.name}" class="max-w-full max-h-full object-contain" src={product.image_1_url || 'https://placehold.co/100?text=No+Img'} />
                                    </div>
                                    
                                    <!-- Detail Text Ringkas -->
                                    <div class="flex flex-col min-w-0 leading-tight">
                                        <span class="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                            {product.author || "Narwastu Collection"}
                                        </span>
                                        <h2 class="font-bold text-gray-800 text-xs md:text-sm truncate max-w-[150px] md:max-w-md" title={product.name}>
                                            {product.name}
                                        </h2>
                                        <!-- Harga Otomatis Mengikuti Zona IP Pembeli -->
                                        <div class="mt-0.5 flex items-center gap-1.5">
                                            <span class="text-sm md:text-base font-black text-[#C4161C] tracking-tight">
                                                {formatRupiah(activePrice)}
                                            </span>
                                            {#if detectedZone !== 10}
                                                <span class="text-[8px] bg-red-50 text-[#C4161C] border border-red-200/50 px-1 rounded font-black uppercase tracking-wide">
                                                    Zona {detectedZone}
                                                </span>
                                            {:else}
                                                <span class="text-[8px] bg-red-600 text-white px-1 rounded font-black uppercase tracking-wide animate-pulse">
                                                    VPN ON
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <!-- Tombol Bagikan / Share (Kontras Tinggi, Tanpa Border) -->
                                <button onclick={handleShare} class="h-9 w-9 flex items-center justify-center rounded-md text-gray-800 hover:text-gray-900 hover:bg-gray-100 transition-all bg-white font-bold" title="Bagikan Produk">
                                    {#if isCopied} 
                                        <CheckIcon size="16" class="text-green-600 font-bold" />
                                    {:else} 
                                        <Share2Icon size="16" class="stroke-[2.5]" /> 
                                    {/if}
                                </button>
                                
                                <!-- Tombol Beli Langsing Ramping (Radius md - Tegas & Presisi) -->
                                <button onclick={openBuyModal} class="h-9 px-5 md:px-8 bg-[#C4161C] hover:bg-[#a51318] text-white font-bold rounded-md shadow-md hover:shadow-lg shadow-red-100 hover:shadow-red-200 transition-all transform active:scale-95 text-xs md:text-sm uppercase tracking-wide flex items-center justify-center gap-1.5 outline-none border-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="14px" height="14px" stroke-width="2.5" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    <span>Beli Sekarang</span>
                                </button>
                            </div>

                            </div>
                        </div>
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
                        <a href="/detail-produk/{item.slug}" class="group block">
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
                <div class="text-xl font-black text-[#C4161C] leading-none">{formatRupiah(activePrice)}</div>
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
                <div>
                    <h3 class="text-lg font-bold text-gray-900">Pilih Lokasi</h3>
                    <p class="text-xs text-red-500 font-medium mt-1">*Harga Belum Termasuk Ongkir, Hubungi Admin Untuk Info Lebih Lanjut</p>
                </div>
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