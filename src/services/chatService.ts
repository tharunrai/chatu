export interface SendChatMessageParams {
  roomId: string;
  username: string;
  text: string;
  msgId: string;
  msgTimestamp: number;
  imageUrl?: string;
  isViewOnce?: boolean;
  replyTo?: {
    username: string;
    text: string;
  };
}

/**
 * Handles sending a chat message to the server via API.
 * Automatically chunks large images to bypass Pusher payload limits.
 */
export async function sendChatMessage(params: SendChatMessageParams): Promise<void> {
  const { roomId, username, text, msgId, msgTimestamp, imageUrl, isViewOnce, replyTo } = params;

  if (imageUrl) {
    // Chunk base64 string into 6000 character segments (~6KB per event)
    const CHUNK_SIZE = 6000;
    const totalChunks = Math.ceil(imageUrl.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = imageUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          username,
          text: i === 0 ? text : "",
          timestamp: msgTimestamp,
          mediaId: msgId,
          chunkIndex: i,
          totalChunks,
          chunkData,
          isViewOnce,
          replyTo: i === 0 ? replyTo : undefined,
        }),
      });
    }
  } else {
    // Standard text message
    await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        username,
        text,
        timestamp: msgTimestamp,
        replyTo,
      }),
    });
  }
}
