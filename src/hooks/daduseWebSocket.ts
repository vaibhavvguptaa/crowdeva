import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  reconnectInterval?: number; 
  maxRetries?: number;        
}

export function useWebSocket(
  url: string,
  onMessage?: (event: MessageEvent) => void,
  { reconnectInterval = 5000, maxRetries = Infinity }: UseWebSocketOptions = {}
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(
    (wsUrl: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCount.current = 0;
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event); // Optional callback
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("⚠️ WebSocket disconnected");

        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          reconnectTimeoutRef.current = setTimeout(
            () => connect(wsUrl),
            reconnectInterval
          );
        } else {
          console.error("❌ Max WebSocket reconnection attempts reached");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    },
    [onMessage, reconnectInterval, maxRetries]
  );

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn("⚠️ WebSocket is not open. Cannot send message:", message);
    }
  }, []);

  useEffect(() => {
    connect(url);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [url, connect]);

  return { isConnected, sendMessage, lastMessage };
}
