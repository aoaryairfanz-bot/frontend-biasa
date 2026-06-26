<script>
    import { 
        PlusIcon, MapPinIcon, Trash2Icon, PhoneIcon, Edit2Icon,
        XIcon, LoaderIcon, MapIcon, SearchIcon, RefreshCwIcon, AlertCircleIcon
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- STATE ---
    let branches = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);
    let isEditing = $state(false);
    let searchQuery = $state('');

    const CACHE_KEY = 'admin_branches_cache_v1';
    const API_BASE = PUBLIC_API_URL;

    // Form State
    let formData = $state({
        id: null,
        name: '',
        whatsapp: '',
        address: '',
        maps_url: '',
        is_active: true
    });

    // --- 1. LOAD DATA (CACHE FIRST + SYNC) ---
    onMount(async () => {
        // A. Cek Cache (Instan)
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                branches = JSON.parse(cached);
                isLoading = false; // Langsung tampil
            }
        } catch (e) { console.error("Cache error", e); }

        // B. Fetch Server (Background Sync)
        await loadBranchesFromServer();
    });

    async function loadBranchesFromServer() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/branches?include_inactive=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (res.ok) {
                const raw = await res.json();
                const data = Array.isArray(raw) ? raw : (raw.data || []);
                
                // Update jika ada perubahan
                if (JSON.stringify(data) !== JSON.stringify(branches)) {
                    branches = data;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
                }
            }
        } catch (error) {
            console.error("Error load cabang:", error);
        } finally {
            isLoading = false;
        }
    }

    // --- 2. SEARCH FILTER ---
    let filteredBranches = $derived(
        branches.filter(b => 
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            b.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // --- 3. HELPER ---
    function sanitizePhone(input) { return input.replace(/\D/g, ''); }

    // --- 4. SUBMIT (OPTIMISTIC UI) ---
    async function handleSubmit(e) {
        e.preventDefault();
        
        const cleanPhone = sanitizePhone(formData.whatsapp);
        
        // 🔥 MANTRA PENAWAR: Bungkus cleanPhone dengan String() 
        const payload = { ...formData, whatsapp: String(cleanPhone) };
        
        const isEditMode = isEditing; 
        const token = localStorage.getItem("token");

        // TUTUP MODAL SEGERA
        showModal = false;
        
        // Optimistic Update (Update lokal dulu)
        let oldBranches = [...branches];
        if (isEditMode) {
            branches = branches.map(b => b.id === payload.id ? payload : b);
        } else {
            // ID sementara untuk tampilan
            const tempId = Date.now();
            branches = [...branches, { ...payload, id: tempId }];
        }
        
        isSubmitting = true;
        
        try {
            const method = isEditMode ? "PUT" : "POST";
            const url = isEditMode ? `${API_BASE}/branches/${payload.id}` : `${API_BASE}/branches`;

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Sukses: Sync data asli dari server
                loadBranchesFromServer();
                if (!isEditMode) resetForm();
            } else {
                throw new Error("Gagal menyimpan");
            }
        } catch (error) {
            // Rollback jika gagal
            branches = oldBranches;
            alert("Gagal menyimpan data. Cek koneksi.");
        } finally {
            isSubmitting = false;
        }
    }

    function resetForm() {
        formData = { id: null, name: '', whatsapp: '', address: '', maps_url: '', is_active: true };
    }
    
    // --- 5. TOGGLE STATUS (OPTIMISTIC) ---
    async function toggleStatus(branch) {
        if(!confirm(`Ubah status cabang ${branch.name}?`)) return;
        
        const token = localStorage.getItem("token");
        const oldBranches = [...branches];
        
        // Optimistic Update
        const updatedBranches = branches.map(b => b.id === branch.id ? {...b, is_active: !b.is_active} : b);
        branches = updatedBranches;
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(updatedBranches));

        try {
            const res = await fetch(`${API_BASE}/branches/${branch.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...branch, is_active: !branch.is_active })
            });
            
            if (!res.ok) throw new Error("Gagal");
        } catch(e) { 
            branches = oldBranches; // Rollback
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(oldBranches));
            alert("Gagal update status."); 
        }
    }

    // --- 6. DELETE (OPTIMISTIC) ---
    async function handleDelete(id, name) {
        if (!confirm(`Hapus permanen cabang ${name}?`)) return;
        
        const token = localStorage.getItem("token");
        const oldBranches = [...branches];

        // Optimistic Delete
        const newBranches = branches.filter(b => b.id !== id);
        branches = newBranches;
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(newBranches));

        try {
            const res = await fetch(`${API_BASE}/branches/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Gagal");
        } catch (error) { 
            branches = oldBranches; // Rollback
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(oldBranches));
            alert("Gagal menghapus data."); 
        }
    }

    // --- MODAL HELPER ---
    function openAddModal() {
        isEditing = false;
        resetForm();
        showModal = true;
    }

    function openEditModal(branch) {
        isEditing = true;
        formData = { ...branch };
        showModal = true;
    }
