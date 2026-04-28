<script>
    import { 
        PlusIcon, TagIcon, Trash2Icon, XIcon, LoaderIcon, 
        SearchIcon, PercentIcon, AlertCircleIcon, CheckCircleIcon,
        ZapIcon, ListIcon 
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- STATE ---
    let discounts = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let searchQuery = $state('');
    
    let isApplying = $state(null); 

    // --- STATE MODAL PILIH PRODUK ---
    let showProductModal = $state(false);
    let activeDiscountForSelection = $state(null);
    let modalProducts = $state([]);
    let selectedProductIds = $state([]);
    let isFetchingProducts = $state(false);
    let productSearchQuery = $state('');
    
    // [BARU] State untuk Filter Kategori
    let selectedCategoryFilter = $state('');

    // Form State
    let formData = $state({
        name: '',
        percentage: 10,
        is_active: true
    });

    const API_BASE = PUBLIC_API_URL;

    // --- 1. LOAD DATA ---
    onMount(async () => {
        await loadDiscounts();
    });

    async function loadDiscounts() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/discounts/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                discounts = await res.json();
            }
        } catch (e) {
            console.error("Gagal load diskon:", e);
        } finally {
            isLoading = false;
        }
    }

    // --- 2. SEARCH FILTER DISKON ---
    let filteredDiscounts = $derived(
        discounts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- [BARU] DERIVED FILTER PRODUK (Untuk Modal) ---
    // Mengambil daftar subkategori unik secara otomatis dari produk yang diload
    const uniqueCategories = $derived(
        [...new Set(modalProducts.map(p => p.subcategory || p.category || 'Umum'))].sort()
    );

    // Memfilter produk berdasarkan Pencarian & Dropdown Kategori
    const displayedModalProducts = $derived(
        modalProducts.filter(p => {
            if (!selectedCategoryFilter) return true;
            const cat = p.subcategory || p.category || 'Umum';
            return cat === selectedCategoryFilter;
        })
    );

    // --- 3. SUBMIT (OPTIMISTIC UI & BACKGROUND PROCESS) ---
    function handleSubmit(e) {
        e.preventDefault();
        
        const token = localStorage.getItem("token");
        const tempId = `temp-${Date.now()}`;
        
        // 1. Munculkan Voucher ke UI secara instan!
        const newDiscount = {
            id: tempId,
            name: formData.name,
            percentage: formData.percentage,
            is_active: formData.is_active,
            isUploading: true // Penanda efek loading
        };
        discounts = [newDiscount, ...discounts];

        // 2. Kloning data untuk dikirim ke server
        const dataToSend = { ...formData };

        // 3. TUTUP MODAL & RESET FORM SEKETIKA!
        showModal = false;
        formData = { name: '', percentage: 10, is_active: true };

        // 4. Jalankan upload di latar belakang
        uploadBackground(dataToSend, token, tempId);
    }

    // Fungsi Pekerja Latar Belakang
    async function uploadBackground(dataToSend, token, tempId) {
        try {
            const res = await fetch(`${API_BASE}/discounts/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(dataToSend)
            });

            if (res.ok) {
                // Berhasil! Refresh senyap untuk dapat ID asli dari Database
                await loadDiscounts();
            } else {
                const err = await res.json();
                alert("Gagal menyimpan voucher: " + (err.detail || "Terjadi kesalahan"));
                // Hapus voucher bohongan jika gagal
                discounts = discounts.filter(d => d.id !== tempId);
            }
        } catch (e) { 
            alert("Error koneksi server saat menyimpan voucher."); 
            discounts = discounts.filter(d => d.id !== tempId);
        }
    }

    // --- 4. TOGGLE STATUS (ON/OFF) ---
    async function toggleStatus(disc) {
        if (disc.isUploading) return; // Cegah klik saat loading
        
        const oldState = disc.is_active;
        disc.is_active = !disc.is_active;
        
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/discounts/${disc.id}/toggle?is_active=${disc.is_active}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) {
                disc.is_active = oldState;
                alert("Gagal mengubah status di server.");
            }
        } catch (e) { 
            disc.is_active = oldState;
            alert("Gagal koneksi."); 
        }
    }

    // --- 5. DELETE ---
    async function handleDelete(id, name) {
        if(!confirm(`Yakin hapus voucher "${name}"?\n\nPERINGATAN: Semua produk yang menggunakan voucher ini akan kembali ke harga normal.`)) return;
        
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/discounts/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                discounts = discounts.filter(d => d.id !== id);
            } else {
                alert("Gagal menghapus data.");
            }
        } catch (e) { alert("Gagal koneksi."); }
    }

    // --- 6. TERAPKAN KE SEMUA PRODUK ---
    async function applyToAllProducts(disc) {
        if(!confirm(`Yakin ingin menerapkan voucher "${disc.name}" (${disc.percentage}%) ke SEMUA produk?\n\nHarga seluruh produk akan didiskon seketika.`)) return;
        
        isApplying = disc.id;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/discounts/${disc.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ apply_to_all: true, product_ids: [] })
            });

            const data = await res.json();
            if (res.ok) alert(`✅ Berhasil: ${data.message}`);
            else alert(`❌ Gagal: ${data.detail || 'Terjadi kesalahan'}`);
        } catch (e) { alert("Gagal koneksi ke server."); } 
        finally { isApplying = null; }
    }

    // --- 7. FITUR PILIH PRODUK UNTUK DISKON ---
    async function openProductSelection(disc) {
        activeDiscountForSelection = disc;
        selectedProductIds = [];
        productSearchQuery = '';
        selectedCategoryFilter = ''; // Reset filter dropdown
        showProductModal = true;
        await fetchModalProducts();
    }

    async function fetchModalProducts() {
        isFetchingProducts = true;
        try {
            const token = localStorage.getItem("token");
            // Tarik lebih banyak data agar dropdown kategori lebih kaya
            let url = `${API_BASE}/products/?limit=100`; 
            if (productSearchQuery) url += `&q=${productSearchQuery}`;

            const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) {
                const result = await res.json();
                modalProducts = result.data ? result.data : result;
            }
        } catch (e) {
            console.error("Gagal load produk:", e);
        } finally {
            isFetchingProducts = false;
        }
    }

    function toggleSelection(id) {
        if (selectedProductIds.includes(id)) {
            selectedProductIds = selectedProductIds.filter(pid => pid !== id);
        } else {
            selectedProductIds = [...selectedProductIds, id];
        }
    }

    async function applyToSelected() {
        if (selectedProductIds.length === 0) return;
        
        isApplying = activeDiscountForSelection.id;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/discounts/${activeDiscountForSelection.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ apply_to_all: false, product_ids: selectedProductIds })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`✅ Berhasil: ${data.message}`);
                showProductModal = false;
            } else {
                alert(`❌ Gagal: ${data.detail || 'Terjadi kesalahan'}`);
            }
        } catch (e) { 
            alert("Gagal koneksi ke server."); 
        } finally {
            isApplying = null;
        }
    }

    function openAddModal() {
        formData = { name: '', percentage: 10, is_active: true };
        showModal = true;
    }
</script>

<div class="space-y-6 pb-20">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div class="w-full md:w-auto">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TagIcon class="text-purple-600" /> Kelola Diskon
            </h2>
            <p class="text-gray-500 text-sm italic">Buat tiket voucher untuk promo global maupun per produk</p>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
                <SearchIcon size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    bind:value={searchQuery} 
                    placeholder="Cari voucher..." 
                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-100 outline-none transition" 
                />
            </div>
            <button onclick={openAddModal} class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-200 transition whitespace-nowrap">
                <PlusIcon size="18" /> Buat Voucher
            </button>
        </div>
    </div>

    {#if isLoading && discounts.length === 0}
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <LoaderIcon class="animate-spin text-purple-300" size="40"/>
            <p class="animate-pulse font-bold text-xs">Memuat Data Voucher...</p>
        </div>
    {:else}
        {#if filteredDiscounts.length === 0}
            <div class="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <TagIcon size="48" class="mb-4 text-gray-200"/>
                <p>Belum ada voucher diskon.</p>
                <button onclick={openAddModal} class="text-purple-600 font-bold text-sm mt-2 hover:underline">Buat Baru Sekarang</button>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {#each filteredDiscounts as item (item.id)}
                <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                    
                    {#if item.isUploading}
                        <div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-3xl">
                            <LoaderIcon size="24" class="animate-spin text-purple-600 mb-2"/>
                            <p class="text-[10px] font-bold text-purple-800 animate-pulse uppercase tracking-wider">Menyimpan...</p>
                        </div>
                    {/if}

                    <div class="absolute -right-4 -bottom-6 text-gray-50 transform -rotate-12 group-hover:scale-110 group-hover:text-purple-50 transition duration-500">
                        <PercentIcon size="100" />
                    </div>

                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-3">
                            <div class="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <TagIcon size="10"/> Voucher
                            </div>
                            
                            <button 
                                onclick={() => toggleStatus(item)}
                                disabled={item.isUploading}
                                class="w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none {item.is_active ? 'bg-green-500' : 'bg-gray-200'}"
                                title={item.is_active ? "Nonaktifkan Voucher" : "Aktifkan Voucher"}
                            >
                                <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 {item.is_active ? 'translate-x-5' : 'translate-x-0'}"></span>
                            </button>
                        </div>
                        
                        <h3 class="text-lg font-bold text-gray-800 leading-tight mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
                        
                        <div class="flex items-baseline gap-1 mb-5">
                            <span class="text-4xl font-black {item.is_active ? 'text-purple-600' : 'text-gray-300'} transition-colors">{item.percentage}</span>
                            <span class="text-xl font-bold text-gray-400">%</span>
                            <span class="text-xs text-gray-400 font-medium ml-1">OFF</span>
                        </div>

                        <div class="flex flex-col gap-2 mb-2">
                            <button 
                                onclick={() => applyToAllProducts(item)}
                                disabled={!item.is_active || isApplying === item.id || item.isUploading}
                                class="w-full py-2.5 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 {item.is_active ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
                                title={!item.is_active ? "Aktifkan voucher dulu" : "Terapkan ke seluruh produk"}
                            >
                                {#if isApplying === item.id}
                                    <LoaderIcon size="14" class="animate-spin"/> Memproses...
                                {:else}
                                    <ZapIcon size="14" /> Terapkan Semua
                                {/if}
                            </button>
                            <button 
                                onclick={() => openProductSelection(item)}
                                disabled={!item.is_active || isApplying === item.id || item.isUploading}
                                class="w-full py-2.5 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 {item.is_active ? 'border border-purple-200 text-purple-600 hover:bg-purple-50' : 'border border-gray-200 text-gray-400 cursor-not-allowed'}"
                                title={!item.is_active ? "Aktifkan voucher dulu" : "Pilih produk spesifik untuk diskon ini"}
                            >
                                <ListIcon size="14" /> Pilih Produk
                            </button>
                        </div>
                    </div>

                    <div class="flex justify-between items-center relative z-10 pt-4 border-t border-gray-50 mt-2">
                        <div class="flex items-center gap-2">
                            {#if item.is_active}
                                <span class="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                    <CheckCircleIcon size="10"/> Aktif
                                </span>
                            {:else}
                                <span class="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                    <AlertCircleIcon size="10"/> Nonaktif
                                </span>
                            {/if}
                        </div>
                        <button onclick={() => handleDelete(item.id, item.name)} disabled={item.isUploading} class="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition disabled:opacity-50" title="Hapus Permanen">
                            <Trash2Icon size="16"/>
                        </button>
                    </div>
                </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-bold text-gray-800">Buat Voucher Baru</h3>
            <button onclick={() => showModal = false} class="bg-white p-1 rounded-full text-gray-400 hover:text-red-500 transition shadow-sm"><XIcon size="18"/></button>
        </div>
        <form onsubmit={handleSubmit} class="p-6 space-y-5">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Promo</label>
                <input 
                    type="text" 
                    bind:value={formData.name} required 
                    placeholder="Cth: Diskon Akhir Tahun" 
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-sm font-bold text-gray-700" 
                />
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Besar Diskon (%)</label>
                <div class="relative">
                    <input 
                        type="number" 
                        bind:value={formData.percentage} min="1" max="100" required 
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-sm font-bold text-gray-700 pr-10" 
                    />
                    <PercentIcon size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
                <p class="text-[10px] text-gray-400 mt-1 ml-1">*Nilai antara 1 sampai 100.</p>
            </div>
            
            <div class="pt-2">
                <button type="submit" class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex justify-center items-center gap-2">
                    Simpan & Lanjutkan
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

{#if showProductModal}
<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <div>
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">Pilih Produk Promo</h3>
                <p class="text-xs text-purple-600 font-bold mt-0.5">Voucher: {activeDiscountForSelection?.name} ({activeDiscountForSelection?.percentage}%)</p>
            </div>
            <button onclick={() => showProductModal = false} class="bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 transition shadow-sm"><XIcon size="18"/></button>
        </div>
        
        <div class="p-4 border-b border-gray-100 bg-white shrink-0 flex flex-col md:flex-row gap-3">
            <div class="relative flex-1">
                <SearchIcon size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    bind:value={productSearchQuery}
                    onkeyup={(e) => e.key === 'Enter' && fetchModalProducts()}
                    placeholder="Cari nama produk lalu tekan Enter..." 
                    class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 outline-none transition" 
                />
            </div>
            
            <select 
                bind:value={selectedCategoryFilter} 
                class="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 outline-none transition md:w-56 text-gray-700 font-bold cursor-pointer"
            >
                <option value="">Semua Subkategori</option>
                {#each uniqueCategories as cat}
                    <option value={cat}>{cat}</option>
                {/each}
            </select>
        </div>

        <div class="p-0 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
            {#if isFetchingProducts}
                <div class="flex justify-center py-10"><LoaderIcon class="animate-spin text-purple-400" size="24"/></div>
            {:else if displayedModalProducts.length === 0}
                <div class="text-center py-10 text-gray-400 text-sm font-medium">Produk tidak ditemukan di kategori ini.</div>
            {:else}
                <div class="divide-y divide-gray-100">
                    {#each displayedModalProducts as prod}
                        <label class="flex items-center gap-3 p-4 hover:bg-purple-50/50 cursor-pointer transition">
                            <input 
                                type="checkbox" 
                                checked={selectedProductIds.includes(prod.id)}
                                onchange={() => toggleSelection(prod.id)}
                                class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 cursor-pointer"
                            >
                            <img src={prod.image_1_url || 'https://placehold.co/100?text=No+Img'} class="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white" alt="img"/>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-bold text-gray-800 truncate">{prod.name}</h4>
                                <p class="text-xs text-purple-500 font-bold mt-0.5 inline-block bg-purple-100 px-1.5 py-0.5 rounded">{prod.subcategory || prod.category || 'Umum'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs font-bold text-gray-800">Rp {prod.price.toLocaleString('id-ID')}</p>
                                {#if prod.discount_label}
                                    <span class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">Diskon Aktif</span>
                                {/if}
                            </div>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex justify-between items-center">
            <span class="text-sm font-bold text-gray-600"><span class="text-purple-600 text-lg">{selectedProductIds.length}</span> Produk Terpilih</span>
            <div class="flex gap-2">
                <button onclick={() => showProductModal = false} class="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">Batal</button>
                <button onclick={applyToSelected} disabled={selectedProductIds.length === 0 || isApplying} class="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-purple-200">
                    {#if isApplying}
                        <LoaderIcon size="16" class="animate-spin"/> Memproses
                    {:else}
                        <CheckCircleIcon size="16"/> Terapkan Diskon
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
{/if}