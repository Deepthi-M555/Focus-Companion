import { useState } from "react";
import { parseInput } from "../engine/parser";
import Timetable from "../components/Timetable";
import { generateSchedule } from "../engine/Scheduler";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [schedule, setSchedule] = useState([]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };

    const parsed = parseInput(input);

    const [schedule, setSchedule] = useState([]);

    let aiText = "";

    if (parsed.tasks.length === 0) {
      aiText = `You have ${parsed.hours} hours. Please tell me what subjects you want to study.`;
    } else {
      aiText = `You have ${parsed.hours} hours for ${parsed.tasks.join(", ")}`;
    }

    const aiMessage = {
      type: "ai",
      text: aiText,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);

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

      {/* 🔥 Timetable UI */}
      <Timetable schedule={schedule} />
    </div>
  );
}

export default ChatPage;