import io from 'socket.io-client';
import store from './store';
import { gotNewMessageFromServer, gotMessagesFromServer, fetchMessages } from './store';

const socket = io(window.location.origin);

socket.on('connect', () => {
  console.log('I am now connected to the server!');
  socket.on('new-message', function (message) {
    store.dispatch(gotNewMessageFromServer(message));
  });
  socket.on('delete-message', function () {
    // console.log('socket.delete is dispatching!')
    store.dispatch(fetchMessages());
  });
  socket.on('edited-message', function () {
    store.dispatch(fetchMessages());
  });
});

export default socket;
