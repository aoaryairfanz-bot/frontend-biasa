<script>
    import Header from "$lib/Header.svelte";
    import Footer from "$lib/Footer.svelte";
    
    // --- Svelte 5 Props ---
    let { children } = $props(); 
</script>

<svelte:head>
    <title>Narwastu - Toko Kristiani</title>
</svelte:head>

<div class="flex flex-col min-h-screen bg-gray-50 font-sans">
    <Header />
    <main class="flex-grow">
        {@render children()}
    </main>
    <Footer />
</div>