export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
  imageUrl?: string;
  isViewOnce?: boolean;
  isOpened?: boolean;
  mediaId?: string;
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
