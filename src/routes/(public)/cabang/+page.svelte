<script>
    import { MapPinIcon, PhoneIcon, ClockIcon, SearchIcon, NavigationIcon, AlertCircleIcon, GlobeIcon } from 'svelte-feather-icons';

    // 1. DATA DARI SERVER
    let { data } = $props(); 
    let branches = $derived(data.branches || []); 

    // 2. STATE PENCARIAN
    let searchQuery = $state("");

    // 3. FILTER LOGIC
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // 4. HELPER WA
    function getWALink(phone) {
        const clean = phone ? phone.replace(/\D/g, '') : '';
        return `https://wa.me/${clean}`;
    }
</script>

<div class="min-h-screen bg-gray-50 pb-24 pt-6">
    <div class="container mx-auto px-4">
        
        <div class="text-center mb-10 space-y-2">
            <h1 class="text-3xl font-bold text-gray-800" style="font-family: 'Cinzel', serif;">
                Lokasi <span class="text-[#C4161C]">Kami</span>
            </h1>
            <p class="text-gray-500 text-sm">Temukan cabang Narwastu terdekat di kota Anda.</p>
        </div>

        <div class="max-w-md mx-auto mb-10 relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="20"/></span>
            <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Cari nama kota atau alamat..." 
                class="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-[#C4161C] focus:ring-2 focus:ring-[#C4161C]/20 outline-none transition shadow-sm bg-white"
            />
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredBranches as branch}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition duration-300">
                    
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#C4161C]">
                            <MapPinIcon size="20"/>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 leading-tight">{branch.name}</h3>
                    </div>

                    <div class="flex-1 mb-6">
                        <p class="text-gray-600 text-sm leading-relaxed">{branch.address || 'Alamat lengkap belum tersedia.'}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mt-auto">
                        {#if branch.map_url}
                        <a href={branch.map_url} target="_blank" class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition">
                            <NavigationIcon size="16"/> Maps
                        </a>
                        {:else}
                        <button disabled class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-gray-300 font-bold text-xs cursor-not-allowed">
                            <NavigationIcon size="16"/> Maps
                        </button>
                        {/if}

                        {#if branch.whatsapp}
                        <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition shadow-lg shadow-green-100">
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
            <div class="text-center py-20">
                <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircleIcon size="32" class="text-gray-400"/>
                </div>
                <h3 class="text-lg font-bold text-gray-700">Tidak ditemukan</h3>
                <p class="text-gray-500 text-sm">Coba kata kunci lain.</p>
            </div>
        {/if}

    </div>
</div>