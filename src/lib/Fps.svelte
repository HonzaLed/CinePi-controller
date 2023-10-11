<script>
    // @ts-nocheck
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    const fpsList = [1, 2, 4, 8, 16, 18, 24, 25, 33, 48, 50]
	export let fps = 24;
    export let locked = false;
    /**
	 * @type {number}
	 */
    let fpsIndex;

    $: {
        dispatch("changeFPS", {
            fps: fps
        });
    }

    /**
	 * @type {number | null}
	 */
    let initialSwipeX = null;
    /**
	 * @type {number | null}
	 */
    let initialSwipeY = null;

    /**
	 * @param {number} newFPS
	 */
    function setNewFPS(newFPS) {
        if (!locked) {
            fps = newFPS
        }
    }

    /**
	 * @param {number} diffY
	 */
    function handleSwipe(diffY) {
        let indexChange = Math.round(diffY / 30);
        let newFPSIndex = fpsIndex+indexChange;
        if (newFPSIndex >= 0 && newFPSIndex < fpsList.length) {
            setNewFPS(fpsList[newFPSIndex]);
        }
    }

    function handleClick() {
        let newFPSIndex = fpsList.indexOf(fps) +1;
        if (newFPSIndex >= fpsList.length) {
            newFPSIndex = 0;
        }
        setNewFPS(fpsList[newFPSIndex]);
    }
    
    /**
	 * @param {{ touches: { clientY: number, clientX: number; }[]; }} event
	 */
    function handleTouchStart(event) {
        initialSwipeX = event.touches[0].clientX;
        initialSwipeY = event.touches[0].clientY;
        fpsIndex = fpsList.indexOf(fps);
    };
    
    /**
	 * @param {{ touches: { clientY: number, clientX: number; }[]; }} event
	 */
    function handleTouchMove(event) {
        if (initialSwipeX === null) {
            return;
        }
        
        if (initialSwipeY === null) {
            return;
        }
        
        let currentX = event.touches[0].clientX;
        let currentY = event.touches[0].clientY;
        
        let diffX = initialSwipeX - currentX;
        let diffY = initialSwipeY - currentY;
        
        if (Math.abs(diffX) < Math.abs(diffY)) {
            // sliding vertically
            handleSwipe(diffY);
        }
    };
</script>
<button class="border border-1 border-gray-800" on:touchstart={handleTouchStart} on:touchmove|preventDefault={handleTouchMove} on:click={handleClick}>
	<p class="text-gray-500"><b>FPS</b></p>
	<p class="text-2xl">{fps}</p>
</button>
