
import { useState, useRef, useEffect } from "react";

interface ScrollToBottomHookProps {
  messages: any[];
}

export const useScrollToBottom = ({ messages }: ScrollToBottomHookProps) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isManualScrollingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          // Account for the fixed message input at the top when scrolling
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          setShowScrollButton(false);
          setNewMessagesCount(0);
        }
      });
    });
  };

  useEffect(() => {
    if (messages.length > 0 && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMessagesLength) {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        // Adjust the threshold to account for the fixed message input
        const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 20;
        
        if (isNearBottom && !isManualScrollingRef.current) {
          scrollToBottom();
        } else {
          setNewMessagesCount((prev) => prev + (messages.length - prevMessagesLength));
          setShowScrollButton(true);
        }
      }
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Account for the fixed message input when determining if we're at the bottom
      const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 5;
      
      isManualScrollingRef.current = true;
      
      if (isNearBottom) {
        setShowScrollButton(false);
        setNewMessagesCount(0);
      } else if (messages.length > 0) {
        setShowScrollButton(true);
      }
      
      clearTimeout(isManualScrollingRef.current as unknown as number);
      const timeoutId = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 100);
      
      isManualScrollingRef.current = timeoutId as unknown as boolean;
    }
  };

  return {
    containerRef,
    messagesEndRef,
    showScrollButton,
    newMessagesCount,
    scrollToBottom,
    handleScroll
  };
};
