<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    export let hostname = "";
    export let srcOverride = "";

    let maxRetries = 5;
    let currentRetries = 0;
    let currentPingRetries = 0;
    /**
	 * @type {number | undefined}
	 */
    let checkInterval;
    let checkTimeout = 5000; // 5 seconds for the activity check

    let imgElem;

    onMount(() => {
        // Start the activity check
        checkInterval = setInterval(checkStreamActivity, checkTimeout);
    });

    /**
	 * @param {string} hostname
	 */

    /**
	 * @param {string} hostname
	 */
    function setMjpegSrc(hostname) {
        if (imgElem.src === `http://${hostname}/image.png` && hostname != "") { // Only set the src if it hasn't been set yet
            imgElem.src === `http://${hostname}/image.png`
        }
    }


    function handleStreamError() {
        if (currentRetries < maxRetries) {
            currentRetries++;
            checkStreamActivity(); // Check the ping endpoint before trying to reconnect
        } else {
            clearInterval(checkInterval); // Stop the checks if max retries reached
            dispatch("error", {
			    error: "Failed to load the MJPEG stream after multiple attempts.",
                fatal: true
		    });
        }
    }

    function checkStreamActivity() {

        if (srcOverride != "") {
            imgElem.src = srcOverride;
            return;
        }

        fetch("http://" + hostname + ":8080/ping", {
            method: 'GET',
            mode: 'no-cors'  // Add this line for no-cors mode
        })
        .then(response => {
            if (response.status === 0) { // Given that no-cors mode is opaque, we can't explicitly check for 404. Instead, just check if the request was successful.
                setMjpegSrc(hostname); // Set the MJPEG stream if the /ping was successful
                currentRetries = 0;
                currentPingRetries = 0;
            } 
        })
        .catch(error => {
            console.error("Failed to reach /ping endpoint:", error);
            currentPingRetries++;
            dispatch("error", {
                error: `Failed to ping the server ${currentPingRetries} times.`,
                fatal: currentPingRetries < maxRetries ? false : true
            });
        });
    }
</script>


<img bind:this={imgElem} class="mjpeg-stream" on:error={handleStreamError} src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/16x9_by_Pengo.svg/1920px-16x9_by_Pengo.svg.png" alt="Stream preview">
