<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { MapPinIcon, PhoneIcon, ClockIcon, NavigationIcon } from 'svelte-feather-icons';

    // --- STATE ---
    let branch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
        whatsapp: "628112936949",
        // Default map URL yang pasti benar (Embed API)
        map_url: "https://maps.google.com/maps?q=Narwastu+Store+Yogyakarta&t=&z=15&ie=UTF8&iwloc=&output=embed" 
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
                if (pusat) {
                    branch = {
                        ...pusat,
                        // Pastikan URL map valid untuk iframe. Jika kosong, pakai default.
                        map_url: pusat.map_url || "https://maps.google.com/maps?q=Narwastu+Store+Yogyakarta&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    };
                }
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
        <div class="bg-white rounded-2xl overflow-hidden flex flex-col-reverse md:flex-row border border-gray-100 shadow-sm">
            
            <div class="w-full md:w-1/3 p-8 flex flex-col justify-center bg-white relative z-10">
                <div class="mb-8">
                    <span class="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                        Lokasi Utama
                    </span>
                    
                    <h2 class="text-lg font-bold text-gray-900 mb-4 leading-tight">
                        {branch.name.replace('Narwastu ', '')}
                    </h2>
                    
                    <div class="flex items-start gap-4 mb-5">
                        <div class="p-2 bg-gray-50 rounded-full text-gray-900 shrink-0">
                            <MapPinIcon size="16" />
                        </div>
                        <p class="text-sm text-gray-600 leading-relaxed mt-1">
                            {branch.address}
                        </p>
                    </div>

                    <div class="flex items-start gap-4 mb-6">
                        <div class="p-2 bg-gray-50 rounded-full text-gray-900 shrink-0">
                            <ClockIcon size="16" />
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                            <p class="font-bold text-gray-800">Senin - Sabtu</p>
                            <p>08:00 - 17:00 WIB</p>
                            <p class="text-xs text-red-500 mt-1 italic">Minggu Libur</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3 mt-auto">
                    <a href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(branch.address)}" target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-[#C4161C] hover:bg-red-700 text-white font-bold rounded-xl transition text-sm shadow-sm">
                        <NavigationIcon size="18" />
                        Petunjuk Arah
                    </a>
                    
                    {#if branch.whatsapp}
                    <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition text-sm shadow-sm">
                        <PhoneIcon size="18" />
                        Chat WhatsApp
                    </a>
                    {/if}
                </div>
            </div>

            <div class="w-full md:w-2/3 h-[300px] md:h-auto bg-gray-100 relative min-h-[300px] md:min-h-[500px]">
                {#if isLoading}
                    <div class="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse bg-gray-50">
                        <MapPinIcon class="animate-bounce mb-2 mr-2" /> Memuat Peta...
                    </div>
                {:else}
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        style="border:0;" 
                        allowfullscreen="" 
                        aria-hidden="false" 
                        tabindex="0"
                        src={branch.map_url}
                        title="Lokasi Narwastu"
                        class="absolute inset-0 w-full h-full grayscale-[20%] hover:grayscale-0 transition duration-500"
                    ></iframe>
                {/if}
            </div>

        </div>
    </div>

</div>