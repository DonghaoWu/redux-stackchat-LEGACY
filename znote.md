Our current goal is for the Redux store to handle our messages array,

REMEMBER: it is EXTREMELY important that the reducer be a pure function. This means you must follow two rules:

The same output is always returned for the same input.
No side effects (AJAX, mutating data, etc.).
We'll see more reasons why this is so important later, but for now think of it this way: our state is the crux of our app, so any changes to it should be as predictable and debuggable as possible.

Write a reducer function that expects to receive an action with the GOT_MESSAGES_FROM_SERVER type. When it receives an action of this type, it should return a new object with the value at the messages key equal to the messages array in the action.


Action Types: These are essentially labels for the different kinds of actions that may enter our store. We define and use these labels so we can stay consistent and our editors can make use of variable naming instead of simply strings.

Action Creators: These are functions that actually produce our actions—objects with a type property and (often, but not always) other information attached. These are the objects that will actually be dispatched to the store.

Reducer: A function that receives the previous state of the store and an action object. The reducer should then read the action object's type and decide what the following state should be. The old state should not be affected in any way; the new state created should be a brand new state.

Store: The most central component of Redux, the store is the holder of state and our channel for affecting and reacting to changes to that state.

In the above code, we use the dispatch method of store to send an action object into our store, which will be received by our reducer and used to produce our next state. We call another method on our store, getState, to gain access to that store. We can also ask for the state before any actions are dispatched, in which case we see our initialState.

When this happens, our MessagesList component will be "unmounted", or removed from the DOM. If that's the case, `we no longer want to listen to changes from the store—otherwise, we'll be attempting to setState on a component that doesn't exist! That's bad! `

To avoid this, we need to tap into the componentWillUnmount lifecycle hook, and "unsubscribe" our listener. (Once again, revisit the example from before, to see what this looks like.)

When we use store.subscribe, it returns an "unsubscribe" function that we can use to remove the listener. Capture this listener and put it somewhere the MessagesList component can get to it.
When the MessagesList component unmounts, invoke that "unsubscribe" function.

To do this, we're going to use our gotMessagesFromServer action creator to create an action, and then dispatch that action to the store!
(action 与 dispatch 的结合 ==》 后面会使用 thunk 实现)。

第一阶段的设计主要是关于：
    - store.js
    - MessageList 组件

- 第二阶段的设计主要是关于： 脱离父子单向传递体系。
    - ChannelList 组件
    - MessageList 组件

Before, if we wanted to find this out, we would have needed to refactor our app so that our "messages" state was managed by a parent of both the ChannelList and MessagesList.

However, we're using Redux now! Our state is free from the shackles of our component's visual hierarchy! 

小结：目前而言，我们学习了如何设置 type , action, reducer, initialState 的组件，同时通过 subscribe ， unsubscribe， getState 把 state 和 component 结合起来。

- 还需要 学习 api 的理解
    - axios.get('/api/messages')
    - 如果在一个组件里面调用了 axios call 而改变了 redux state，那么其他组件就不需要再写一次

You may be wondering: do we really have to track the value of the input field in Redux? This seems like local state, so if it's just an input field, why not just keep it on the local React component's state?

The answer is: that's a perfectly fair point. If we don't care about the input value beyond the lifespan of the component, then we don't need to put it in Redux. However, I foresee the possibility that we may in fact want this input value to exist beyond the lifespan of the component, so please bear with me. That being said, if your inputs are in fact going to be ephemeral, it's perfectly legitimate to manage them with local React state instead of Redux.

Remember that the previous state is immutable. This means that not only must you return a new state object, but also you must NOT mutate any objects/arrays being held on that object! This means our "messages" array is immutable, too! How can we get a new array that includes our new message?

```jsx
case WRITE_MESSAGE:
  return { ...state, newMessageEntry: action.newMessageEntry }

case GOT_NEW_MESSAGE_FROM_SERVER:
  return { ...state, messages:[ ...prevState.messages, action.message ] }

```

- 输入的正反馈系统。

```jsx
import React, { Component } from 'react';
import store from '../store';
import { writeMessage, gotNewMessageFromServer, gotMessagesFromServer } from '../store';
import axios from 'axios';
import socket from '../socket'


export default class NewMessageEntry extends Component {
  constructor() {
    super();
    this.state = store.getState();
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => this.setState(store.getState()));
  }


  componentWillUnmount() {
    this.unsubscribe();
  }

  handleChange = (evt) => {
    store.dispatch(writeMessage(evt.target.value))
  }

  handleSubmit = (evt) => {
    event.preventDefault();
    const content = this.state.newMessageEntry;
    const channelId = this.props.channelId;
    axios.post('/api/messages', { content: content, channelId: channelId })
      .then(res => res.data)
      .then(message => {
        store.dispatch(gotNewMessageFromServer(message));
        socket.emit('new-message', message);
      })
  }

  render() {
    return (
      <form id="new-message-form" onSubmit={this.handleSubmit}>
        <div className="input-group input-group-lg">
          <input
            className="form-control"
            type="text"
            name="content"
            placeholder="Say something nice..."
            value={this.state.newMessageEntry}
            onChange={this.handleChange}
          />
          <span className="input-group-btn">
            <button className="btn btn-default" type="submit">Chat!</button>
          </span>
        </div>
      </form>
    );
  }
}

