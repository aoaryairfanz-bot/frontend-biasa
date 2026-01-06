<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { MapPinIcon, PhoneIcon, ClockIcon, NavigationIcon } from 'svelte-feather-icons';

    // --- STATE ---
    // Default Data Pusat (Sambil nunggu fetch biar gak kosong melompong)
    let branch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
        whatsapp: "628112936949",
        map_url: "https://maps.app.goo.gl/..." // Ganti link ini nanti
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
    <title>Kontak & Lokasi - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 font-sans pb-20">
    
    <div class="bg-white py-8 border-b border-gray-100">
        <div class="container mx-auto px-4 max-w-4xl text-center">
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 uppercase tracking-wide">Kunjungi Toko Kami</h1>
            <p class="text-sm text-gray-500 max-w-lg mx-auto">Kami menantikan kehadiran Anda. Temukan berbagai perlengkapan rohani berkualitas langsung di galeri kami.</p>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-5xl -mt-8">
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            
            <div class="w-full md:w-1/3 p-8 flex flex-col justify-center bg-white relative z-10">
                <div class="mb-8">
                    <span class="inline-block px-3 py-1 bg-red-50 text-[#C4161C] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">Pusat</span>
                    <h2 class="text-xl font-bold text-gray-900 mb-4 leading-tight">{branch.name.replace('Narwastu ', '')}</h2>
                    
                    <div class="flex items-start gap-3 mb-4 text-sm text-gray-600">
                        <MapPinIcon size="18" class="text-gray-400 mt-0.5 shrink-0" />
                        <p class="leading-relaxed">{branch.address}</p>
                    </div>

                    <div class="flex items-start gap-3 mb-6 text-sm text-gray-600">
                        <ClockIcon size="18" class="text-gray-400 mt-0.5 shrink-0" />
                        <div>
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
                    <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition text-sm shadow-md shadow-green-100">
                        <PhoneIcon size="18" />
                        Chat WhatsApp
                    </a>
                    {/if}
                </div>
            </div>

            <div class="w-full md:w-2/3 h-[400px] md:h-auto bg-gray-200 relative min-h-[400px]">
                {#if isLoading}
                    <div class="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse">
                        Memuat Peta...
                    </div>
                {:else}
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.286399684687!2d110.3897850750047!3d-7.780447992239121!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59c905555555%3A0x6c6e7a256247071e!2sNarwastu%20Store!5e0!3m2!1sid!2sid!4v1709623899298!5m2!1sid!2sid" 
                        width="100%" 
                        height="100%" 
                        style="border:0;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade"
                        title="Lokasi Toko"
                        class="absolute inset-0 w-full h-full grayscale-[50%] hover:grayscale-0 transition duration-500"
                    ></iframe>
                {/if}
            </div>

        </div>
    </div>

</div>