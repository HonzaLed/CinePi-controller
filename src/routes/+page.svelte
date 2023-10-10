<script>
	import Stream from '$lib/Stream.svelte';
	import { onMount } from 'svelte';

	let hostname = '';
	let running = true;

	onMount(() => {
		hostname = document.location.hostname;
	});

	// @ts-ignore
	function handleError(event) {
		if (!event.detail.fatal) {
			console.warn(`Got error from stream: ${event.detail.error}`);
		} else {
			console.error(`Got fatal error from stream: ${event.detail.error}`);
			running = false;
		}
	}
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-black">
	<div class="grid grid-cols-5 grid-rows-1 gap-4 min-h-screen">

		<!-- Left side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950">
			<button class="border border-1 border-gray-800">1</button>
			<button class="border border-1 border-gray-800">2</button>
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

		<!-- Stream image -->
		<div class="stream-container col-span-3 place-self-center">
			<Stream
				on:error={handleError}
				{hostname}
				srcOverride="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/16x9_by_Pengo.svg/1920px-16x9_by_Pengo.svg.png"
			/>
		</div>
		<!-- Right side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950">
			<button class="border border-1 border-gray-800">1</button>
			<button class="border border-1 border-gray-800">2</button>
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

	</div>
</div>
