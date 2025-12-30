<script>
    import { 
        XIcon, UploadCloudIcon, LoaderIcon, CheckCircleIcon, 
        BoxIcon, FilterIcon, BookIcon, ImageIcon, PlusIcon 
    } from 'svelte-feather-icons';
    import { PUBLIC_API_URL } from '$env/static/public';
    import imageCompression from 'browser-image-compression';

    // --- PROPS (Data dari Induk) ---
    let { show, editData, onClose, onSuccess } = $props();

    // --- STATE ---
    let isSubmitting = $state(false);
    let submitStatus = $state('');
    let fileStorage = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let previews = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    
    // Form Default
    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
        weight: '', length: '', width: '', height: '', diameter: '',
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
    });

    // Dropdown (Bisa juga dipass dari parent, tapi ditaruh sini gpp)
    let uniqueSubcategories = ["Kopi", "Peralatan", "Buku", "Merchandise"]; 

    // --- EFFECT: ISI FORM SAAT EDIT ---
    $effect(() => {
        if (show) {
            if (editData) {
                // Mode Edit: Isi form dengan data yang ada
                formData = { ...formData, ...editData };
                // Load preview gambar dari server
                previews.foto_1 = editData.image_1_url;
                previews.foto_2 = editData.image_2_url;
                previews.foto_3 = editData.image_3_url;
                previews.video = editData.video_url;
            } else {
                // Mode Tambah: Reset form
                resetForm();
            }
        }
    });

    function resetForm() {
        formData = {
            name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
            weight: '', length: '', width: '', height: '', diameter: '',
            isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        previews = { foto_1: null, foto_2: null, foto_3: null, video: null };
    }

    // --- LOGIKA UPLOAD (SAMA SEPERTI SEBELUMNYA) ---
    function handleFileChange(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            fileStorage[fieldName] = file;
            previews[fieldName] = URL.createObjectURL(file);
        }
    }

    function removeFile(fieldName) {
        fileStorage[fieldName] = null;
        previews[fieldName] = null;
    }

    function toTitleCase(str) {
        return str?.toLowerCase().replace(/(?:^|\s)\w/g, m => m.toUpperCase()) || '';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!fileStorage.foto_1 && !previews.foto_1) { alert("Wajib ada Thumbnail!"); return; }

        isSubmitting = true;
        submitStatus = "Memproses Gambar...";
        const token = localStorage.getItem("token");
        const compressionOptions = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true, initialQuality: 0.7 };

        try {
            const dataToSend = new FormData();
            
            // Kompresi
            const imageFields = ['foto_1', 'foto_2', 'foto_3'];
            for (const field of imageFields) {
                if (fileStorage[field] instanceof File) {
                    try {
                        const compressed = await imageCompression(fileStorage[field], compressionOptions);
                        dataToSend.append(field, compressed, compressed.name);
                    } catch { dataToSend.append(field, fileStorage[field]); }
                }
            }
            if (fileStorage.video instanceof File) dataToSend.append('video', fileStorage.video);

            submitStatus = "Mengirim...";
            
            // Append Data Teks
            Object.keys(formData).forEach(key => {
                if (key === 'name' || key === 'subcategory') {
                    dataToSend.append(key, toTitleCase(formData[key]));
                } else if (formData[key]) {
                    dataToSend.append(key, String(formData[key]));
                }
            });

            let url = `${PUBLIC_API_URL}/products/`;
            let method = "POST";
            if (editData && editData.id) { 
                url = `${PUBLIC_API_URL}/products/${editData.id}`; 
                method = "PUT"; 
            }

            const res = await fetch(url, {
                method: method,
                headers: { "Authorization": `Bearer ${token}` },
                body: dataToSend
            });

            if (res.ok) {
                alert("Sukses!");
                onSuccess(); // Panggil fungsi refresh di parent
            } else {
                const err = await res.json();
                alert("Gagal: " + (err.detail || "Error"));
            }
        } catch (error) { 
            console.error(error); alert("Gagal koneksi."); 
        } finally { 
            isSubmitting = false; 
        }
    }
</script>

{#if show}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
            <h3 class="text-xl font-bold text-gray-800">{editData ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <button onclick={onClose} class="text-gray-400 hover:text-red-500 p-2"><XIcon size="24" /></button>
        </div>

        <div class="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-8" onsubmit={handleSubmit}>
                
                <div class="md:col-span-8 space-y-6">
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <label class="block text-sm font-bold text-gray-700">Nama Produk</label>
                        <input type="text" bind:value={formData.name} required class="w-full px-4 py-2 border rounded-xl" />
                        </div>
                    </div>

                <div class="md:col-span-4 space-y-6">
                    <label class="block text-sm font-bold text-gray-700">Thumbnail</label>
                    <div class="relative border-2 border-dashed rounded-xl h-40 flex items-center justify-center">
                        {#if previews.foto_1}
                            <img src={previews.foto_1} alt="Preview" class="h-full w-full object-cover rounded-lg" />
                            <button type="button" onclick={() => removeFile('foto_1')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="14"/></button>
                        {:else}
                            <UploadCloudIcon size="24" class="text-gray-400"/>
                        {/if}
                        <input type="file" accept="image/*" onchange={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onclick={onClose} class="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" disabled={isSubmitting} class="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2">
                        {#if isSubmitting} <LoaderIcon size="20" class="animate-spin" /> <span>{submitStatus}</span>
                        {:else} <UploadCloudIcon size="20"/> <span>Simpan</span> {/if}
                    </button>
                </div>

            </form>
        </div>
    </div>
</div>
{/if}