<script>
	import { Capacitor, CapacitorCookies } from '@capacitor/core';

	import Stream from '$lib/Stream.svelte';
	import Iso from '$lib/Iso.svelte';
	import ShutterAngle from '$lib/ShutterAngle.svelte';
	import Fps from '$lib/Fps.svelte';
	import Histogram from '$lib/Histogram.svelte';

	import socket from '$lib/websocket.js';

	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	/** @type {string} */ let hostname = '';
	/** @type {string} */ let srcOverride = ''; // src override for the stream, mainly for testing
	/** @type {boolean} */ let running = true; // If false, the app encountered a fatal error and can't continue
	/** @type {string} */ let errorMessage = ''; // If the app "crashes", show this error message
	/** @type {boolean} */ let locked = false; // Lock for the controls, so you don't mess up the settings while recording
	/** @type {number} */ let websocketErrorCount = 0;
	/** @type {boolean} */ let isNative = false;

	/** @type {HTMLDivElement} */
	let hostnameModal;
	/** @type {HTMLInputElement} */
	let hostnameModalInput;

	/** @type {import('svelte/store').Writable<HTMLImageElement>} */
	const streamElement = writable();

	let state = {
		recording: false,
		iso: 100,
		maxIso: 6400,
		minIso: 100,
		shutterAngle: 180,
		fps: 24
	};

	onMount(async () => {
		// Runs when the web app initializes
		if (Capacitor.isNativePlatform()) {
			console.log('Running on native!');
			isNative = true;
			let cookies = await CapacitorCookies.getCookies();
			if (cookies.hostname !== undefined) {
				console.log('Got saved hostname!');
				console.log(cookies.hostname);
				initApp(cookies.hostname);
			} else {
				hostnameModal.classList.remove('hidden');
			}
		} else {
			console.log('Running on web!');
			initApp(document.location.hostname);
		}
	});

	/**
	 * @param {string} hostnameArg
	 */
	function initApp(hostnameArg) {
		hostname = hostnameArg;
		// srcOverride = 'http://' + hostname + ':8008/cam.mjpeg';
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

		socket.connect(`ws:${hostname}:8080/ws`); // Connect to the websocket server
	}

	async function initNative() {
		if (hostnameModalInput.value === '') {
			return;
		}
		await CapacitorCookies.setCookie({
			key: 'hostname',
			value: hostnameModalInput.value
		});
		hostnameModal.classList.add('hidden');
		initApp(hostnameModalInput.value);
	}

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
		console.log(`ISO changed: ${iso}`);
		state.iso = iso;
	}
	// @ts-ignore
	function handleChangeShutterAngle(event) {
		let shutterAngle = event.detail.shutterAngle;
		console.log(`Shutter angle changed: ${shutterAngle}`);
		state.shutterAngle = shutterAngle;
	}
	// @ts-ignore
	function handleChangeFPS(event) {
		let fps = event.detail.fps;
		console.log(`FPS changed: ${fps}`);
		state.fps = fps;
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
			<button
				class="border border-1 border-gray-800 h-full -mb-16"
				on:click={() => {
					locked = !locked;
				}}
			>
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
			<button class="border border-1 border-gray-800 h-full">4</button>
			<button class="border border-1 border-gray-800 h-full">5</button>
			<button class="border border-1 border-gray-800 h-full">6</button>
			<button class="border border-1 border-gray-800 h-full">7</button>
			<!-- Reconnect button -->
			<button
				on:click={async () => {
					await CapacitorCookies.deleteCookie({ key: 'hostname' });
					location.reload();
				}}
				class="border border-1 border-gray-800 text-xl"
			>
				<!-- <img src="/ui/reconnect.png" alt="Reconnect button" class="mx-auto h-2/4" /> -->
				Reconnect
			</button>
		</div>

		<!-- Stream image -->
		<div class="stream-container col-span-6 place-self-center">
			<Stream on:error={handleStreamError} {hostname} {srcOverride} {streamElement} />
		</div>
		<!-- Right side controls -->
		<div class="grid grid-cols-1 grid-rows-8 gap-0 text-white bg-gray-950 z-10">
			<!-- Record button -->
			<button
				on:click={() => {
					state.recording = !state.recording;
				}}
				class="border border-1 border-gray-800 h-full -mb-16"
			>
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
		<b class="text-6xl">Client encountered a fatal error!</b><br />Error: {errorMessage}
		<span style="visibility: {isNative ? "visible" : "hidden"}"><br /> Maybe you entered a wrong IP address?</span>
	</h1>
	
	<div class="flex">
		<button
			class="bg-gray-800 w-min mx-auto rounded-2xl p-2 border-gray-700 border-2 text-6xl"
			on:click={() => {
				location.reload();
			}}>Refresh</button
		>
		<button style="{isNative ? "" : "display:none"}" class="bg-gray-800 w-min mx-auto rounded-2xl p-2 border-gray-700 border-2 text-6xl"
			on:click={async () => {
				await CapacitorCookies.deleteCookie({ key: 'hostname' });
				location.reload();
			}}>Enter IP address</button
		>
	</div>
</div>

<!-- hostname enter popup -->
<div
	bind:this={hostnameModal}
	tabindex="-1"
	aria-hidden="true"
	class="hidden fixed top-16 left-1/4 z-50 p-4 overflow-x-hidden overflow-y-auto h-[calc(100%-1rem)] max-h-full w-2/4"
>
	<div class="relative w-full  max-h-full">
		<!-- modal content -->
		<div class="relative rounded-lg shadow bg-gray-950">
			<button
				on:click={() => {
					hostnameModal.classList.add('hidden');
				}}
				type="button"
				class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-800 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
				data-modal-hide="authentication-modal"
			>
				<svg
					class="w-3 h-3"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 14 14"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
					/>
				</svg>
				<span class="sr-only">Close modal</span>
			</button>
			<div class="px-6 py-6 lg:px-8 border border-gray-800 rounded-lg">
				<h3 class="mb-4 text-xl font-medium text-white">Enter the IP address of the CinePi</h3>
				<form class="space-y-6" action="#">
					<div>
						<label for="address" class="block mb-2 text-sm font-medium text-white">IP address</label
						>
						<input
							bind:this={hostnameModalInput}
							type="text"
							minlength="7"
							maxlength="15"
							size="15"
							class="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-800 border-gray-500 placeholder-gray-400 text-white"
							placeholder="192.168.1.1"
							required
						/>
					</div>
					<button
						on:click={initNative}
						type="submit"
						class="w-full text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800"
					>
					Submit</button>
				</form>
			</div>
		</div>
	</div>
</div>
