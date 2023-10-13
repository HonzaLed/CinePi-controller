<script>
	import { onMount } from 'svelte';

	/**
	 * @type {import('svelte/store').Writable<HTMLImageElement>}
	 */
	export let imageStore;
	/**
	 * @type {HTMLCanvasElement}
	 */
	let canvas;
	/**
	 * @type {HTMLButtonElement}
	 */
	let parent;
	/**
	 * @type {HTMLImageElement}
	 */
	let image;
	/**
	 * @type {CanvasRenderingContext2D}
	 */
	let ctx;

	onMount(() => {
		// @ts-ignore
		ctx = canvas.getContext('2d', { willReadFrequently: true }); // Get canvas

		// Set canvas width and height to its display size
		let rect = canvas.getBoundingClientRect();
		canvas.height = rect.height;
		canvas.width = rect.width;

		// Subscribe to image element so that we can save it and get the image data out of it
		imageStore.subscribe((imageElement) => {
			if (imageElement != null) {
				image = imageElement;
				image.crossOrigin = 'Anonymous';
				updateHistogram(); // when we have it, start the histogram loop
			}
		});
	});

	function updateHistogram() {
		ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
		ctx.drawImage(image, 0, 0, image.width, image.height); // Capture a frame from the stream

		let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const histogramR = new Array(256).fill(0);
		const histogramG = new Array(256).fill(0);
		const histogramB = new Array(256).fill(0);

		for (let i = 0; i < imageData.data.length; i += 4) {
			// The data array is in rgba format (4 bytes per pixel)
			const pixelValueR = imageData.data[i]; // Red channel value
			const pixelValueG = imageData.data[i + 1]; // Green channel value
			const pixelValueB = imageData.data[i + 2]; // Blue channel value

			// Increment the corresponding value in the histogram
			histogramR[pixelValueR]++;
			histogramG[pixelValueG]++;
			histogramB[pixelValueB]++;
		}

		// Normalize the histogram
		const maxCount = Math.max(...histogramR, ...histogramG, ...histogramB);
		const scaleFactor = canvas.height / maxCount;

		const normalizedHistogramR = histogramR.map((count) => count * scaleFactor);
		const normalizedHistogramG = histogramG.map((count) => count * scaleFactor);
		const normalizedHistogramB = histogramB.map((count) => count * scaleFactor);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = 'lighter'; // Set the blend mode to "lighter"

		let widthScaleFactor = canvas.width / normalizedHistogramR.length; // Calculate the scale factor for width

		for (let index = 0; index < normalizedHistogramR.length; index++) {
			// Render the histogram
			let valueR = normalizedHistogramR[index];
			let valueG = normalizedHistogramG[index];
			let valueB = normalizedHistogramB[index];
			let coordsX = index * widthScaleFactor; // Calculate new X coordinates
			// Draw all 3 colors
			ctx.fillStyle = 'red';
			ctx.fillRect(coordsX, canvas.height - valueR, 1, valueR); // Draw verical line, the height of the line coresponds to the "valueR"
			ctx.fillStyle = 'green';
			ctx.fillRect(coordsX, canvas.height - valueG, 1, valueG);
			ctx.fillStyle = 'blue';
			ctx.fillRect(coordsX, canvas.height - valueB, 1, valueB);
		}

		requestAnimationFrame(updateHistogram); // Repeat
	}
</script>

<button class="border border-1 border-gray-800" bind:this={parent}>
	<canvas bind:this={canvas} class="h-12" />
</button>
