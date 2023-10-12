<script>
	import Stream from '$lib/Stream.svelte';
	import Iso from '$lib/Iso.svelte';
	import ShutterAngle from '$lib/ShutterAngle.svelte';
	import Fps from '$lib/Fps.svelte';
	import socket from '$lib/websocket.js';
	import { onMount } from 'svelte';

	let hostname = '';
	let srcOverride = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/16x9_by_Pengo.svg/1920px-16x9_by_Pengo.svg.png';
	let running = true;
	let errorMessage = "";
	let locked= false;
	let websocketErrorCount = 0;

	let state = {
		recording: false,
		iso: 100,
		maxIso: 6400,
		minIso: 100,
		shutterAngle: 180,
		fps: 24
	};

	onMount(() => {
		hostname = document.location.hostname;

		socket.errorNotifier.subscribe( (error) => {
			if (error != "") {
				running = false;
				console.error('Got fatal error from websocket:', error);
				errorMessage = "WebSocket error: " + error;
			}
		});
		socket.subscribe( (message) => {
			console.log("Got new WebSocket message:", message);
			try {
				state = JSON.parse(message);
			} catch {
				console.warn("Could not update state from received websocket message!");
			}
		});

		socket.connect(`ws:${hostname}:8080/ws`);
	});

	// State update (send data to API)
	$: if (!socket.sendMessage(JSON.stringify(state))) {
			if (websocketErrorCount > 5) {
				running = false;
				console.log("Got fatal error from websocket: Couldn't send update to the server 5 times!")
				errorMessage = "WebSocket error: Couldn't send update to the server 5 times!";
			}
			console.warn("Could not send a state update!");
			websocketErrorCount++;
	} else {
		console.log("Sent update to the server!");
		websocketErrorCount = 0;
	}

	// @ts-ignore
	function handleStreamError(event) {
		if (!event.detail.fatal) {
			console.warn(`Got error from stream: ${event.detail.error}`);
		} else {
			console.error(`Got fatal error from stream: ${event.detail.error}`);
			errorMessage = `Got fatal error from stream: ${event.detail.error}`;
			running = false;
			srcOverride = '/ui/failed-stream.jpg';
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
		locked = !locked;
	}
</script>

<div
	class="min-h-screen h-screen w-screen flex flex-col items-center justify-center bg-black"
	style={running ? '' : 'display:none'}
>
	<div class="grid grid-cols-8 grid-rows-1 gap-0 min-h-screen">
		<!-- Left side controls -->
		<div class="grid grid-cols-1 gap-0 text-white bg-gray-950">
			<!-- Lock button -->
			<button class="border border-1 border-gray-800 h-3/4" on:click={toogleLocked}>
				<img
					src={locked ? '/ui/locked_lock.png' : '/ui/unlocked_lock.png'}
					alt="Lock button"
					class="mx-auto h-5/6"
				/>
			</button>
			<!-- Shutter Angle -->
			<ShutterAngle
				shutterAngle={state.shutterAngle}
				locked={locked}
				on:changeShutterAngle={handleChangeShutterAngle}
			/>
			<Fps fps={state.fps} locked={locked} on:changeFPS={handleChangeFPS} />
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

		<!-- Stream image -->
		<div class="stream-container col-span-6 place-self-center">
			<Stream on:error={handleStreamError} {hostname} {srcOverride} />
		</div>
		<!-- Right side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950">
			<!-- Record button -->
			<button on:click={toogleRecord} class="border border-1 border-gray-800 h-3/4">
				<img
					src={state.recording ? '/ui/stop_recording.png' : '/ui/record.png'}
					alt="Record button"
					class="mx-auto h-5/6"
				/>
			</button>
			<!-- ISO -->
			<Iso
				iso={state.iso}
				maxIso={state.maxIso}
				minIso={state.minIso}
				locked={locked}
				on:changeISO={handleChangeISO}
			/>
			<button class="border border-1 border-gray-800">3</button>
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>
	</div>
</div>

<div class="text-white bg-black text-center min-h-screen items-center grid grid-rows-2" style="{running ? "display:none" : ""}">
	<h1 class="self-center text-2xl"><b class="text-6xl">Client encountered a fatal error, can't continue!</b><br>Error: {errorMessage}</h1>
	<button class="bg-gray-800 w-min mx-auto rounded-2xl p-2 border-gray-700 border-2 text-6xl" on:click={()=>{location.reload()}}>Refresh</button>
</div>