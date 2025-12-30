<script>
    import { MapPinIcon, PhoneIcon, ClockIcon, SearchIcon, NavigationIcon, AlertCircleIcon } from 'svelte-feather-icons';

    // 1. Ambil data dari load function (+page.js)
    let { data } = $props(); 
    let branches = $derived(data.branches || []); 

    // 2. State untuk pencarian
    let searchQuery = $state("");

    // 3. Filter sederhana
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // 4. Helper Link WA
    function getWALink(phone) {
        const clean = phone ? phone.replace(/\D/g, '') : '';
        return `https://wa.me/${clean}`;
    }

    // 5. PENYELAMAT ERROR GAMBAR (Wajib Fungsi di Svelte 5)
    function handleImageError(e) {
        e.currentTarget.src = 'https://placehold.co/600x400/eee/999?text=No+Image';
    }
</script>

<div class="min-h-screen bg-gray-50 pb-24 pt-6">
    <div class="container mx-auto px-4">
        
        <div class="max-w-md mx-auto mb-8 space-y-4">
            <h1 class="text-3xl font-bold text-center text-gray-800">Lokasi Kami</h1>
            <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="20"/></span>
                <input type="text" bind:value={searchQuery} placeholder="Cari cabang..." class="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 shadow-sm outline-none focus:border-red-500"/>
            </div>
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredBranches as branch}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                    
                    <div class="h-48 bg-gray-200 relative">
                        <img 
                            src={branch.image_url || `https://placehold.co/600x400/C4161C/FFFFFF?text=${branch.name}`} 
                            alt={branch.name} 
                            class="w-full h-full object-cover"
                            onerror={handleImageError} 
                        />
                    </div>

                    <div class="p-5 space-y-3">
                        <h3 class="font-bold text-lg text-gray-800">{branch.name}</h3>
                        
                        <div class="flex gap-3 text-gray-600 text-sm">
                            <MapPinIcon size="16" class="mt-1 flex-shrink-0 text-red-600"/>
                            <p>{branch.address || '-'}</p>
                        </div>
                        
                        {#if branch.operating_hours}
                        <div class="flex gap-3 text-gray-600 text-sm">
                            <ClockIcon size="16" class="flex-shrink-0 text-yellow-600"/>
                            <p>{branch.operating_hours}</p>
                        </div>
                        {/if}
                    </div>

                    <div class="p-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                        <a href={branch.map_url || '#'} target="_blank" class="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 {branch.map_url ? '' : 'opacity-50 pointer-events-none'}">
                            <NavigationIcon size="14"/> Maps
                        </a>
                        <a href={getWALink(branch.phone)} target="_blank" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 {branch.phone ? '' : 'opacity-50 pointer-events-none'}">
                            <PhoneIcon size="14"/> WhatsApp
                        </a>
                    </div>

                </div>
                {/each}
            </div>
        {:else}
            <div class="text-center py-10 text-gray-400">
                <AlertCircleIcon size="40" class="mx-auto mb-2 opacity-50"/>
                <p>Tidak ada cabang ditemukan.</p>
            </div>
        {/if}
    </div>
</div>