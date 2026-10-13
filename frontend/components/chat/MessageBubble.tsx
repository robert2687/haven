import type { ChatMessage } from "../../lib/types";
import { cn } from "../../lib/utils";

export function MessageBubble({ msg }: { msg: ChatMessage }): React.JSX.Element {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md bg-slate-800 text-slate-100",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        {msg.timestamp && (
          <span className="mt-1 block text-[10px] opacity-60">{msg.timestamp}</span>
        )}
      </div>
    </div>
  );
}
