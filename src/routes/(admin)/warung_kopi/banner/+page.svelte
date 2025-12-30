<script>
    import { 
        ImageIcon, PlusIcon, Trash2Icon, LinkIcon, MonitorIcon, 
        LayersIcon, CheckCircleIcon, LoaderIcon, XIcon, UploadCloudIcon 
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public'; // 1. Integrasi Env Cloudflare

    // --- STATE VARIABLES ---
    let activePopup = $state(null);
    let sliders = $state([]);
    let isLoading = $state(true);
    let showModal = $state(false);
    let isSubmitting = $state(false);

    // Form Data
    let formData = $state({
        title: '',
        link_url: '',
        type: 'slider', 
        image: null
    });
    
    let imagePreview = $state(null);
    let fileInput; 

    // 2. Menggunakan URL dari Dashboard Cloudflare secara otomatis
    const API_BASE = PUBLIC_API_URL;

    // --- 1. FETCH DATA (LOAD) ---
    async function loadData() {
        isLoading = true;
        try {
            // Fetch Sliders
            const resSlider = await fetch(`${API_BASE}/banners/`);
            if (resSlider.ok) sliders = await resSlider.json();

            // Fetch Popup
            const resPopup = await fetch(`${API_BASE}/banners/popup`);
            if (resPopup.ok) activePopup = await resPopup.json();

        } catch (error) {
            console.error("Gagal ambil data:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    // --- 2. HANDLE FILE ---
    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            formData.image = file;
            imagePreview = URL.createObjectURL(file);
        }
    }

    function removeFile() {
        formData.image = null;
        imagePreview = null;
        if (fileInput) fileInput.value = '';
    }

    // --- 3. SUBMIT FORM ---
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!formData.image) {
            alert("Wajib upload gambar!");
            return;
        }

        isSubmitting = true;
        const token = localStorage.getItem("token"); 

        try {
            const dataToSend = new FormData();
            dataToSend.append('title', formData.title);
            dataToSend.append('link_url', formData.link_url);
            dataToSend.append('type', formData.type);
            dataToSend.append('image', formData.image); 

            const res = await fetch(`${API_BASE}/banners/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}` 
                },
                body: dataToSend
            });

            if (res.ok) {
                alert(`Berhasil menambah ${formData.type}!`);
                showModal = false;
                resetForm();
                loadData(); 
            } else {
                const err = await res.json();
                alert("Gagal: " + (err.detail || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Error koneksi server.");
        } finally {
            isSubmitting = false;
        }
    }

    function resetForm() {
        formData = { title: '', link_url: '', type: 'slider', image: null };
        imagePreview = null;
    }
</script>

<div class="space-y-8 pb-20">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Banner & Popup</h2>
            <p class="text-gray-500 text-sm">Kelola gambar promo halaman depan</p>
        </div>
        <button onclick={() => { resetForm(); showModal = true; }} 
            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition">
            <PlusIcon size="20" /> Tambah Baru
        </button>
    </div>

    <section>
        <h3 class="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <MonitorIcon size="20" class="text-purple-500"/> Popup Aktif
        </h3>
        
        {#if isLoading}
            <div class="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
        {:else if activePopup}
            <div class="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10"></div>

                <div class="w-full md:w-64 aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200 shrink-0">
                    <img src={activePopup.image_url} alt={activePopup.title} class="w-full h-full object-cover" />
                </div>

                <div class="flex-1 z-10">
                    <div class="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mb-2">POPUP UTAMA</div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">{activePopup.title}</h4>
                    
                    {#if activePopup.link_url}
                        <a href={activePopup.link_url} target="_blank" class="text-blue-500 text-sm hover:underline flex items-center gap-1 mb-4">
                            <LinkIcon size="14"/> {activePopup.link_url}
                        </a>
                    {:else}
                        <p class="text-gray-400 text-sm mb-4 italic">Tidak ada link tautan</p>
                    {/if}

                    <div class="text-sm text-gray-500">
                        Popup ini akan muncul pertama kali saat pengunjung membuka website.
                    </div>
                </div>
            </div>
        {:else}
            <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-400">
                <LayersIcon size="48" class="mx-auto mb-2 opacity-50"/>
                <p>Belum ada popup aktif.</p>
            </div>
        {/if}
    </section>

    <section>
        <h3 class="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <ImageIcon size="20" class="text-blue-500"/> Slider Banner
        </h3>

        {#if isLoading}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
                <div class="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
            </div>
        {:else if sliders.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each sliders as banner}
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition">
                    <div class="relative aspect-video bg-gray-200">
                        <img src={banner.image_url} alt={banner.title} class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button class="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition" title="Hapus">
                                <Trash2Icon size="18"/>
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <h5 class="font-bold text-gray-800 line-clamp-1" title={banner.title}>{banner.title}</h5>
                        {#if banner.link_url}
                            <div class="text-xs text-blue-500 mt-1 truncate">{banner.link_url}</div>
                        {/if}
                    </div>
                </div>
                {/each}
            </div>
        {:else}
            <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-400">
                <p>Belum ada slider banner.</p>
            </div>
        {/if}
    </section>

</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-100">
            <h3 class="text-xl font-bold text-gray-800">Tambah Promo Baru</h3>
            <button onclick={() => showModal = false} class="text-gray-400 hover:text-red-500 transition">
                <XIcon size="24"/>
            </button>
        </div>

        <div class="p-6">
            <form onsubmit={handleSubmit} class="space-y-5">
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Tipe Tampilan</label>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="cursor-pointer">
                            <input type="radio" bind:group={formData.type} value="slider" class="peer sr-only" />
                            <div class="p-3 rounded-xl border-2 border-gray-100 peer-checked:border-blue-500 peer-checked:bg-blue-50 text-center transition">
                                <ImageIcon size="24" class="mx-auto mb-1 text-gray-500 peer-checked:text-blue-600"/>
                                <span class="text-sm font-bold text-gray-600 peer-checked:text-blue-700">Slider (Atas)</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" bind:group={formData.type} value="popup" class="peer sr-only" />
                            <div class="p-3 rounded-xl border-2 border-gray-100 peer-checked:border-purple-500 peer-checked:bg-purple-50 text-center transition">
                                <MonitorIcon size="24" class="mx-auto mb-1 text-gray-500 peer-checked:text-purple-600"/>
                                <span class="text-sm font-bold text-gray-600 peer-checked:text-purple-700">Popup (Muncul)</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Judul / Nama Promo</label>
                    <input type="text" bind:value={formData.title} required class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Promo Natal" />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Link Tautan (Opsional)</label>
                    <input type="url" bind:value={formData.link_url} class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Gambar Banner</label>
                    <div class="relative border-2 border-dashed {imagePreview ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-xl min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition">
                        
                        {#if imagePreview}
                            <img src={imagePreview} alt="Preview" class="h-32 object-contain rounded-lg shadow-sm" />
                            <button type="button" onclick={removeFile} class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition"><XIcon size="14"/></button>
                            <div class="text-xs text-green-600 font-bold mt-2 flex items-center gap-1"><CheckCircleIcon size="12"/> Siap Upload</div>
                        {:else}
                            <UploadCloudIcon size="32" class="text-gray-400 mb-2"/>
                            <span class="text-xs text-gray-500 font-bold">Klik untuk pilih gambar</span>
                            <span class="text-[10px] text-gray-400 mt-1">Format: JPG, PNG</span>
                        {/if}

                        <input type="file" bind:this={fileInput} accept="image/*" onchange={handleFileChange} class="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div class="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onclick={() => showModal = false} class="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" disabled={isSubmitting} class="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70">
                        {#if isSubmitting}
                            <LoaderIcon size="18" class="animate-spin"/> Menyimpan...
                        {:else}
                            Simpan
                        {/if}
                    </button>
                </div>

            </form>
        </div>
    </div>
</div>
{/if}