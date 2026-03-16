<!-- <script>
    import { 
        PlusIcon, TagIcon, Trash2Icon, XIcon, LoaderIcon, 
        SearchIcon, PercentIcon, AlertCircleIcon, CheckCircleIcon
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- STATE ---
    let discounts = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);
    let searchQuery = $state('');

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

    // --- 2. SEARCH FILTER ---
    let filteredDiscounts = $derived(
        discounts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- 3. SUBMIT (BUAT BARU) ---
    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        const token = localStorage.getItem("token");
        
        try {
            const res = await fetch(`${API_BASE}/discounts/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showModal = false;
                formData = { name: '', percentage: 10, is_active: true }; // Reset form
                await loadDiscounts(); // Refresh data
            } else {
                alert("Gagal menyimpan diskon.");
            }
        } catch (e) { 
            alert("Error koneksi server."); 
        } finally { 
            isSubmitting = false; 
        }
    }

    // --- 4. TOGGLE STATUS (ON/OFF) ---
    async function toggleStatus(disc) {
        // Optimistic Update (Ubah tampilan dulu biar cepat)
        const oldState = disc.is_active;
        disc.is_active = !disc.is_active;
        
        const token = localStorage.getItem("token");
        try {
            // Panggil endpoint toggle
            const res = await fetch(`${API_BASE}/discounts/${disc.id}/toggle?is_active=${disc.is_active}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) {
                disc.is_active = oldState; // Kembalikan jika gagal
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
            <p class="text-gray-500 text-sm italic">Buat tiket voucher untuk promo global</p>
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

    {#if isLoading}
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
                                class="w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none {item.is_active ? 'bg-green-500' : 'bg-gray-200'}"
                                title={item.is_active ? "Nonaktifkan Voucher" : "Aktifkan Voucher"}
                            >
                                <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 {item.is_active ? 'translate-x-5' : 'translate-x-0'}"></span>
                            </button>
                        </div>
                        
                        <h3 class="text-lg font-bold text-gray-800 leading-tight mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
                        
                        <div class="flex items-baseline gap-1 mb-4">
                            <span class="text-4xl font-black {item.is_active ? 'text-purple-600' : 'text-gray-300'} transition-colors">{item.percentage}</span>
                            <span class="text-xl font-bold text-gray-400">%</span>
                            <span class="text-xs text-gray-400 font-medium ml-1">OFF</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center relative z-10 pt-4 border-t border-gray-50">
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
                        <button onclick={() => handleDelete(item.id, item.name)} class="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition" title="Hapus Permanen">
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
                <button type="submit" disabled={isSubmitting} class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex justify-center items-center gap-2">
                    {#if isSubmitting}
                        <LoaderIcon size="18" class="animate-spin"/> Menyimpan...
                    {:else}
                        Simpan Voucher
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if} -->



<script>
    import { 
        PlusIcon, TagIcon, Trash2Icon, XIcon, LoaderIcon, 
        SearchIcon, PercentIcon, AlertCircleIcon, CheckCircleIcon,
        ZapIcon // [BARU] Icon untuk tombol terapkan masal
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- STATE ---
    let discounts = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);
    let searchQuery = $state('');
    
    // [BARU] State untuk loading saat menerapkan diskon
    let isApplying = $state(null); 

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

    // --- 2. SEARCH FILTER ---
    let filteredDiscounts = $derived(
        discounts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- 3. SUBMIT (BUAT BARU) ---
    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        const token = localStorage.getItem("token");
        
        try {
            const res = await fetch(`${API_BASE}/discounts/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showModal = false;
                formData = { name: '', percentage: 10, is_active: true }; // Reset form
                await loadDiscounts(); // Refresh data
            } else {
                alert("Gagal menyimpan diskon.");
            }
        } catch (e) { 
            alert("Error koneksi server."); 
        } finally { 
            isSubmitting = false; 
        }
    }

    // --- 4. TOGGLE STATUS (ON/OFF) ---
    async function toggleStatus(disc) {
        // Optimistic Update (Ubah tampilan dulu biar cepat)
        const oldState = disc.is_active;
        disc.is_active = !disc.is_active;
        
        const token = localStorage.getItem("token");
        try {
            // Panggil endpoint toggle
            const res = await fetch(`${API_BASE}/discounts/${disc.id}/toggle?is_active=${disc.is_active}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) {
                disc.is_active = oldState; // Kembalikan jika gagal
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

    // --- [BARU] 6. TERAPKAN KE SEMUA PRODUK ---
    async function applyToAllProducts(disc) {
        if(!confirm(`Yakin ingin menerapkan voucher "${disc.name}" (${disc.percentage}%) ke SEMUA produk katalog?\n\nHarga seluruh produk akan didiskon seketika.`)) return;
        
        isApplying = disc.id;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/discounts/${disc.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ apply_to_all: true, product_ids: [] })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`✅ Berhasil: ${data.message}`);
            } else {
                alert(`❌ Gagal: ${data.detail || 'Terjadi kesalahan'}`);
            }
        } catch (e) { 
            alert("Gagal koneksi ke server saat menerapkan diskon."); 
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
            <p class="text-gray-500 text-sm italic">Buat tiket voucher untuk promo global</p>
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

    {#if isLoading}
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
                                class="w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none {item.is_active ? 'bg-green-500' : 'bg-gray-200'}"
                                title={item.is_active ? "Nonaktifkan Voucher" : "Aktifkan Voucher"}
                            >
                                <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 {item.is_active ? 'translate-x-5' : 'translate-x-0'}"></span>
                            </button>
                        </div>
                        
                        <h3 class="text-lg font-bold text-gray-800 leading-tight mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
                        
                        <div class="flex items-baseline gap-1 mb-3">
                            <span class="text-4xl font-black {item.is_active ? 'text-purple-600' : 'text-gray-300'} transition-colors">{item.percentage}</span>
                            <span class="text-xl font-bold text-gray-400">%</span>
                            <span class="text-xs text-gray-400 font-medium ml-1">OFF</span>
                        </div>

                        <button 
                            onclick={() => applyToAllProducts(item)}
                            disabled={!item.is_active || isApplying === item.id}
                            class="w-full mb-4 py-2.5 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 {item.is_active ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
                            title={!item.is_active ? "Aktifkan voucher dulu untuk menerapkan" : "Terapkan diskon ini ke seluruh produk"}
                        >
                            {#if isApplying === item.id}
                                <LoaderIcon size="14" class="animate-spin"/> Memproses...
                            {:else}
                                <ZapIcon size="14" /> Terapkan ke Semua Produk
                            {/if}
                        </button>
                    </div>

                    <div class="flex justify-between items-center relative z-10 pt-4 border-t border-gray-50">
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
                        <button onclick={() => handleDelete(item.id, item.name)} class="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition" title="Hapus Permanen">
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
                <button type="submit" disabled={isSubmitting} class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex justify-center items-center gap-2">
                    {#if isSubmitting}
                        <LoaderIcon size="18" class="animate-spin"/> Menyimpan...
                    {:else}
                        Simpan Voucher
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}