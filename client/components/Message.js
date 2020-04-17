import React, { Component } from 'react';
import axios from 'axios';
import store from '../store';
import socket from '../socket'
import { gotMessagesFromServer, fetchMessages } from '../store';

export default class Message extends Component {
  constructor() {
    super();
    this.state = {
      editing: false,
      content: '',
    }
  }

  handleDelete = (messageId) => {
    axios.delete(`/api/messages/${messageId}`)
      .then(message => {
        store.dispatch(fetchMessages());
        socket.emit('delete-message');
      });
  }

  handleEdit = (content, messageId) => {
    if (!this.state.editing) {
      this.setState({
        editing: true,
        content: content,
      })
    }
    else {
      const newContent = this.state.content;
      console.log('put is working!', messageId, newContent);
      axios.put(`/api/messages/${messageId}`, { content: newContent })
        .then(message => {
          store.dispatch(fetchMessages());
          socket.emit('edited-message');
        })

      this.setState({
        editing: false,
        content: '',
      })
    }
  }

  handleChange = (evt) => {
    this.setState({
      content: evt.target.value,
    })
  }

  render() {
    const message = this.props.message;
    return (
      <li className="media">
        <div className="media-left">
          <a href="#">
            <img className="media-object" src={message.author.image} alt="image" />
          </a>
        </div>
        {this.state.editing
          ?
          <div className="media-body">
            <h4 className="media-heading">{message.author.name}</h4>
            <input
              type="text"
              name="name"
              className="form-control"
              value={this.state.content}
              onChange={this.handleChange}
            />
          </div >
          :
          <div className="media-body">
            <h4 className="media-heading">{message.author.name}</h4>
            {message.content}
          </div >
        }

        <div className="media-right">
          <button onClick={() => this.handleEdit(message.content, message.id)}>{
            this.state.editing ?
              (`done`) : (`edit`)
          }</button>
          <button onClick={() => this.handleDelete(message.id)}> delete</button>
        </div>
      </li >
    );
  }
}
