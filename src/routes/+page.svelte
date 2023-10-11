<script>
	import Stream from '$lib/Stream.svelte';
	import Iso from '$lib/Iso.svelte';
	import { onMount } from 'svelte';

	let hostname = '';
	let srcOverride = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/16x9_by_Pengo.svg/1920px-16x9_by_Pengo.svg.png";
	let running = true;

	let state = {
		recording: false,
		locked: false,
		iso: 100,
		maxIso: 6400,
		minIso: 100
	}

	$: {
		console.log("Got a new state update:", state);
		// do the API stuff here
	}

	onMount(() => {
		hostname = document.location.hostname;
	});

	// @ts-ignore
	function handleStreamError(event) {
		if (!event.detail.fatal) {
			console.warn(`Got error from stream: ${event.detail.error}`);
		} else {
			console.error(`Got fatal error from stream: ${event.detail.error}`);
			running = false;
			srcOverride = "/ui/failed-stream.jpg";

		}
	}
	// @ts-ignore
	function handleChangeISO(event) {
		let iso = event.detail.iso;
		if (iso > state.maxIso && iso < state.minIso) {
			console.warn(`Cannot set ISO ${iso}`);
		}
		console.log(`Got new ISO: ${iso}`);
		state.iso = iso;
	}
	function toogleRecord() {
		state.recording = !state.recording;
	}
	function toogleLocked() {
		state.locked = !state.locked;
	}
</script>

<div class="min-h-screen h-screen w-screen flex flex-col items-center justify-center bg-black">
	<div class="grid grid-cols-8 grid-rows-1 gap-0 min-h-screen">

		<!-- Left side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950">
			<!-- Lock button -->
			<button class="border border-1 border-gray-800" on:click={toogleLocked}>
				<img src={state.locked ? "/ui/locked_lock.png" : "/ui/unlocked_lock.png"} alt="Lock button" class="mx-auto" />
			</button>
			<button class="border border-1 border-gray-800">2</button>
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

		<!-- Stream image -->
		<div class="stream-container col-span-6 place-self-center" 	>
			<Stream
				on:error={handleStreamError}
				{hostname}
				{srcOverride}
			/>
		</div>
		<!-- Right side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950">
			<!-- Record button -->
			<button on:click={toogleRecord} class="border border-1 border-gray-800">
				<img src={state.recording ? "/ui/stop_recording.png" : "/ui/record.png"} alt="Record button" class="mx-auto"/>
			</button>
			<!-- ISO -->
			<Iso iso={state.iso} maxIso={state.maxIso} minIso={state.minIso} locked={state.locked} on:changeISO={handleChangeISO} />
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

	</div>
</div>
