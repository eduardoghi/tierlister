<script>
	import tabler from 'yesvelte/css/daisyui.min.css?url';
	import "../app.css";
</script>
<svelte:head>
	<link rel='stylesheet' href={tabler}/>
</svelte:head>

<slot/>