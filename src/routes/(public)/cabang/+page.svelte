<script>
    import { 
        MapPinIcon, PhoneIcon, ClockIcon, SearchIcon, NavigationIcon, 
        AlertCircleIcon 
    } from 'svelte-feather-icons';

    // --- 1. DATA DARI SERVER (+page.js) ---
    let { data } = $props(); 
    let branches = $derived(data.branches || []); 

    // --- 2. STATE PENCARIAN ---
    let searchQuery = $state("");

    // --- 3. LOGIKA FILTER ---
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = branch.name?.toLowerCase() || "";
        const address = branch.address?.toLowerCase() || "";
        return name.includes(term) || address.includes(term);
    }));

    // --- 4. HELPER WHATSAPP ---
    function getWALink(phone, name) {
        const cleanPhone = phone ? phone.replace(/\D/g, '') : ''; 
        return `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(name)},%20saya%20ingin%20info%20lebih%20lanjut.`;
    }

    // --- 5. HELPER IMAGE ERROR (PENTING: Harus Function) ---
    function handleImageError(e) {
        e.target.src = 'https://placehold.co/600x400/eee/999?text=No+Image';
    }
</script>

<div class="min-h-screen bg-gray-50 pb-24 pt-6">
    <div class="container mx-auto px-4">
        
        <div class="text-center mb-10 space-y-2">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-800" style="font-family: 'Cinzel', serif;">
                Lokasi <span class="text-[#C4161C]">Kami</span>
            </h1>
            <p class="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
                Kunjungi cabang Narwastu terdekat di kota Anda.
            </p>
        </div>

        <div class="max-w-md mx-auto mb-10 relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon size="20"/>
            </span>
            <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Cari nama cabang atau alamat..." 
                class="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-[#C4161C] focus:ring-2 focus:ring-[#C4161C]/20 outline-none transition shadow-sm bg-white"
            />
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredBranches as branch}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                    
                    <div class="relative h-48 overflow-hidden bg-gray-200">
                        <img 
                            src={branch.image_url || `https://placehold.co/600x400/C4161C/FFFFFF?text=${encodeURIComponent(branch.name)}`} 
                            alt={branch.name} 
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                            onerror={handleImageError} 
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                        <div class="absolute bottom-3 left-4 text-white">
                            <h3 class="font-bold text-lg">{branch.name}</h3>
                        </div>
                    </div>

                    <div class="p-5 flex-1 space-y-4">
                        <div class="flex items-start gap-3 text-gray-600">
                            <MapPinIcon size="18" class="text-[#C4161C] mt-1 flex-shrink-0"/>
                            <p class="text-sm leading-relaxed">{branch.address || 'Alamat belum tersedia'}</p>
                        </div>
                        
                        {#if branch.operating_hours}
                        <div class="flex items-center gap-3 text-gray-600">
                            <ClockIcon size="18" class="text-[#FFD700] flex-shrink-0"/>
                            <p class="text-sm font-medium">{branch.operating_hours}</p>
                        </div>
                        {/if}
                    </div>

                    <div class="p-5 pt-0 mt-auto grid grid-cols-2 gap-3">
                        {#if branch.map_url}
                        <a href={branch.map_url} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition">
                            <NavigationIcon size="16"/> Maps
                        </a>
                        {:else}
                        <button disabled class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-gray-300 font-bold text-xs cursor-not-allowed">
                            <NavigationIcon size="16"/> Maps
                        </button>
                        {/if}

                        {#if branch.phone}
                        <a href={getWALink(branch.phone, branch.name)} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition shadow-lg shadow-green-100">
                            <PhoneIcon size="16"/> WhatsApp
                        </a>
                        {:else}
                        <button disabled class="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed">
                            <PhoneIcon size="16"/> WhatsApp
                        </button>
                        {/if}
                    </div>

                </div>
                {/each}
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center py-20">
                <div class="bg-red-50 text-[#C4161C] p-4 rounded-full mb-4">
                    <AlertCircleIcon size="40"/>
                </div>
                <h3 class="text-lg font-bold text-gray-700">Tidak ada cabang ditemukan</h3>
                <p class="text-gray-500 text-sm mt-1">Coba kata kunci lain atau periksa koneksi internet.</p>
            </div>
        {/if}
    </div>
</div>