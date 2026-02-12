"use client";

import { useState } from "react";
import { IconSelector } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ClipTypeTemplate {
    id: string;
    name: string;
    description: string;
}

const CLIP_TYPE_TEMPLATES: ClipTypeTemplate[] = [
    { id: "viral-clips", name: "Viral Clips", description: "For several high-impact short videos." },
    { id: "memorable-phrases", name: "Memorable Phrases", description: "Generate a clip with the most shareable quotes from your video." },
    { id: "topic-clips", name: "Topic Clips", description: "For multiple videos with main points." },
    { id: "trailer", name: "Trailer", description: "Create a summarized video featuring the most catchy phrases." },
    { id: "product-ads", name: "Product Ads", description: "Create a video ad for your product or service." },
    { id: "testimonial", name: "Testimonial", description: "Generate a video testimonial for your product or service." },
    { id: "instructions", name: "Instructions", description: "Produce a short, viral-ready tutorial clip from your DIY video." },
    { id: "product-features", name: "Product Features", description: "Provide an overview of product features in a single video." },
    { id: "positive-highlights", name: "Positive Highlights", description: "Highlight the positive aspects of the main topic in a single video." },
    { id: "negative-highlights", name: "Negative Highlights", description: "Present the negative aspects of the main topic in a single video." },
    { id: "showcase", name: "Showcase", description: "Highlight practical use cases that show the value of your product." },
    { id: "multi-product-recap", name: "Multi-Product Recap", description: "Present key features and benefits of multiple products in one clip." },
    { id: "speakers-insights", name: "Speaker's Insights", description: "Clip memorable or relatable opinions into short-form content." },
    { id: "jokes-memes", name: "Jokes, Memes and Funny Moments", description: "Turn the funniest moments into a short, entertaining video." },
    { id: "podcast-jokes", name: "Podcast Jokes and Memes", description: "For several clips with the funniest bits." },
];

interface ClipTypeSelectorProps {
    value: string;
    customPrompt: string;
    onChange: (value: string) => void;
    onCustomPromptChange: (value: string) => void;
    disabled?: boolean;
}

export function ClipTypeSelector({ value, customPrompt, onChange, onCustomPromptChange, disabled }: ClipTypeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<string>(customPrompt ? "custom" : "templates");
    const selected = CLIP_TYPE_TEMPLATES.find((t) => t.id === value);

    return (
        <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-3">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                        render={
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                aria-label="Select clip type"
                                disabled={disabled}
                                className="w-full justify-between h-auto min-h-10 py-2"
                            />
                        }
                    >
                        <div className="flex w-full items-center justify-between">
                            {selected ? (
                                <div className="min-w-0 text-left">
                                    <span className="text-sm font-medium block">{selected.name}</span>
                                    <span className="text-xs text-muted-foreground truncate block">{selected.description}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-sm">Select a clip type...</span>
                            )}
                            <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--anchor-width) min-w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search clip types..." />
                            <CommandList className="max-h-64">
                                <CommandEmpty>No clip type found.</CommandEmpty>
                                <CommandGroup>
                                    {CLIP_TYPE_TEMPLATES.map((template) => (
                                        <CommandItem
                                            key={template.id}
                                            value={template.name}
                                            data-checked={value === template.id}
                                            onSelect={() => {
                                                onChange(template.id);
                                                setOpen(false);
                                            }}
                                            className="data-[checked=true]:bg-muted"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-sm font-medium block">{template.name}</span>
                                                <span className="text-xs text-muted-foreground block">{template.description}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TabsContent>

            <TabsContent value="custom" className="mt-3">
                <Textarea
                    placeholder="Describe what kind of clips you want to generate..."
                    value={customPrompt}
                    onChange={(e) => onCustomPromptChange(e.target.value)}
                    disabled={disabled}
                    rows={3}
                    className="resize-none"
                />
            </TabsContent>
        </Tabs>
    );
}

export { CLIP_TYPE_TEMPLATES };
export type { ClipTypeTemplate };
