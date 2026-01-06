<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { MapPinIcon, PhoneIcon, ClockIcon, NavigationIcon } from 'svelte-feather-icons';

    // --- STATE ---
    let branch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
        whatsapp: "628112936949",
        map_url: "" 
    });
    
    let isLoading = $state(true);

    // --- FETCH DATA ---
    onMount(async () => {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                
                // Cari ID 1 (Pusat)
                const pusat = list.find(b => b.id === 1);
                if (pusat) branch = pusat;
            }
        } catch (e) {
            console.error("Gagal load data kontak", e);
        } finally {
            isLoading = false;
        }
    });

    // --- HELPER ---
    function getWALink(phone) {
        if (!phone) return "#";
        const clean = phone.replace(/\D/g, '');
        return `https://wa.me/${clean}`;
    }
</script>

<svelte:head>
    <title>Kontak - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white font-sans pb-20">
    
    <div class="bg-white pt-10 pb-6">
        <div class="container mx-auto px-4 max-w-4xl text-center">
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 uppercase tracking-wider" style="font-family: 'Cinzel', serif;">
                Narwastu - Toko Kristiani
            </h1>
            <p class="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Pusat pernak-pernik rohani dan perlengkapan ibadah berkualitas. Kami hadir untuk melayani umat dengan sepenuh hati demi menguatkan iman melalui karya-karya terbaik.
            </p>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-6xl">
        <div class="bg-white rounded-2xl overflow-hidden flex flex-col-reverse md:flex-row border border-gray-100">
            
            <div class="w-full md:w-1/3 p-8 flex flex-col justify-center bg-white relative z-10">
                <div class="mb-8">
                    <span class="inline-block px-3 py-1 bg-red-50 text-[#C4161C] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                        Lokasi Utama
                    </span>
                    
                    <h2 class="text-lg font-bold text-gray-900 mb-4 leading-tight">
                        {branch.name.replace('Narwastu ', '')}
                    </h2>
                    
                    <div class="flex items-start gap-4 mb-5">
                        <div class="p-2 bg-gray-50 rounded-full text-gray-500 shrink-0">
                            <MapPinIcon size="16" />
                        </div>
                        <p class="text-sm text-gray-600 leading-relaxed mt-1">
                            {branch.address}
                        </p>
                    </div>

                    <div class="flex items-start gap-4 mb-6">
                        <div class="p-2 bg-gray-50 rounded-full text-gray-500 shrink-0">
                            <ClockIcon size="16" />
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                            <p class="font-bold text-gray-800">Senin - Sabtu</p>
                            <p>08:00 - 17:00 WIB</p>
                            <p class="text-xs text-red-400 mt-1 italic">Minggu Libur</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3 mt-auto">
                    {#if branch.map_url}
                    <a href={branch.map_url} target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm">
                        <NavigationIcon size="18" />
                        Petunjuk Arah
                    </a>
                    {/if}
                    
                    {#if branch.whatsapp}
                    <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition text-sm">
                        <PhoneIcon size="18" />
                        Chat WhatsApp
                    </a>
                    {/if}
                </div>
            </div>

            <div class="w-full md:w-2/3 h-[300px] md:h-auto bg-gray-100 relative min-h-[300px] md:min-h-[500px]">
                {#if isLoading}
                    <div class="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse">
                        <MapPinIcon class="animate-bounce mb-2" /> Memuat Peta...
                    </div>
                {:else}
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        scrolling="no" 
                        marginheight="0" 
                        marginwidth="0" 
                        src="https://maps.google.com/maps?q=Narwastu%20Store%20Yogyakarta&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        title="Lokasi Narwastu"
                        class="absolute inset-0 w-full h-full grayscale-[10%] hover:grayscale-0 transition duration-500"
                    ></iframe>
                {/if}
            </div>

        </div>
    </div>

</div>