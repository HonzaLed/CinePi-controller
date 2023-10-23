<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {string} */ export let hostname = '';
	/** @type {string} */ export let srcOverride = '';

	/** @type {import('svelte/store').Writable<HTMLImageElement>} */
	export let streamElement;

	/** @type {number} */ let maxRetries = 5;
	/** @type {number} */ let currentRetries = 0;
	/** @type {number} */ let currentPingRetries = 0;
	
	/** @type {NodeJS.Timeout} */
	let checkInterval;
	/** @type {number} */ let checkTimeout = 5000; // 5 seconds for the activity check

	/** @type {HTMLImageElement} */
	let imgElem;

	onMount(() => {
		// Start the activity check
		checkInterval = setInterval(checkStreamActivity, checkTimeout);
		// @ts-ignore
		streamElement.set(imgElem);
	});

	/**
	 * @param {string} hostname
	 */
	function setMjpegSrc(hostname) {
		if (imgElem.src === `http://${hostname}/cam.mjpeg` && hostname != '') {
			// Only set the src if it hasn't been set yet
			imgElem.src === `http://${hostname}/cam.mjpeg`;
		}
	}

	function handleStreamError() {
		if (currentRetries < maxRetries) {
			currentRetries++;
			checkStreamActivity(); // Check the ping endpoint before trying to reconnect
		} else {
			clearInterval(checkInterval); // Stop the checks if max retries reached
			dispatch('error', {
				error: 'Failed to load the MJPEG stream after multiple attempts.',
				fatal: true
			});
		}
	}

	function checkStreamActivity() {
		if (srcOverride != '') {
			imgElem.src = srcOverride;
			return;
		}

		if (hostname==="") { return }

		fetch('http://' + hostname + ':8080/ping', {
			method: 'GET',
			mode: 'no-cors' // Add this line for no-cors mode
		})
			.then((response) => {
				if (response.status === 0) {
					// Given that no-cors mode is opaque, we can't explicitly check for 404. Instead, just check if the request was successful.
					setMjpegSrc(hostname); // Set the MJPEG stream if the /ping was successful
					currentRetries = 0;
					currentPingRetries = 0;
				}
			})
			.catch((error) => {
				console.error('Failed to reach /ping endpoint:', error);
				currentPingRetries++;
				dispatch('error', {
					error: `Failed to ping the server ${currentPingRetries} times.`,
					fatal: currentPingRetries < maxRetries ? false : true
				});
			});
	}
</script>

<img
	bind:this={imgElem}
	class="mjpeg-stream object-cover z-0 max-h-screen"
	on:error={handleStreamError}
	alt="Stream preview"
	src="/ui/loading-spinner.gif"
	on:load={(event) => {
		// @ts-ignore
		if (!event.target.src.endsWith('/ui/loading-spinner.gif')) {
			imgElem.classList.add('border');
			imgElem.classList.add('border-1');
			imgElem.classList.add('border-white');
		}
	}}
/>
