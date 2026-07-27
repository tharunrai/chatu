import { useState, useEffect, useCallback } from "react";
import { RecentRoom } from "@/types/chat";

const RECENT_ROOMS_KEY = "chatu_recent_rooms";

export function useRecentRooms() {
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  // Load recent rooms from local storage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_ROOMS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentRooms(parsed);
      } catch (e) {
        console.error("Failed to parse recent rooms", e);
      }
    }
  }, []);

  // Save/add room to recent list
  const saveRecentRoom = useCallback((roomId: string, username: string) => {
    setRecentRooms((prev) => {
      const newRoom: RecentRoom = { roomId, username, lastJoined: Date.now() };
      const filtered = prev.filter((r) => r.roomId !== roomId || r.username !== username);
      const updated = [newRoom, ...filtered].slice(0, 5); // keep top 5
      try {
        localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save recent rooms", e);
      }
      return updated;
    });
  }, []);

  // Delete a room from recent list
  const deleteRecentRoom = useCallback((e: React.MouseEvent, roomToDelete: RecentRoom, onEmpty?: () => void) => {
    e.stopPropagation();
    setRecentRooms((prev) => {
      const updated = prev.filter(
        (r) => r.roomId !== roomToDelete.roomId || r.username !== roomToDelete.username
      );
      try {
        localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to delete recent room", err);
      }
      if (updated.length === 0 && onEmpty) {
        onEmpty();
      }
      return updated;
    });
  }, []);

  return {
    recentRooms,
    saveRecentRoom,
    deleteRecentRoom,
  };
}