```

- post request 只返回一个信息。
- channelId 是一个很重要的变量，在切换频道，提交新信息，还有很多数据流动方面都需要用到，这是一个很重要的设计点。

When we post a new message, our browser client updates with the new message. But other browser clients don't get our new message until they refresh! We can solve this with sockets!

Say we have two users chatting on a channel: Alice and Bob. Here's how the socket data flow will work:

After Alice successfully posts a new message, her client emits an event to tell the server about the new message.
The server receives the event that Alice emitted.
The server, in turn, broadcast.emits an event to all clients EXCEPT Alice's (remember, this is how broadcast.emit works).
Bob's client receives the message that the server emitted.

These steps are actually already done! Check out server/socket.js. Note that our server is listening for an event from a client called "new-message". When it gets this event, the server in turn broadcast.emits an event to all other clients (this event is also called "new-message").
It's easy to get confused by who receives which events. Remember that clients emit events ONLY to the server (and the server listens for/receives events only from clients). Likewise, the server emits events only to clients (and the clients listen for/receive events only from the server). The server is kind of like a post office: all messages need to be routed through it.

Now our server is emitting an event with the new message to all clients except the one that originally sent it. We need to listen for this event from the client. We can do this in client/socket.js.
Add a new listener that will receive the message, and dispatch an action to add the new message to our state.

- socket的使用

```jsx
import io from 'socket.io-client';

const socket = io(window.location.origin);

socket.on('connect', () => {
  console.log('I am now connected to the server!');
  socket.on('new-message', function (message) {
    store.dispatch(gotNewMessageFromServer(message));
  });
});

export default socket;
```

```jsx
const Message = require('../db/models/message');
const Channel = require('../db/models/channel');

module.exports = io => {

  io.on('connection', socket => {

    console.log(socket.id, ' has made a persistent connection to the server!');

    socket.on('new-message', message => {
      socket.broadcast.emit('new-message', message);
    });

    socket.on('new-channel', channel => {
      socket.broadcast.emit('new-channel', channel);
    });

  });

};
```

```jsx
const io = require('socket.io')(server);

// handle sockets
require('./socket')(io);
```


- About thunk

You know what would be nice? If we could just dispatch asynchronous actions the way we dispatch synchronous actions. 

They're called "thunks", and we're going to write them! But to do this, we'll need a special piece of middleware: redux-thunk.

dependencies

```diff
+ redux-logger
+ redux-thunk
```

We're going to introduce a piece of middleware that will add one more step to this process.

npm install --save redux-thunk
In store.js, import thunkMiddleware from redux-thunk and pass it as another argument to applyMiddleware.

Now, whenever we use store.dispatch, it will be a three-step process:

1. The store checks to see if the thing we passed to `dispatch` is a regular object or a function. 
  a. If it's a function, the store invokes that function immediately and passes the `dispatch` and `getState` methods to it as arguments. Do not move on to step 2.
  b. If it's a regular object, move on to step 2.
2. The store invokes our reducer with the action and the previous state, and sets the return value 
   as the new state.
3. The store invokes all listeners that have been registered with it (via `store.subscribe`).

Before, our reducer expected an action to be a plain JavaScript object with some identifying type field. However, thunk middleware will give us a powerful new ability: instead of dispatching an action object, we can dispatch a function! When thunkMiddleware sees that we've dispatched a function instead of a regular object, it will say,

Hey! This isn't a regular action! It's a function! I can't give this to the reducer, so instead I'll invoke it and pass the store's dispatch method to it, so that whenever that side effect completes or the async action resolves, they can use it to dispatch a new action with whatever data they get.

These functions that we dispatch are called thunks. We can use thunks to hide away all our side effects and AJAX requests! That way, our components can just dispatch without needing to worry about the nitty gritty of AJAX.

`TOM'S THIRD LAW: ALL ASYNCHRONOUS BEHAVIOR (SUCH AS AJAX) AND SIDE EFFECTS SHOULD GO INTO A THUNK`

Your components will thank you in the long run.

There are of course cases where you'll write React interfaces that don't use Redux, in which case you should simply use your best judgment for how to handle side effects.

You may also end up using a side-effect handling middleware other than redux-thunk (for example, redux-saga accomplishes a similar goal in a more sophisticated way). Even in these cases, the third law still holds insomuch that your side effects should be handled by that middleware, rather than clutter up your components.

- Name Entry

- GLOSSARY OF TERMS
Action: an object that has at least a "type" field, and any other fields needed to calculate the change to the state
Action Creator: a function that returns an action. We write these to help us stay DRY
Action Type: a string constant describing something that will cause the UI to update
Middleware: functions that we can use to configure the store. These add functionality to the store when we dispatch actions. We don't know how to write our own yet (though it's not hard), so for now we get middleware from various npm packages
Reducer: a function that we write for each app, which accepts the previous state from the Redux store as its first argument, and an action as its second argument. It should return a new state object with the changes described by the action. The reducer should be a pure function - there should be no side effects, and it should not mutate the previous state
Store: an object created by the "createStore" function from Redux. It accepts a reducer that we write, and any number of optional middleware. It maintains a "state" object internally, which we have access to via "store.getState". When we pass an action to "store.dispatch", the store swaps out its current state with the result of invoking the reducer with the action and the current state. We can also register listeners via "store.subscribe", which the store will invoke after the state has changed
Thunk: a function that we can pass to "store.dispatch" if we configure our store with "thunkMiddleware". If we dispatch a thunk, the thunk middleware will invoke the function and pass the store's "dispatch" and "getState" methods to it. Thunks are a desirable place to perform side effects (like AJAX requests) because it de-clutters our components, and because they make it easy to eventually dispatch other actions when some asynchronous behavior resolves


We dispatch something (which could be a regular action object, or a "thunk" function

Before the action is processed by our reducer, it is evaluated by thunk middleware.

If thunk middleware sees that we've given it a normal object, send the action to the reducer as usual.
Else if thunk middleware sees that we've given it a function, it invokes that function (passing it dispatch and getState). Do not move on to the reducer.
Within our thunk function, we can perform all the side effects and AJAX we want. When we're done performing side effects, it is every likely that we will end up dispatching another action (or even another thunk), and the process repeats
