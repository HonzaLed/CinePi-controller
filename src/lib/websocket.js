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
		socket.onopen = () => {
			console.log('WebSocket connected!');
		};

		// Listen for messages
		socket.onmessage = (event) => {
			messageStore.set(event.data);
		};

		// Report errors
		socket.onerror = () => {
			console.error('Error: WebSocket disconnected or didnt connect');
			errorStore.set('WebSocket disconnected or didnt connect');
		};

		// We don't close connection, so if it got closed, it's an error
		socket.onclose = () => {
			console.error('Error: websocket disconnected!');
			errorStore.set('WebSocket disconnected!');
		};
	} else {
		console.error("Error: This browser doesn't support websockets, can't run here!");
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
	return false;
}

export default {
	subscribe: messageStore.subscribe,
	sendMessage,
	connect,
	socket,
	errorNotifier: errorStore
};
