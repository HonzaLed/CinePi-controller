import { writable } from 'svelte/store';

const messageStore = writable('');
const errorStore = writable('');
/**
 * @type {WebSocket | null}
 */
let socket = null;

/**
 * @param {string | URL} url
 */
function connect(url) {
	errorStore.set('');

	if ('WebSocket' in window) {
		socket = new WebSocket(url);
		// Connection opened
		socket.onopen = (event) => {
			console.log('WebSocket connected!');
		};

		// Listen for messages
		socket.onmessage = (event) => {
			messageStore.set(event.data);
		};

		socket.onerror = (event) => {
			console.error("Can't connect to the server!");
			errorStore.set("Can't connect to the server!");
		};
	} else {
		console.error("This browser doesn't support websockets, can't run here!");
		errorStore.set("This browser doesn't support websockets, can't run here!");
	}
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
	socket: socket,
	errorNotifier: errorStore
};
