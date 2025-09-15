import { convertThreadToMessages } from "../index";
import type { Thread, Interaction, UserMessage, AssistantMessage } from "../../types";

describe("convertThreadToMessages", () => {
  it("should convert thread interactions to messages in chronological order", () => {
    const mockUserMessage: UserMessage = {
      id: "user-1",
      type: "user",
      content: "Hello, how are you?",
      timestamp: new Date("2024-01-01T10:00:00Z"),
    };

    const mockAssistantMessage: AssistantMessage = {
      id: "assistant-1",
      type: "assistant",
      content: "I am doing well, thank you!",
      timestamp: new Date("2024-01-01T10:01:00Z"),
      streaming: false,
    };

    const mockInteraction: Interaction = {
      id: "interaction-1",
      user_message: mockUserMessage,
      assistant_messages: [mockAssistantMessage],
      status: "completed",
      created_at: new Date("2024-01-01T10:00:00Z"),
    };

    const mockThread: Thread = {
      id: "thread-1",
      interactions: [mockInteraction],
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T10:01:00Z"),
    };

    const result = convertThreadToMessages(mockThread);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockUserMessage);
    expect(result[1]).toEqual(mockAssistantMessage);
  });

  it("should handle multiple interactions in chronological order", () => {
    const interaction1: Interaction = {
      id: "interaction-1",
      user_message: {
        id: "user-1",
        type: "user",
        content: "First message",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      },
      assistant_messages: [
        {
          id: "assistant-1",
          type: "assistant",
          content: "First response",
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
      ],
      status: "completed",
      created_at: new Date("2024-01-01T10:00:00Z"),
    };

    const interaction2: Interaction = {
      id: "interaction-2",
      user_message: {
        id: "user-2",
        type: "user",
        content: "Second message",
        timestamp: new Date("2024-01-01T10:02:00Z"),
      },
      assistant_messages: [
        {
          id: "assistant-2",
          type: "assistant",
          content: "Second response",
          timestamp: new Date("2024-01-01T10:03:00Z"),
        },
      ],
      status: "completed",
      created_at: new Date("2024-01-01T10:02:00Z"),
    };

    const mockThread: Thread = {
      id: "thread-1",
      interactions: [interaction2, interaction1], // Out of order
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T10:03:00Z"),
    };

    const result = convertThreadToMessages(mockThread);

    expect(result).toHaveLength(4);
    expect(result[0].content).toBe("First message");
    expect(result[1].content).toBe("First response");
    expect(result[2].content).toBe("Second message");
    expect(result[3].content).toBe("Second response");
  });

  it("should handle empty interactions array", () => {
    const mockThread: Thread = {
      id: "thread-1",
      interactions: [],
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T10:00:00Z"),
    };

    const result = convertThreadToMessages(mockThread);

    expect(result).toHaveLength(0);
  });

  it("should handle multiple assistant messages per interaction", () => {
    const mockInteraction: Interaction = {
      id: "interaction-1",
      user_message: {
        id: "user-1",
        type: "user",
        content: "Tell me a story",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      },
      assistant_messages: [
        {
          id: "assistant-1",
          type: "assistant",
          content: "Once upon a time...",
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
        {
          id: "assistant-2",
          type: "assistant",
          content: "The end.",
          timestamp: new Date("2024-01-01T10:02:00Z"),
        },
      ],
      status: "completed",
      created_at: new Date("2024-01-01T10:00:00Z"),
    };

    const mockThread: Thread = {
      id: "thread-1",
      interactions: [mockInteraction],
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T10:02:00Z"),
    };

    const result = convertThreadToMessages(mockThread);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe("Tell me a story");
    expect(result[1].content).toBe("Once upon a time...");
    expect(result[2].content).toBe("The end.");
  });
});
