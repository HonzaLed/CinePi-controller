<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    const DefaultIsoList = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600]
	export let iso = 100;
    export let maxIso = 6400;
    export let minIso = 100;
    export let locked = false;
    let isoList = DefaultIsoList;
    /**
	 * @type {number}
	 */
    let isoIndex;

    $: {
        dispatch("changeISO", {
            iso: iso
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

    // Set isoList to start at minIso and end at maxIso
    onMount( () => {
        isoList = DefaultIsoList.slice(DefaultIsoList.indexOf(minIso), DefaultIsoList.indexOf(maxIso)+1)
        console.log(isoList)
    })

    function setNewIso(newIso) {
        if (!locked && (newIso <= maxIso && newIso >= minIso)) {
            iso = newIso
        }
    }

    /**
	 * @param {number} diffY
	 */
    function handleSwipe(diffY) {
        let indexChange = Math.round(diffY / 30);
        let newIsoIndex = isoIndex+indexChange;
        if (newIsoIndex >= 0 && newIsoIndex < isoList.length) {
            setNewIso(isoList[newIsoIndex]);
        }
    }

    function handleClick() {
        let newIsoIndex = isoList.indexOf(iso) +1;
        if (newIsoIndex >= isoList.length) {
            newIsoIndex = 0;
        }
        setNewIso(isoList[newIsoIndex]);
    }
    
    /**
	 * @param {{ touches: { clientY: number, clientX: number; }[]; }} event
	 */
    function handleTouchStart(event) {
        initialSwipeX = event.touches[0].clientX;
        initialSwipeY = event.touches[0].clientY;
        isoIndex = isoList.indexOf(iso);
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
	<p class="text-gray-500"><b>ISO</b></p>
	<p class="text-2xl">{iso}</p>
</button>
