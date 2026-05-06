import { describe, expect, test } from "bun:test";
import { Message, type Attachment } from "chat";
import type { Root } from "mdast";

// Helper to simulate the mapping logic in lib/chat.ts
function prepareMessages(messages: Message[]) {
  return messages.map((m) => {
    if (!m.text.trim() && (m.attachments?.length ?? 0) > 0) {
      return Object.assign(Object.create(Object.getPrototypeOf(m)), m, {
        text: "[Attached Image]",
      });
    }
    return m;
  });
}

describe("Vision Message Preparation", () => {
  test("adds placeholder text to messages with attachments and empty text", () => {
    const mockMessage = new Message({
      id: "1",
      threadId: "t1",
      text: "",
      attachments: [
        { type: "image", url: "http://example.com/img.png" } as Attachment,
      ],
      author: {
        userId: "u1",
        userName: "user",
        fullName: "User",
        isBot: false,
        isMe: false,
      },
      metadata: { dateSent: new Date(), edited: false },
      formatted: { type: "root", children: [] } as Root,
      raw: {},
    });

    const prepared = prepareMessages([mockMessage]);
    expect(prepared[0].text).toBe("[Attached Image]");
  });

  test("does not change messages with text and attachments", () => {
    const mockMessage = new Message({
      id: "2",
      threadId: "t1",
      text: "Look at this",
      attachments: [
        { type: "image", url: "http://example.com/img.png" } as Attachment,
      ],
      author: {
        userId: "u1",
        userName: "user",
        fullName: "User",
        isBot: false,
        isMe: false,
      },
      metadata: { dateSent: new Date(), edited: false },
      formatted: { type: "root", children: [] } as Root,
      raw: {},
    });

    const prepared = prepareMessages([mockMessage]);
    expect(prepared[0].text).toBe("Look at this");
  });

  test("does not change messages with text and no attachments", () => {
    const mockMessage = new Message({
      id: "3",
      threadId: "t1",
      text: "Hello",
      attachments: [],
      author: {
        userId: "u1",
        userName: "user",
        fullName: "User",
        isBot: false,
        isMe: false,
      },
      metadata: { dateSent: new Date(), edited: false },
      formatted: { type: "root", children: [] } as Root,
      raw: {},
    });

    const prepared = prepareMessages([mockMessage]);
    expect(prepared[0].text).toBe("Hello");
  });
});
