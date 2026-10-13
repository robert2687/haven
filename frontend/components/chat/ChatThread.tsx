import type { ChatMessage } from "../../lib/types";
import { MessageBubble } from "./MessageBubble";

export function ChatThread({ messages }: { messages: ChatMessage[] }): React.JSX.Element {
  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <MessageBubble key={m.id} msg={m} />
      ))}
    </div>
  );
}
