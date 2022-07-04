import React, { useEffect, useState } from "react";
import { JsonPayload, UserMessage, wsInstance } from "../lib/useWebSocket";
import { useDebounce } from "../lib/useDebounce";
import SectionSeparator from "./section-separator";
import styles from "./chatroom.module.css";
type Form = {
  username: string;
  message: string;
};

interface Props {
  socket: WebSocket | null;
  users: string[];
  messages: UserMessage[];
  isOffline: boolean;
}

const Chatform = ({ socket, users, messages, isOffline }: Props) => {
  const [formState, setFormState] = useState<Form>({
    username: "",
    message: "",
  });

  const [debouncedWord] = useDebounce(formState.username, 1000);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleUserLeave = () => {
    console.log("leaving..");
    const jsonData = {
      action: "left",
    };
    socket?.send(JSON.stringify(jsonData));
  };

  useEffect(() => {
    const payload = {
      action: "username",
      username: formState.username,
      message: formState.message,
    };
    const timeout = setTimeout(() => {
      console.log("called");
      socket?.send(JSON.stringify(payload));
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [debouncedWord]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleUserLeave);
    return () => {
      window.removeEventListener("beforeunload", handleUserLeave);
    };
  }, []);

  const handleSendMessage = () => {
    console.log("sending message");
    if (!socket || formState.message === "") {
      alert("Server is currently down. Cannot send message");
      return;
    }
    const jsonData = {
      action: "broadcast_client",
      username: formState.username,
      message: formState.message,
    };

    socket.send(JSON.stringify(jsonData));
    setFormState({
      ...formState,
      message: "",
    });
  };

  return (
    <div className={styles.chatroomGrid}>
      <div className={styles.chatColumn}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            name="username"
            id="username"
            className="form-control"
            autoCorrect="true"
            onChange={handleFormChange}
          ></input>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <input
            type="text"
            name="message"
            id="message"
            className="form-control"
            autoCorrect="true"
            onChange={handleFormChange}
            value={formState.message}
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          ></input>
          <hr />
          <button
            onClick={() => handleSendMessage()}
            className="btn btn-secondary"
          >
            Send message
          </button>
        </div>
      </div>
      <div
        className={isOffline ? styles.statusDivOffline : styles.statusDivOnline}
      >
        {isOffline ? "Server is offline" : "Server is online"}
      </div>
      <div className={styles.chatMessages}>
        {messages.map((message, i) => (
          <div key={i}>
            <strong>{message.user}:</strong> {message.message}
          </div>
        ))}
      </div>
      <div>
        <h1 className="header">Currently online users</h1>
        {users.length > 0 && users.map((user, i) => <h1 key={i}>{user}</h1>)}
      </div>
    </div>
  );
};

export default Chatform;
