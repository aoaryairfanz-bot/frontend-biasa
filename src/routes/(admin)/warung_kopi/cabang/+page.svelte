<script>
    import { 
        PlusIcon, MapPinIcon, Trash2Icon, PhoneIcon, Edit2Icon,
        XIcon, LoaderIcon, MapIcon, PowerIcon, SearchIcon
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- STATE ---
    let branches = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);
    let isEditing = $state(false); // Mode Edit
    let searchQuery = $state('');

    // Form State
    let formData = $state({
        id: null,
        name: '',
        whatsapp: '',
        address: '',
        maps_url: '',
        is_active: true
    });

    const API_BASE = PUBLIC_API_URL;

    // --- 1. LOAD DATA ---
    async function loadBranches() {
        isLoading = true;
        try {
            // Ambil semua cabang termasuk yg nonaktif (biar admin bisa lihat)
            const res = await fetch(`${API_BASE}/branches?include_inactive=true`);
            if (res.ok) {
                const raw = await res.json();
                branches = Array.isArray(raw) ? raw : (raw.data || []);
            }
        } catch (error) {
            console.error("Error load cabang:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(loadBranches);

    // --- 2. SEARCH FILTER ---
    let filteredBranches = $derived(
        branches.filter(b => 
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            b.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // --- 3. SANITASI INPUT WA ---
    function sanitizePhone(input) {
        // Hapus semua karakter kecuali angka
        return input.replace(/\D/g, '');
    }

    // --- 4. SUBMIT (CREATE / UPDATE) ---
    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        
        // Sanitasi Nomor WA sebelum kirim
        const cleanPhone = sanitizePhone(formData.whatsapp);
        // Jika user input 0812..., ubah jadi 62812... (Opsional, sesuaikan kebutuhan)
        // const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
        const payload = { ...formData, whatsapp: cleanPhone };

        const token = localStorage.getItem("token");
        const method = isEditing ? "PUT" : "POST";
        const url = isEditing ? `${API_BASE}/branches/${formData.id}` : `${API_BASE}/branches`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isEditing ? "Cabang Berhasil Diupdate!" : "Cabang Berhasil Ditambahkan!");
                closeModal();
                loadBranches();
            } else {
                const err = await res.json();
                alert("Gagal: " + (err.detail || "Terjadi kesalahan"));
            }
        } catch (error) {
            alert("Error koneksi server.");
        } finally {
            isSubmitting = false;
        }
    }

    // --- 5. TOGGLE STATUS (AKTIF/NONAKTIF) ---
    async function toggleStatus(branch) {
        if(!confirm(`Ubah status cabang ${branch.name}?`)) return;
        
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/branches/${branch.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ ...branch, is_active: !branch.is_active })
            });
            if(res.ok) loadBranches();
        } catch(e) { alert("Gagal update status."); }
    }

    // --- 6. DELETE ---
    async function handleDelete(id, name) {
        if (!confirm(`Hapus permanen cabang ${name}?`)) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/branches/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) loadBranches();
            else alert("Gagal hapus cabang.");
        } catch (error) { alert("Error koneksi."); }
    }

    // --- MODAL HELPER ---
    function openAddModal() {
        isEditing = false;
        formData = { id: null, name: '', whatsapp: '', address: '', maps_url: '', is_active: true };
        showModal = true;
    }

    function openEditModal(branch) {
        isEditing = true;
        formData = { ...branch };
        showModal = true;
    }

    function closeModal() {
        showModal = false;
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

    {#if isLoading}
        <div class="flex flex-col items-center justify-center py-20 gap-3">
            <LoaderIcon class="animate-spin text-gray-300" size="40" />
            <p class="text-gray-400 font-medium animate-pulse text-xs">Memuat Data...</p>
        </div>
    {:else}
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                    <tbody class="divide-y divide-gray-50 text-sm text-gray-700">
                        {#if filteredBranches.length === 0}
                            <tr><td colspan="5" class="p-8 text-center text-gray-400 italic">Tidak ada data cabang.</td></tr>
                        {:else}
                            {#each filteredBranches as branch}
                            <tr class="hover:bg-red-50/30 transition group">
                                <td class="p-4 text-center">
                                    <button 
                                        onclick={() => toggleStatus(branch)}
                                        class="w-8 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none {branch.is_active ? 'bg-green-500' : 'bg-gray-300'}"
                                        title={branch.is_active ? "Nonaktifkan" : "Aktifkan"}
                                    >
                                        <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 {branch.is_active ? 'translate-x-3' : 'translate-x-0'}"></span>
                                    </button>
                                </td>
                                <td class="p-4 font-bold text-gray-800">
                                    {branch.name}
                                    {#if branch.id === 1} <span class="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded uppercase">Pusat</span> {/if}
                                </td>
                                <td class="p-4 font-mono text-gray-600">{branch.whatsapp}</td>
                                <td class="p-4 max-w-xs truncate text-gray-500" title={branch.address}>{branch.address}</td>
                                <td class="p-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        {#if branch.maps_url}
                                            <a href={branch.maps_url} target="_blank" class="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition" title="Lihat Map">
                                                <MapIcon size="16"/>
                                            </a>
                                        {/if}
                                        <button onclick={() => openEditModal(branch)} class="p-2 text-orange-400 hover:bg-orange-50 rounded-lg transition" title="Edit">
                                            <Edit2Icon size="16"/>
                                        </button>
                                        <button onclick={() => handleDelete(branch.id, branch.name)} class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Hapus">
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
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <h3 class="text-xl font-bold text-gray-800 uppercase italic tracking-tighter">
                {isEditing ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            </h3>
            <button onclick={closeModal} class="text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm">
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
                <p class="text-[10px] text-gray-400 mt-1 ml-1">*Karakter +, -, spasi otomatis dihapus.</p>
            </div>

            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1" for="maps">Link Google Maps (URL)</label>
                <input 
                    type="url" id="maps" bind:value={formData.maps_url} 
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                    placeholder="https://maps.google.com/..." 
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

            {#if isEditing}
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div class="text-xs font-bold text-gray-500 uppercase flex-1">Status Toko</div>
                <button type="button" onclick={() => formData.is_active = !formData.is_active} class="relative w-10 h-6 rounded-full transition {formData.is_active ? 'bg-green-500' : 'bg-gray-300'}">
                    <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform {formData.is_active ? 'translate-x-4' : ''}"></span>
                </button>
            </div>
            {/if}

            <div class="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onclick={closeModal} 
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