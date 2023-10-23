<script>
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    const shutterAngleList = [45, 90, 135, 172.8, 180, 225, 270, 315, 346.6, 360]
	export let shutterAngle = 180;
    export let locked = false;
    /**
	 * @type {number}
	 */
    let shutterAngleIndex;

    $: {
        dispatch("changeShutterAngle", {
            shutterAngle: shutterAngle
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
	 * @param {number} newShutterAngle
	 */
    function setNewShutterAngle(newShutterAngle) {
        if (!locked) {
            shutterAngle = newShutterAngle
        }
    }

    /**
	 * @param {number} diffY
	 */
    function handleSwipe(diffY) {
        let indexChange = Math.round(diffY / 30);
        let newShutterAngleIndex = shutterAngleIndex+indexChange;
        if (newShutterAngleIndex >= 0 && newShutterAngleIndex < shutterAngleList.length) {
            setNewShutterAngle(shutterAngleList[newShutterAngleIndex]);
        }
    }

    function handleClick() {
        let newShutterAngleIndex = shutterAngleList.indexOf(shutterAngle) +1;
        if (newShutterAngleIndex >= shutterAngleList.length) {
            newShutterAngleIndex = 0;
        }
        setNewShutterAngle(shutterAngleList[newShutterAngleIndex]);
    }
    
    /**
	 * @param {{ touches: { clientY: number, clientX: number; }[]; }} event
	 */
    function handleTouchStart(event) {
        initialSwipeX = event.touches[0].clientX;
        initialSwipeY = event.touches[0].clientY;
        shutterAngleIndex = shutterAngleList.indexOf(shutterAngle);
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
	<p class="text-gray-500 text-sm"><b>Shutter angle</b></p>
	<p class="text-2xl">{shutterAngle}°</p>
</button>
