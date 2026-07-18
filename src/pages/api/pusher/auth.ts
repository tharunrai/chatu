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

  const { socket_id, channel_name, username } = req.body;

  if (!socket_id || !channel_name || !username) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // 1. Fetch current users in the presence channel to check for duplicates
    const response = await pusher.get({
      path: `/channels/${channel_name}/users`,
    });

    if (response.status === 200) {
      const result = await response.json();
      const users = result.users || [];

      // Check if the username already exists in the channel
      // We are using the username as the user_id for simplicity
      const isUsernameTaken = users.some((user: { id: string }) => user.id === username);

      if (isUsernameTaken) {
        return res.status(409).json({ message: 'Username is already taken in this room' });
      }
    }

    // 2. If unique, authorize the connection
    const presenceData = {
      user_id: username,
      user_info: {
        username: username,
      },
    };

    const authResponse = pusher.authorizeChannel(socket_id, channel_name, presenceData);
    res.status(200).send(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ message: 'Failed to authorize' });
  }
}
