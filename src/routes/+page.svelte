<script>
	import Stream from '$lib/Stream.svelte';
	import Iso from '$lib/Iso.svelte';
	import ShutterAngle from '$lib/ShutterAngle.svelte';
	import Fps from '$lib/Fps.svelte';
	import Histogram from '$lib/Histogram.svelte';

	import socket from '$lib/websocket.js';

	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let hostname = '';
	let srcOverride = ''; // src override for the stream, mainly for testing
	let running = true; // If false, the app encountered a fatal error and can't continue
	let errorMessage = ''; // If the app "crashes", show this error message
	let locked = false; // Lock for the controls, so you don't mess up the settings while recording
	let websocketErrorCount = 0;

	const streamElement = writable();

	let state = {
		recording: false,
		iso: 100,
		maxIso: 6400,
		minIso: 100,
		shutterAngle: 180,
		fps: 24
	};

	onMount(() => {
		// Runs when the web app initializes
		hostname = document.location.hostname;
		srcOverride = 'http://' + hostname + ':8008/cam.mjpeg';

		socket.errorNotifier.subscribe((error) => {
			// Subscribe to errors from websocket
			if (error != '') {
				running = false;
				console.error('Got fatal error from websocket:', error);
				errorMessage = 'WebSocket error: ' + error;
			}
		});
		socket.subscribe((message) => {
			// Subsrice to new messages from websocket
			console.log('Got new WebSocket message:', message);
			try {
				state = JSON.parse(message); // Update state
			} catch {
				console.warn('Could not update state from received websocket message!');
			}
		});

		socket.connect(`ws:${hostname}:8080/ws`); // Connect to the websocket
	});

	// State update (send data to API)
	$: if (!socket.sendMessage(JSON.stringify(state))) {
		// Check if the update got sent
		// If we can't send an update to the server 5 times, stop the app and display the error message
		if (websocketErrorCount > 5) {
			running = false;
			console.error("Got fatal error from websocket: Couldn't send update to the server 5 times!");
			errorMessage = "WebSocket error: Couldn't send update to the server 5 times!";
		}
		// If we can't send an update, increment the error counter and log to the console
		console.warn('Could not send a state update!');
		websocketErrorCount++;
	} else {
		// All OK
		console.log('Sent update to the server!');
		websocketErrorCount = 0; // If there were any previous errors, forget them
	}

	// Handle errors from stream, if fatal, show the error message and stop the app
	// @ts-ignore
	function handleStreamError(event) {
		if (!event.detail.fatal) {
			console.warn(`Got error from stream: ${event.detail.error}`);
		} else {
			console.error(`Got fatal error from stream: ${event.detail.error}`);
			errorMessage = `Got fatal error from stream: ${event.detail.error}`;
			running = false;
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

	// Handlers for record and lock button
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
		<div class="grid grid-cols-1 gap-0 text-white bg-gray-950 z-10">
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
				{locked}
				on:changeShutterAngle={handleChangeShutterAngle}
			/>
			<!-- FPS -->
			<Fps fps={state.fps} {locked} on:changeFPS={handleChangeFPS} />
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>

		<!-- Stream image -->
		<div class="stream-container col-span-6 place-self-center">
			<Stream on:error={handleStreamError} {hostname} {srcOverride} {streamElement} />
		</div>
		<!-- Right side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950 z-10">
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
				{locked}
				on:changeISO={handleChangeISO}
			/>
			<!-- Histogram -->
			<Histogram imageStore={streamElement} />
			<button class="border border-1 border-gray-800">4</button>
			<button class="border border-1 border-gray-800">5</button>
			<button class="border border-1 border-gray-800">6</button>
			<button class="border border-1 border-gray-800">7</button>
			<button class="border border-1 border-gray-800">8</button>
		</div>
	</div>
</div>

<div
	class="text-white bg-black text-center min-h-screen items-center grid grid-rows-2"
	style={running ? 'display:none' : ''}
>
	<h1 class="self-center text-2xl">
		<b class="text-6xl">Client encountered a fatal error, can't continue!</b><br />Error: {errorMessage}
	</h1>
	<button
		class="bg-gray-800 w-min mx-auto rounded-2xl p-2 border-gray-700 border-2 text-6xl"
		on:click={() => {
			location.reload();
		}}>Refresh</button
	>
</div>
