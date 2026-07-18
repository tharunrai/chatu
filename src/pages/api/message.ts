import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { roomId, username, text, timestamp } = req.body;

  try {
    // Trigger the 'new-message' event on the presence channel specific to the roomId
    await pusher.trigger(`presence-room-${roomId}`, 'new-message', {
      username,
      text,
      timestamp,
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pusher error:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger event' });
  }
}
