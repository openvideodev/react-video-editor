"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { codeToHtml } from "shiki";

interface ShikiEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  className?: string;
  placeholder?: string;
}

export const ShikiEditor = ({
  value,
  onChange,
  language = "glsl",
  theme = "vitesse-dark",
  className = "",
  placeholder = "",
}: ShikiEditorProps) => {
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const highlight = async () => {
      if (!value) {
        setHighlightedHtml("");
        return;
      }
      try {
        const html = await codeToHtml(value, {
          lang: language,
          theme: theme,
        });
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch {
        if (!cancelled) {
          const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          setHighlightedHtml(`<pre><code>${escaped}</code></pre>`);
        }
      }
    };
    highlight();
    return () => {
      cancelled = true;
    };
  }, [value, language, theme]);

  return (
    <div
      className={`shiki-editor-wrapper relative rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring ${className}`}
      style={{ minHeight: "16rem" }}
    >
      {/* Highlighting Layer */}
      <div
        ref={preRef}
        className="shiki-editor-highlight absolute inset-0 overflow-hidden pointer-events-none rounded-md"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />

      {/* Input Layer */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="shiki-editor-textarea absolute inset-0 w-full h-full resize-none bg-transparent text-transparent font-mono text-xs leading-relaxed p-4 outline-none rounded-md z-10"
        style={{
          caretColor: "white",
          WebkitTextFillColor: "transparent",
        }}
      />

      {!value && placeholder && (
        <div className="absolute inset-0 p-4 text-muted-foreground/40 font-mono text-xs pointer-events-none z-0">
          {placeholder}
        </div>
      )}

      <style>{`
        .shiki-editor-wrapper {
          position: relative;
          tab-size: 4;
          background-color: #1C160E;
        }
        .shiki-editor-highlight pre {
          margin: 0 !important;
          padding: 1rem !important; /* Matches textarea p-4 (1rem) */
          background: transparent !important;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace !important;
          font-size: 0.75rem !important; /* text-xs */
          line-height: 1.625 !important; /* leading-relaxed */
          overflow: hidden !important; /* Scroll controlled by parent div via preRef */
          white-space: pre !important; 
        }
        .shiki-editor-highlight code {
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
        }
        .shiki-editor-textarea {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
          line-height: 1.625;
          tab-size: 4;
          white-space: pre;
          overflow: auto;
        }
        .shiki-editor-textarea::placeholder {
          color: transparent;
        }
      `}</style>
    </div>
  );
};
