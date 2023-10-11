<script>
	import Stream from '$lib/Stream.svelte';
	import Iso from '$lib/Iso.svelte';
	import ShutterAngle from '$lib/ShutterAngle.svelte';
	import Fps from '$lib/Fps.svelte'
	import { onMount } from 'svelte';

	let hostname = '';
	let srcOverride = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/16x9_by_Pengo.svg/1920px-16x9_by_Pengo.svg.png";
	let running = true;

	let state = {
		recording: false,
		locked: false,
		iso: 100,
		maxIso: 6400,
		minIso: 100,
		shutterAngle: 180,
		fps: 24
	}

	onMount(() => {
		hostname = document.location.hostname;
	});

	// State update (send data to API)
	$: {
		console.log("Got a new state update:", state);
		// do the API stuff here
	}

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

	// Handlers for ISO/shutter angle/FPS changes
	// @ts-ignore
	function handleChangeISO(event) {
		let iso = event.detail.iso;
		console.log(`Got new ISO: ${iso}`);
		state.iso = iso;
	}
	// @ts-ignore
	function handleChangeShutterAngle(event) {
		let shutterAngle = event.detail.shutterAngle;
		console.log(`Got new shutter angle: ${shutterAngle}`);
		state.shutterAngle = shutterAngle;
	}
	// @ts-ignore
	function handleChangeFPS(event) {
		let fps = event.detail.fps;
		console.log(`Got new FPS: ${fps}`);
		state.fps = fps;
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
		<div class="grid grid-cols-1 gap-0 text-white bg-gray-950">
			<!-- Lock button -->
			<button class="border border-1 border-gray-800 h-3/4" on:click={toogleLocked}>
				<img src={state.locked ? "/ui/locked_lock.png" : "/ui/unlocked_lock.png"} alt="Lock button" class="mx-auto h-5/6" />
			</button>
			<ShutterAngle shutterAngle={state.shutterAngle} locked={state.locked} on:changeShutterAngle={handleChangeShutterAngle} />
			<Fps fps={state.fps} locked={state.locked} on:changeFPS={handleChangeFPS} />
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
			<button on:click={toogleRecord} class="border border-1 border-gray-800 h-3/4">
				<img src={state.recording ? "/ui/stop_recording.png" : "/ui/record.png"} alt="Record button" class="mx-auto h-5/6"/>
			</button>
			<!-- ISO -->
			<Iso iso={state.iso} maxIso={state.maxIso} minIso={state.minIso} locked={state.locked} on:changeISO={handleChangeISO} />
			<!-- Shutter Angle -->
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

	</div>
</div>
