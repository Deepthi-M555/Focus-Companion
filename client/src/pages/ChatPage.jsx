import { useState } from "react";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input) return;

    const userMessage = { type: "user", text: input };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Focus Companion</h2>

      <div style={{ minHeight: "300px", marginBottom: "20px" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.type === "user" ? "You: " : "AI: "}</strong>
            {msg.text}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tell me your plan..."
      />

      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default ChatPage;