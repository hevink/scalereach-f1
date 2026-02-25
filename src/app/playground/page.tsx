"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { SkeletonCard, SkeletonText, SkeletonVideoListItem, SkeletonVideoGridItem } from "@/components/ui/skeletons";
import { InfoIcon, XCircleIcon } from "lucide-react";
import { FireIcon } from "@/components/ui/fire-icon";

export default function PlaygroundPage() {
    const [progress, setProgress] = useState(60);
    const [switchOn, setSwitchOn] = useState(false);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto space-y-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-1">
                        <FireIcon /> Component Playground
                    </h1>
                    <p className="text-muted-foreground mt-1">A sandbox for all UI components in one place.</p>
                </div>

                <Separator />

                <Tabs defaultValue="basics">
                    <TabsList>
                        <TabsTrigger value="basics"><FireIcon /> Basics</TabsTrigger>
                        <TabsTrigger value="forms"><FireIcon /> Forms</TabsTrigger>
                        <TabsTrigger value="feedback"><FireIcon /> Feedback</TabsTrigger>
                        <TabsTrigger value="skeletons"><FireIcon /> Skeletons</TabsTrigger>
                    </TabsList>

                    {/* BASICS */}
                    <TabsContent value="basics" className="space-y-8 mt-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Buttons</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="link">Link</Button>
                                <Button disabled>Disabled</Button>
                                <Button size="sm">Small</Button>
                                <Button size="lg">Large</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Badges</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Badge>Default</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="destructive">Destructive</Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Avatars</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-4 items-center">
                                <Avatar>
                                    <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                                    <AvatarFallback>SC</AvatarFallback>
                                </Avatar>
                                <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
                                <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Spinner</CardTitle></CardHeader>
                            <CardContent className="flex gap-6 items-center">
                                <Spinner />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FORMS */}
                    <TabsContent value="forms" className="space-y-8 mt-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Inputs</CardTitle></CardHeader>
                            <CardContent className="space-y-4 max-w-sm">
                                <Input placeholder="Default input" />
                                <Input placeholder="Disabled input" disabled />
                                <Textarea placeholder="Textarea..." rows={3} />
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="a">Option A</SelectItem>
                                        <SelectItem value="b">Option B</SelectItem>
                                        <SelectItem value="c">Option C</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Controls</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Switch id="toggle" checked={switchOn} onCheckedChange={setSwitchOn} />
                                    <Label htmlFor="toggle">{switchOn ? "On" : "Off"}</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Checkboxes</Label>
                                    <div className="flex flex-col gap-2">
                                        {["Option 1", "Option 2", "Option 3"].map((opt) => (
                                            <div key={opt} className="flex items-center gap-2">
                                                <Checkbox id={opt} />
                                                <Label htmlFor={opt}>{opt}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Radio Group</Label>
                                    <RadioGroup defaultValue="r1">
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="r1" id="r1" />
                                            <Label htmlFor="r1">Radio 1</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="r2" id="r2" />
                                            <Label htmlFor="r2">Radio 2</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FEEDBACK */}
                    <TabsContent value="feedback" className="space-y-8 mt-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Alerts</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <InfoIcon className="h-4 w-4" />
                                    <AlertTitle>Info</AlertTitle>
                                    <AlertDescription>This is an informational alert.</AlertDescription>
                                </Alert>
                                <Alert variant="destructive">
                                    <XCircleIcon className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>Something went wrong.</AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Progress</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-sm">Progress: {progress}%</span>
                                    <Progress value={progress} className="max-w-sm" />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                                    <Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SKELETONS */}
                    <TabsContent value="skeletons" className="space-y-8 mt-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Skeleton Text</CardTitle></CardHeader>
                            <CardContent><SkeletonText lines={3} /></CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Skeleton Card</CardTitle></CardHeader>
                            <CardContent><SkeletonCard /></CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Skeleton Video List</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <SkeletonVideoListItem />
                                <SkeletonVideoListItem />
                                <SkeletonVideoListItem />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-1"><FireIcon /> Skeleton Video Grid</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <SkeletonVideoGridItem />
                                <SkeletonVideoGridItem />
                                <SkeletonVideoGridItem />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
