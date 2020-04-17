import React, { Component } from 'react';
import store from '../store';
import { writeMessage, gotNewMessageFromServer, gotMessagesFromServer, postMessage } from '../store';
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
    // axios.post('/api/messages', { content: content, channelId: channelId })
    //   .then(res => res.data)
    //   .then(message => {
    //     store.dispatch(gotNewMessageFromServer(message));
    //     socket.emit('new-message', message);
    //   })

    store.dispatch(postMessage(content, channelId, this.state.nameEntry))
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
