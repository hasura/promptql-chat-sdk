import { PromptQLChat } from "promptql-chat-sdk";
import "promptql-chat-sdk/styles";

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dev Example</h1>
      <p>Proxy expected to be running → http://localhost:8080</p>
      <small>Check the docs for more info.</small>
      <PromptQLChat endpoint="/api" />
    </div>
  );
}
