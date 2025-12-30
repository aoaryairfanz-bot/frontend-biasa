<script>
    import { 
        PlusIcon, MapPinIcon, Trash2Icon, PhoneIcon, 
        XIcon, LoaderIcon, HomeIcon, MapIcon, ExternalLinkIcon 
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public'; // 1. Tambahkan Import PUBLIC_API_URL

    // --- STATE ---
    let branches = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);

    // Form State sesuai data Baginda
    let formData = $state({
        name: '',
        whatsapp: '',
        address: '',
        maps_url: ''
    });

    // 2. Gunakan PUBLIC_API_URL sebagai basis
    const API_BASE = PUBLIC_API_URL;

    // --- 1. LOAD DATA ---
    async function loadBranches() {
        isLoading = true;
        try {
            const res = await fetch(`${API_BASE}/branches`);
            if (res.ok) {
                const data = await res.json();
                branches = data;
            }
        } catch (error) {
            console.error("Error load cabang:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(loadBranches);

    // --- 2. SUBMIT DATA ---
    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_BASE}/branches`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("Cabang Berhasil Ditambahkan!");
                showModal = false;
                formData = { name: '', whatsapp: '', address: '', maps_url: '' };
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

    // --- 3. DELETE DATA ---
    async function handleDelete(id, name) {
        if (!confirm(`Hapus cabang ${name}?`)) return;
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_BASE}/branches/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                loadBranches();
            } else {
                alert("Gagal hapus cabang.");
            }
        } catch (error) {
            alert("Error koneksi.");
        }
    }
</script>

<div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MapPinIcon class="text-[#C4161C]" /> Manajemen Cabang
            </h2>
            <p class="text-gray-500 text-sm italic">Kelola daftar lokasi toko fisik Narwastu Store</p>
        </div>
        <button onclick={() => showModal = true} 
            class="bg-[#C4161C] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-red-100">
            <PlusIcon size="20" /> Tambah Cabang
        </button>
    </div>

    {#if isLoading}
        <div class="flex flex-col items-center justify-center py-20 gap-3">
            <LoaderIcon class="animate-spin text-gray-300" size="40" />
            <p class="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-xs">Memuat Data...</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each branches as branch}
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition relative group overflow-hidden">
                    <button 
                        onclick={() => handleDelete(branch.id, branch.name)}
                        class="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-600 transition md:opacity-0 md:group-hover:opacity-100"
                    >
                        <Trash2Icon size="18" />
                    </button>

                    <div class="flex flex-col gap-4">
                        <div class="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#C4161C]">
                            <HomeIcon />
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">{branch.name}</h3>
                            <p class="text-xs text-gray-500 flex items-start gap-1 mt-2 leading-relaxed">
                                <MapPinIcon size="12" class="shrink-0 mt-0.5" /> {branch.address}
                            </p>
                        </div>

                        <div class="pt-4 border-t border-gray-50 space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 text-green-600 font-bold text-sm">
                                    <PhoneIcon size="14" /> {branch.whatsapp}
                                </div>
                                {#if branch.maps_url}
                                <a href={branch.maps_url} target="_blank" class="flex items-center gap-1 text-blue-500 font-bold text-[10px] uppercase hover:underline">
                                    <MapIcon size="12" /> Lihat Map
                                </a>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <MapPinIcon size="48" class="mx-auto text-gray-200 mb-2" />
                    <p class="text-gray-400 font-bold italic uppercase tracking-tighter">Belum ada data cabang toko.</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <h3 class="text-xl font-bold text-gray-800 uppercase italic tracking-tighter">Tambah Cabang Baru</h3>
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
                <input 
                    type="text" id="wa" bind:value={formData.whatsapp} required 
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-sm font-medium" 
                    placeholder="Contoh: 628123456789" 
                />
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

            <div class="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onclick={() => showModal = false} 
                    class="flex-1 px-6 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-100 transition uppercase text-xs">
                    Batal
                </button>
                <button type="submit" disabled={isSubmitting} 
                    class="flex-1 bg-[#C4161C] hover:bg-black text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-100 uppercase text-xs">
                    {#if isSubmitting}
                        <LoaderIcon size="16" class="animate-spin" /> Tunggu...
                    {:else}
                        <PlusIcon size="16" /> Simpan
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}