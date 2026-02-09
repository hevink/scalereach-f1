"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { CaptionStyle } from "@/lib/api/captions";

interface DraggableCaptionProps {
  text: string;
  style: Partial<CaptionStyle>;
  onStyleChange: (style: Partial<CaptionStyle>) => void;
  onTextChange?: (text: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function DraggableCaption({
  text,
  style,
  onStyleChange,
  onTextChange,
  containerRef,
}: DraggableCaptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [editText, setEditText] = useState(text);
  const captionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Position as percentage (0-100)
  const [position, setPosition] = useState({ x: 50, y: 85 });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStart = useRef({ fontSize: style.fontSize || 32 });

  useEffect(() => {
    setEditText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (onTextChange) {
      setIsEditing(true);
    }
  }, [onTextChange]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (onTextChange && editText !== text) {
      onTextChange(editText);
    }
  }, [editText, text, onTextChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditText(text);
      setIsEditing(false);
    }
  }, [handleBlur, text]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [isEditing, position]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { fontSize: style.fontSize || 32 };
    dragStart.current = { x: e.clientX, y: e.clientY, posX: 0, posY: 0 };
  }, [style.fontSize]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const deltaX = ((e.clientX - dragStart.current.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.current.y) / rect.height) * 100;
        setPosition({
          x: Math.max(10, Math.min(90, dragStart.current.posX + deltaX)),
          y: Math.max(10, Math.min(95, dragStart.current.posY + deltaY)),
        });
      }

      if (isResizing) {
        const deltaY = dragStart.current.y - e.clientY;
        const newSize = Math.max(16, Math.min(72, resizeStart.current.fontSize + deltaY * 0.5));
        onStyleChange({ fontSize: Math.round(newSize) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, containerRef, onStyleChange]);

  const captionStyle: React.CSSProperties = {
    fontFamily: style.fontFamily || "Inter",
    fontSize: `${style.fontSize || 32}px`,
    fontWeight: 700,
    color: style.textColor || "#FFFFFF",
    textShadow: style.shadow ? "2px 2px 4px rgba(0,0,0,0.8)" : "none",
    backgroundColor: style.backgroundColor || "transparent",
    padding: "4px 12px",
    borderRadius: "4px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
  };

  if (!text) return null;

  return (
    <div
      ref={captionRef}
      className={cn(
        "absolute select-none transition-shadow",
        isDragging && "cursor-grabbing",
        !isDragging && !isEditing && "cursor-grab",
        "group"
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        maxWidth: `${style.maxWidth ?? 90}%`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Resize handles - visible on hover */}
      <div className="absolute -top-2 -left-2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 cursor-nw-resize border border-gray-400"
        onMouseDown={handleResizeMouseDown}
      />
      <div className="absolute -top-2 -right-2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 cursor-ne-resize border border-gray-400"
        onMouseDown={handleResizeMouseDown}
      />
      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 cursor-sw-resize border border-gray-400"
        onMouseDown={handleResizeMouseDown}
      />
      <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 cursor-se-resize border border-gray-400"
        onMouseDown={handleResizeMouseDown}
      />

      {/* Border on hover */}
      <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded opacity-0 group-hover:opacity-100 pointer-events-none" />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none resize-none text-center min-w-[100px]"
          style={captionStyle}
          rows={2}
        />
      ) : (
        <div style={captionStyle}>
          {text}
        </div>
      )}
    </div>
  );
}
