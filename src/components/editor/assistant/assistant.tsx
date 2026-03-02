'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUpIcon, Wand2, MessageCircle, SparkleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio-store';
import { Studio } from 'openvideo';
import { streamFlow } from '@genkit-ai/next/client';
import * as ToolHandlers from './tools';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaybackStore } from '@/stores/playback-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { IClip } from '@/types/timeline';
import { chatFlow } from '@/genkit/chat-flow';
import { ImportAsset } from '@/genkit/type';
import { Icons } from '@/components/shared/icons';

interface Message {
  role: 'user' | 'model';
  content: string;
  status?: string;
}

interface Suggestion {
  icon?: React.ReactNode;
  text: string;
}

const SUGGESTIONS: Suggestion[] = [
  { text: 'Search and add futurist city video' },
  { text: 'Generate voiceover "Welcome"' },
  { text: 'Auto-caption video' },
  { text: 'Make text yellow and bigger' },
];

export default function Assistant() {
  const { studio } = useStudioStore();
  const { clips, selectedClipIds, getClip, tracks } = useTimelineStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mapClipsToAssets = useCallback(
    (clipArray: IClip[]): ImportAsset[] => {
      return clipArray.map((clip) => {
        const track = tracks.find((t) => t.clipIds.includes(clip.id));
        const trackId = track ? track.id : `unknown_track`;

        const assetType = clip.type.toLowerCase();
        const textContent =
          clip.text || (clip as any)._text || clip.caption?.text || '';

        return {
          assetId: clip.id,
          type: 'import',
          assetType: assetType === 'caption' ? 'text' : assetType,
          text: textContent,
          url: clip.src || '',
          label: clip.name || `Clip ${clip.id}`,
          trackId,
          display: {
            from: clip.display.from / 1000,
            to: clip.display.to / 1000,
          },
          trim: clip.trim
            ? {
              from: clip.trim.from / 1000,
              to: clip.trim.to / 1000,
            }
            : undefined,
        };
      });
    },
    [tracks]
  );

  const existingAssets = useMemo(
    () => mapClipsToAssets(Object.values(clips)),
    [clips, mapClipsToAssets]
  );
  const selectedAssets = useMemo(() => {
    const selectedClips = selectedClipIds
      .map(getClip)
      .filter(Boolean) as IClip[];
    return mapClipsToAssets(selectedClips);
  }, [selectedClipIds, getClip, mapClipsToAssets]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        const scrollElement = scrollRef.current?.closest(
          '[data-radix-scroll-area-viewport]'
        );
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  const handleSubmit = async (suggestionText?: string) => {
    const messageText = suggestionText || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    const assistantMessage: Message = {
      role: 'model',
      content: '',
      status: 'running',
    };
    setMessages((prev) => [...prev, assistantMessage]);
    try {
      const flow = streamFlow<typeof chatFlow>({
        url: '/api/chat/editor',
        input: {
          message: messageText,
          metadata: {
            existingAssets,
            selectedAssets,
            currentTime: usePlaybackStore.getState().currentTime / 1000,
          },
        },
      });

      for await (const chunkStr of flow.stream) {
        const chunk = JSON.parse(chunkStr);

        if (chunk.event === 'reasoning') {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            // We could show reasoning in a special way, for now let's just mark it's thinking
            return [...prev.slice(0, -1), { ...last, status: 'thinking' }];
          });
        }

        if (chunk.event === 'tool') {
          console.log('Tool call from flow:', chunk, chunk.name, chunk.arg);
          if (studio) {
            handleToolAction(
              { action: chunk.name, ...chunk.arg, ...chunk.response },
              studio
            );
          }
        }
      }

      const result = await flow.output;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'model', content: result.reply, status: 'complete' },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'model', content: 'Something went wrong.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolAction = async (input: any, studio: Studio) => {
    console.log('handleToolAction', input);
    const { action } = input;

    try {
      switch (action) {
        case 'add_clip':
        case 'add_text':
        case 'add_image':
        case 'add_video':
        case 'add_audio':
          await ToolHandlers.handleAddClip(input, studio);
          break;
        case 'update_clip':
        case 'update_asset':
          await ToolHandlers.handleUpdateClip(input, studio);
          break;
        case 'remove_clip':
        case 'delete_asset':
          await ToolHandlers.handleRemoveClip(input, studio);
          break;
        case 'split_clip':
        case 'split_asset':
          await ToolHandlers.handleSplitClip(input, studio);
          break;
        case 'add_transition':
          await ToolHandlers.handleAddTransition(input, studio);
          break;
        case 'add_effect':
        case 'apply_effect':
          await ToolHandlers.handleAddEffect(input, studio);
          break;
        case 'trim_clip':
        case 'trim_asset':
          await ToolHandlers.handleTrimClip(input, studio);
          break;
        case 'duplicate_clip':
        case 'duplicate_asset':
          await ToolHandlers.handleDuplicateClip(input, studio);
          break;
        case 'search_and_add_media':
          await ToolHandlers.handleSearchAndAddMedia(input, studio);
          break;
        case 'generate_voiceover':
          await ToolHandlers.handleGenerateVoiceover(input, studio);
          break;
        case 'seek_to_time':
          await ToolHandlers.handleSeekToTime(input, studio);
          break;
        case 'generate_captions':
          await ToolHandlers.handleGenerateCaptions(input, studio);
          break;
        default:
          console.log('Unhandled tool action:', action);
      }
    } catch (err) {
      console.error(`Failed to execute tool action: ${action}`, err);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.text);
  };

  return (
    <div className="flex flex-col h-full bg-card text-foreground text-sm overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 h-full">
        <div
          ref={scrollRef}
          className="h-full  overflow-x-hidden p-4 md:p-6 space-y-2"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 h-full flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center justify-center w-16 h-16">
                <Icons.sparkle className="w-12 h-12 text-muted-foreground/90" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  I'm ILO, your AI assistant
                </h2>
                <p className="text-muted-foreground">
                  What can I help you with?
                </p>
              </div>

              <div className="w-full max-w-md space-y-3">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors text-left group"
                  >
                    <span className="text-sm">{suggestion.text}</span>
                    <ArrowUpIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-4 w-full group animate-in fade-in slide-in-from-bottom-2 duration-300',
                    m.role === 'user'
                      ? 'flex-row-reverse'
                      : 'flex-row max-w-[90%]'
                  )}
                >
                  <div
                    className={cn(
                      'flex flex-col space-y-3 w-full min-w-0',
                      m.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-sm transition-all min-w-0 flex flex-col',
                        m.role === 'user'
                          ? 'bg-foreground/10 rounded-tr-none font-medium px-5'
                          : 'bg-card text-card-foreground rounded-tl-none w-full px-5'
                      )}
                    >
                      <div className="w-full grid overflow-hidden">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ className, ...props }) => (
                              <h1
                                className={cn(
                                  'scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            h2: ({ className, ...props }) => (
                              <h2
                                className={cn(
                                  'mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            h3: ({ className, ...props }) => (
                              <h3
                                className={cn(
                                  'mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            p: ({ className, ...props }) => (
                              <p
                                className={cn(
                                  'leading-7 not-first:mt-6',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            ul: ({ className, ...props }) => (
                              <ul
                                className={cn(
                                  'my-6 ml-6 list-disc [&>li]:mt-2',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            ol: ({ className, ...props }) => (
                              <ol
                                className={cn(
                                  'my-6 ml-6 list-decimal [&>li]:mt-2',
                                  className
                                )}
                                {...props}
                              />
                            ),
                            code: ({ className, children, ...props }) => {
                              const isInline =
                                !className?.includes('language-');
                              return (
                                <code
                                  className={cn(
                                    isInline &&
                                    'bg-muted px-1.5 py-0.5 rounded font-mono text-sm',
                                    className
                                  )}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ className, ...props }) => (
                              <pre
                                className={cn(
                                  'overflow-x-auto rounded-lg bg-black p-4 text-white my-4',
                                  className
                                )}
                                {...props}
                              />
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 w-full group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col space-y-3 w-full min-w-0 items-start">
                    <div className="py-0 px-5 rounded-3xl text-[15px] leading-relaxed shadow-sm bg-card text-card-foreground rounded-tl-none w-fit">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                        </div>
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                          Thinking
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 md:p-2 space-y-4 shrink-0">
        <InputGroup className="rounded-sm">
          <InputGroupTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Co-Creator"
            className="min-h-16 max-h-[200px]"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              variant="ghost"
              className="rounded-lg"
              onClick={() => setShowSuggestions(!showSuggestions)}
              disabled={isLoading}
            >
              <Wand2 className="w-4 h-4" />
              <span className="ml-1 text-xs">Suggestions</span>
            </InputGroupButton>
            <InputGroupButton
              variant="default"
              className="rounded-full ml-auto bg-foreground hover:bg-foreground/90 text-background"
              size="icon-xs"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
            >
              <ArrowUpIcon className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
