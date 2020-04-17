import { createStore, compose, applyMiddleware } from 'redux';
import loggerMiddleware from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import axios from 'axios';
import socket from './socket';


const GOT_MESSAGES_FROM_SERVER = 'GOT_MESSAGES_FROM_SERVER';
const WRITE_MESSAGE = 'WRITE_MESSAGE';
const GOT_NEW_MESSAGE_FROM_SERVER = 'GOT_NEW_MESSAGE_FROM_SERVER';
const INPUT_NAME = 'INPUT_NAME';

export const gotMessagesFromServer = (messages) => {
    return {
        type: GOT_MESSAGES_FROM_SERVER,
        payload: messages,
    }
}

export const writeMessage = (inputContent) => {
    return {
        type: WRITE_MESSAGE,
        payload: inputContent,
    };
}

export const inputName = (inputContent) => {
    return {
        type: INPUT_NAME,
        payload: inputContent
    }
}

export const gotNewMessageFromServer = (message) => {
    return {
        type: GOT_NEW_MESSAGE_FROM_SERVER,
        payload: message
    };
}

export const fetchMessages = () => {
    return (dispatch) => {
        axios.get('/api/messages')
            .then(res => res.data)
            .then(messages => dispatch(gotMessagesFromServer(messages)));
    }
}

export const postMessage = (content, channelId, name) => {
    return (dispatch) => {
        axios.post('/api/messages', { content: content, channelId: channelId, name: name })
            .then(res => res.data)
            .then(message => {
                dispatch(gotNewMessageFromServer(message));
                socket.emit('new-message', message);
            })
    }
}

const initialState = {
    messages: [],
    newMessageEntry: '',
    nameEntry: '',
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case GOT_MESSAGES_FROM_SERVER:
            // console.log(action.payload)
            return { ...state, messages: [...action.payload] };
        case WRITE_MESSAGE:
            return { ...state, newMessageEntry: action.payload };
        case GOT_NEW_MESSAGE_FROM_SERVER:
            return { ...state, messages: [...state.messages, action.payload] };
        case INPUT_NAME:
            return { ...state, nameEntry: action.payload };
        default:
            return state;
    }
}

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(reducer,
    composeEnhancer(applyMiddleware(loggerMiddleware, thunkMiddleware))
);