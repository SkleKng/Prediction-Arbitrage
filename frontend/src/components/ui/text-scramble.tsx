"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

interface TextScrambleProps {
  text: string;
  className?: string;
  /** If true (default), renders the decorative hover underline + glow.
   * Set false when using this purely as an inline state-change decoder. */
  decorative?: boolean;
}

export function TextScramble({
  text,
  className = "",
  decorative = true,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);
  const mountedRef = useRef(true);

  const clearScrambleInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const scramble = useCallback(() => {
    setIsScrambling(true);
    frameRef.current = 0;
    const duration = text.length * 3;

    clearScrambleInterval();

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        clearScrambleInterval();
        return;
      }

      frameRef.current++;

      const progress = frameRef.current / duration;
      const revealedLength = Math.floor(progress * text.length);

      const newText = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i < revealedLength) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplayText(newText);

      if (frameRef.current >= duration) {
        clearScrambleInterval();
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, 30);
  }, [text, clearScrambleInterval]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    scramble();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      // If the component unmounts mid-scramble (including strict-mode
      // double-invocation), make sure no setInterval keeps running and
      // tries to setState on an unmounted component.
      mountedRef.current = false;
      clearScrambleInterval();
    };
  }, [clearScrambleInterval]);

  // Re-scramble whenever the target text changes (e.g. status label flips
  // from "Connected" -> "Reconnecting"). We track the last text we
  // scrambled against so React StrictMode's double-invoke in dev doesn't
  // kick off a phantom scramble on mount, and so the scramble only fires
  // on an actual content change.
  const lastTextRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastTextRef.current === null) {
      lastTextRef.current = text;
      setDisplayText(text);
      return;
    }
    if (lastTextRef.current === text) return;
    lastTextRef.current = text;
    scramble();
  }, [text, scramble]);

  if (!decorative) {
    return (
      <span
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayText}
      </span>
    );
  }

  return (
    <div
      className={`group relative inline-flex flex-col cursor-pointer select-none ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative font-mono text-lg tracking-widest uppercase">
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block transition-all duration-150 ${
              isScrambling && char !== text[i]
                ? "text-primary scale-110"
                : "text-foreground"
            }`}
            style={{
              transitionDelay: `${i * 10}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </span>

      <span className="relative h-px w-full mt-2 overflow-hidden">
        <span
          className={`absolute inset-0 bg-foreground transition-transform duration-500 ease-out origin-left ${
            isHovering ? "scale-x-100" : "scale-x-0"
          }`}
        />
        <span className="absolute inset-0 bg-border" />
      </span>

      <span
        className={`absolute -inset-4 rounded-lg bg-primary/5 transition-opacity duration-300 -z-10 ${
          isHovering ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
