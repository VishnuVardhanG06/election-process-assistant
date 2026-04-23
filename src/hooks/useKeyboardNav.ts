"use client";

import { useState, useCallback, useEffect, RefObject } from "react";

/**
 * Enables Arrow key navigation for a list of focusable items.
 * WCAG 2.1 keyboard interaction pattern (§2.1.1).
 */
export function useKeyboardNav(
  listRef: RefObject<HTMLElement | null>,
  itemSelector = "[role='option'], button, [tabindex]",
  onSelect?: (index: number) => void
) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!listRef.current) return;
      const items = Array.from(
        listRef.current.querySelectorAll<HTMLElement>(itemSelector)
      );
      if (!items.length) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight": {
          e.preventDefault();
          const next = Math.min(activeIndex + 1, items.length - 1);
          setActiveIndex(next);
          items[next]?.focus();
          break;
        }
        case "ArrowUp":
        case "ArrowLeft": {
          e.preventDefault();
          const prev = Math.max(activeIndex - 1, 0);
          setActiveIndex(prev);
          items[prev]?.focus();
          break;
        }
        case "Home": {
          e.preventDefault();
          setActiveIndex(0);
          items[0]?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          const last = items.length - 1;
          setActiveIndex(last);
          items[last]?.focus();
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          onSelect?.(activeIndex);
          break;
        }
      }
    },
    [activeIndex, listRef, itemSelector, onSelect]
  );

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, listRef]);

  return { activeIndex, setActiveIndex };
}