</script>

<div class="space-y-6 pb-20">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div class="w-full md:w-auto">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MapPinIcon class="text-[#C4161C]" /> Manajemen Cabang
            </h2>
            <p class="text-gray-500 text-sm italic">Kelola {branches.length} lokasi toko fisik</p>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
                <SearchIcon size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    bind:value={searchQuery} 
                    placeholder="Cari cabang..." 
                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none transition"
                />
            </div>
            <button onclick={openAddModal} 
                class="bg-[#C4161C] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-red-100 text-sm whitespace-nowrap">
                <PlusIcon size="18" /> <span class="hidden md:inline">Tambah</span>
            </button>
        </div>
    </div>

    {#if isLoading && branches.length === 0}
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <LoaderIcon class="animate-spin text-gray-300" size="40" />
            <p class="font-medium animate-pulse text-xs">Memuat Data...</p>
        </div>
    {:else}
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th class="p-4 font-bold w-10 text-center">Status</th>
                            <th class="p-4 font-bold">Nama Cabang</th>
                            <th class="p-4 font-bold">Kontak (WA)</th>
                            <th class="p-4 font-bold">Alamat</th>
                            <th class="p-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                        {#if filteredBranches.length === 0}
                            <tr><td colspan="5" class="p-8 text-center text-gray-400 italic">Tidak ada data cabang.</td></tr>
                        {:else}
                            {#each filteredBranches as branch (branch.id)}
                            <tr class="hover:bg-red-50/30 transition group">
                                <td class="p-4 text-center align-middle">
                                    <button 
                                        onclick={() => toggleStatus(branch)}
                                        class="w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none {branch.is_active ? 'bg-green-500' : 'bg-gray-300'}"
                                        title={branch.is_active ? "Nonaktifkan" : "Aktifkan"}
                                    >
                                        <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 {branch.is_active ? 'translate-x-4' : 'translate-x-0'}"></span>
                                    </button>
                                </td>
                                <td class="p-4 align-middle">
                                    <div class="font-bold text-gray-800">{branch.name}</div>
                                    {#if branch.id === 1} <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded uppercase font-bold tracking-wider">Pusat</span> {/if}
                                </td>
                                <td class="p-4 font-mono text-gray-600 align-middle">{branch.whatsapp}</td>
                                <td class="p-4 max-w-xs truncate text-gray-500 align-middle" title={branch.address}>{branch.address}</td>
                                <td class="p-4 text-right align-middle">
                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {#if branch.maps_url}
                                            <a href={branch.maps_url} target="_blank" class="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition" title="Lihat Map">
                                                <MapIcon size="16"/>
                                            </a>
                                        {/if}
                                        <button onclick={() => openEditModal(branch)} class="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg transition" title="Edit">
                                            <Edit2Icon size="16"/>
                                        </button>
                                        <button onclick={() => handleDelete(branch.id, branch.name)} class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Hapus">
                                            <Trash2Icon size="16"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <h3 class="text-xl font-bold text-gray-800 uppercase italic tracking-tighter">
                {isEditing ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            </h3>
            <button onclick={() => showModal = false} class="text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm">
                <XIcon size="20" />
            </button>
        </div>

        <form onsubmit={handleSubmit} class="p-6 space-y-5">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1" for="name">Nama Cabang</label>
                <input 
                    type="text" id="name" bind:value={formData.name} required 
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                    placeholder="Narwastu Store Yogyakarta" 
                />
            </div>

            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1" for="wa">Nomor WhatsApp</label>
                <div class="relative">
                    <PhoneIcon size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" id="wa" 
                        bind:value={formData.whatsapp} required 
                        oninput={(e) => formData.whatsapp = sanitizePhone(e.target.value)}
                        class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                        placeholder="0812xxxxxxxx" 
                    />
                </div>
            </div>

            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1" for="maps">Link Google Maps</label>
                <input 
                    type="url" id="maps" bind:value={formData.maps_url} 
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                    placeholder="https://goo.gl/maps/..." 
                />
            </div>

            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1" for="addr">Alamat Lengkap</label>
                <textarea 
                    id="addr" bind:value={formData.address} required rows="3"
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                    placeholder="Jl. Solo Km 10, Yogyakarta..."
                ></textarea>
            </div>

            <div class="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onclick={() => showModal = false} 
                    class="flex-1 px-6 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-100 transition uppercase text-xs">
                    Batal
                </button>
                <button type="submit" disabled={isSubmitting} 
                    class="flex-1 bg-[#C4161C] hover:bg-black text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-100 uppercase text-xs">
                    {#if isSubmitting}
                        <LoaderIcon size="16" class="animate-spin" /> Proses...
                    {:else}
                        {isEditing ? 'Update Cabang' : 'Simpan Cabang'}
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}