import { writable } from 'svelte/store';

const messageStore = writable('');
/**
 * @type {WebSocket | null}
 */
let socket = null;
let error = false;

/**
 * @param {string | URL} url
 */
function connect(url) {
    error = false;

    if ("WebSocket" in window) {
        socket = new WebSocket(url);
        // Connection opened
        socket.onopen = (event) => {
            console.log("WebSocket connected!");
        }

        // Listen for messages
        socket.onmessage = (event) => {
            messageStore.set(event.data);
        }

        socket.onerror = (event) => {
            console.error("WebSocket error: Can't connect to the server!");
            error = true;
        }
    } else {
        console.error("WebSocket error: This browser doesn't support websockets, can't run here!");
        error = true;
    }
    return error;
}

/**
 * @param {string | any} message
 */
function sendMessage(message) {
    if (socket == null) return false;
	if (socket.readyState <= 1) {
		socket.send(message);
        return true;
	}
}

export default {
	subscribe: messageStore.subscribe,
	sendMessage,
    connect,
    webSocket: socket
}

