import { NextApiRequest, NextApiResponse } from 'next';
import { pusherServer as pusher } from '@/services/pusherServer';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    roomId,
    username,
    text,
    timestamp,
    replyTo,
    imageUrl,
    isViewOnce,
    mediaId,
    chunkIndex,
    totalChunks,
    chunkData,
  } = req.body;

  try {
    // Trigger 'new-message' event on the presence channel
    await pusher.trigger(`presence-room-${roomId}`, 'new-message', {
      username,
      text,
      timestamp,
      replyTo,
      imageUrl,
      isViewOnce,
      mediaId,
      chunkIndex,
      totalChunks,
      chunkData,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pusher error:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger event' });
  }
}
