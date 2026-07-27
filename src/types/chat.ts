export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
  replyTo?: {
    username: string;
    text: string;
  };
}

export interface RecentRoom {
  roomId: string;
  username: string;
  lastJoined: number;
}
