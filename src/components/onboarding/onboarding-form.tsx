"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBriefcase,
  IconCheck,
  IconChevronRight,
  IconMicrophone,
  IconMovie,
  IconSparkles,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { LogoIcon } from "@/components/ui/logo";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { useCreateWorkspace } from "@/hooks/useWorkspace";
import { workspaceApi, userApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// Platform SVG Icons from svgl.app
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 290" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M189.72 104.421C208.133 118.149 230.68 126.192 254.969 126.192V80.1375C250.902 80.1384 246.848 79.7359 242.869 78.9359V115.517C218.581 115.517 196.036 107.473 177.621 93.7462V197.471C177.621 249.357 136.21 291.14 84.8105 291.14C66.0053 291.14 48.4432 285.551 33.6211 275.876C50.5765 293.349 74.1744 304.015 100.409 304.015C151.808 304.015 193.22 262.232 193.22 210.346V106.621C211.635 120.348 234.18 128.392 258.469 128.392V91.8109C244.533 88.4851 231.865 81.4137 221.62 71.4297C210.677 60.7283 202.899 47.0227 199.261 31.9688H165.321V197.471C165.321 220.529 146.869 239.234 124.109 239.234C112.166 239.234 101.428 234.013 94.0391 225.699C79.1484 218.065 68.8008 202.676 68.8008 184.596C68.8008 158.835 89.5391 137.84 115.009 137.84C120.199 137.84 125.199 138.617 129.91 140.058V103.476C78.5117 104.476 37.0996 146.259 37.0996 198.146C37.0996 223.996 47.0996 247.471 63.3203 264.876C78.1426 274.551 95.7047 280.14 114.51 280.14C165.909 280.14 207.32 238.357 207.32 186.471V104.421H189.72Z" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 180" xmlns="http://www.w3.org/2000/svg">
      <path d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z" fill="#FF0000" />
      <path fill="#FFF" d="m102.421 128.06 66.328-38.418-66.328-38.418z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-gradient" cx="25%" cy="105%" r="150%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="10%" stopColor="#FFDD55" />
          <stop offset="50%" stopColor="#FF543E" />
          <stop offset="100%" stopColor="#C837AB" />
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#ig-gradient)" />
      <circle cx="128" cy="128" r="44" fill="none" stroke="#FFF" strokeWidth="16" />
      <circle cx="196" cy="60" r="14" fill="#FFF" />
      <rect x="40" y="40" width="176" height="176" rx="40" fill="none" stroke="#FFF" strokeWidth="16" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="28" fill="#0A66C2" />
      <path d="M73.5 200.5h-34v-108h34v108zm-17-122.5c-10.9 0-19.5-8.7-19.5-19.5S45.6 39 56.5 39 76 47.7 76 58.5 67.4 78 56.5 78zm143.5 122.5h-34v-52.5c0-12.5-.2-28.6-17.4-28.6-17.4 0-20.1 13.6-20.1 27.7v53.4h-34v-108h32.6v14.7h.5c4.5-8.6 15.6-17.7 32.1-17.7 34.4 0 40.7 22.6 40.7 52v59h-.4z" fill="#FFF" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="128" fill="#FF4500" />
      <path d="M213.15 129.22c0-10.376-8.391-18.617-18.617-18.617a18.74 18.74 0 0 0-12.97 5.189c-12.818-9.157-30.368-15.107-49.9-15.87l8.544-39.981 27.773 5.95c.307 7.02 6.104 12.667 13.278 12.667 7.324 0 13.275-5.95 13.275-13.278 0-7.324-5.95-13.275-13.275-13.275-5.188 0-9.768 3.052-11.904 7.478l-30.976-6.56c-.916-.154-1.832 0-2.443.458-.763.458-1.22 1.22-1.371 2.136l-9.464 44.558c-19.837.612-37.692 6.56-50.662 15.872a18.74 18.74 0 0 0-12.971-5.188c-10.377 0-18.617 8.391-18.617 18.617 0 7.629 4.577 14.037 10.988 16.939a33.598 33.598 0 0 0-.458 5.646c0 28.686 33.42 52.036 74.621 52.036 41.202 0 74.622-23.196 74.622-52.036a35.29 35.29 0 0 0-.458-5.646c6.408-2.902 10.985-9.464 10.985-17.093zM85.272 142.495c0-7.324 5.95-13.275 13.278-13.275 7.324 0 13.275 5.95 13.275 13.275s-5.95 13.278-13.275 13.278c-7.327.15-13.278-5.953-13.278-13.278zm74.317 35.251c-9.156 9.157-26.553 9.768-31.588 9.768-5.188 0-22.584-.765-31.59-9.768-1.371-1.373-1.371-3.51 0-4.883 1.374-1.371 3.51-1.371 4.884 0 5.8 5.8 18.008 7.782 26.706 7.782 8.699 0 21.058-1.983 26.704-7.782 1.374-1.371 3.51-1.371 4.884 0 1.22 1.373 1.22 3.51 0 4.883zm-2.443-21.822c-7.325 0-13.275-5.95-13.275-13.278s5.95-13.275 13.275-13.275c7.327 0 13.277 5.95 13.277 13.275 0 7.17-5.95 13.278-13.277 13.278z" fill="#FFF" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="28" fill="#1877F2" />
      <path d="M186.2 138.1l5.3-34.6h-33.2V82.8c0-9.5 4.6-18.7 19.5-18.7h15.1V34.2s-13.7-2.3-26.8-2.3c-27.4 0-45.3 16.6-45.3 46.6v26.4H88.4v34.6h32.4v83.6c6.5 1 13.2 1.5 19.9 1.5s13.4-.5 19.9-1.5v-83.6h25.6z" fill="#FFF" />
    </svg>
  );
}

function FriendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OtherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const SLUG_DEBOUNCE_MS = 300;
const TOTAL_STEPS = 6;

const ROLES = [
  { id: "creator", label: "Content Creator", icon: IconVideo },
  { id: "agency", label: "Marketing Agency", icon: IconBriefcase },
  { id: "social-manager", label: "Social Media Manager", icon: IconUsers },
  { id: "podcaster", label: "Podcaster", icon: IconMicrophone },
  { id: "other", label: "Other", icon: IconMovie },
] as const;

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: TikTokIcon, selectedBorder: "border-[#ff0050]", selectedBg: "bg-[#ff0050]/10" },
  { id: "youtube", label: "YouTube", icon: YouTubeIcon, selectedBorder: "border-[#FF0000]", selectedBg: "bg-[#FF0000]/10" },
  { id: "instagram", label: "Instagram", icon: InstagramIcon, selectedBorder: "border-[#E4405F]", selectedBg: "bg-[#E4405F]/10" },
  { id: "linkedin", label: "LinkedIn", icon: LinkedInIcon, selectedBorder: "border-[#0A66C2]", selectedBg: "bg-[#0A66C2]/10" },
  { id: "facebook", label: "Facebook", icon: FacebookIcon, selectedBorder: "border-[#1877F2]", selectedBg: "bg-[#1877F2]/10" },
  { id: "reddit", label: "Reddit", icon: RedditIcon, selectedBorder: "border-[#FF4500]", selectedBg: "bg-[#FF4500]/10" },
] as const;

const onboardingSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters`)
    .regex(
      SLUG_REGEX,
      "Slug can only contain letters, numbers, hyphens, and underscores"
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
  role: z.string().optional(),
  primaryPlatforms: z.array(z.string()).optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const nameSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
});

const slugSchema = z.object({
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters`)
    .regex(
      SLUG_REGEX,
      "Slug can only contain letters, numbers, hyphens, and underscores"
    ),
});

const descriptionSchema = z.object({
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  // Don't show on welcome (1) or success (7) steps
  if (currentStep === 1 || currentStep === 7) return null;

  const adjustedCurrent = currentStep - 1; // Adjust for welcome step
  const adjustedTotal = totalSteps;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: adjustedTotal }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i + 1 === adjustedCurrent
              ? "w-6 bg-primary"
              : i + 1 < adjustedCurrent
                ? "w-1.5 bg-primary/60"
                : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const slugManuallyEditedRef = useRef<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [createdWorkspaceSlug, setCreatedWorkspaceSlug] = useState<string | null>(null);

  const createWorkspaceMutation = useCreateWorkspace();
  const isLoading = createWorkspaceMutation.isPending;

  const user = session?.user;

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      role: "",
      primaryPlatforms: [],
    },
    mode: "onChange",
  });

  const slug = form.watch("slug");

  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => {
        setCurrentStep(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 4) {
      return;
    }

    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }

    const trimmedSlug = slug?.trim().toLowerCase();
    if (!trimmedSlug || trimmedSlug.length < MIN_SLUG_LENGTH) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    if (!SLUG_REGEX.test(trimmedSlug) || trimmedSlug.length > MAX_SLUG_LENGTH) {
      setSlugAvailable(false);
      setCheckingSlug(false);
      return;
    }

    setCheckingSlug(true);
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const data = await workspaceApi.checkSlug(trimmedSlug);
        setSlugAvailable(data?.available ?? false);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, SLUG_DEBOUNCE_MS);

    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, [slug, currentStep]);

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      let schema:
        | typeof nameSchema
        | typeof slugSchema
        | typeof descriptionSchema;
      if (step === 3) {
        schema = nameSchema;
      } else if (step === 4) {
        schema = slugSchema;
      } else if (step === 5) {
        schema = descriptionSchema;
      } else {
        return true;
      }

      const result = await form.trigger(
        Object.keys(schema.shape) as Array<keyof OnboardingFormData>
      );
      return result;
    },
    [form]
  );

  const validateSlugAvailability = useCallback((): boolean => {
    if (slugAvailable === false) {
      toast.error("Workspace slug is not available");
      return false;
    }
    if (slugAvailable === null && slug?.trim()) {
      toast.error("Please wait for slug availability check");
      return false;
    }
    return true;
  }, [slugAvailable, slug]);

  const handleNext = useCallback(async () => {
    if (currentStep === 7) {
      return;
    }

    if (currentStep === 4) {
      const isValid = await validateStep(4);
      if (!isValid) {
        return;
      }
      if (!validateSlugAvailability()) {
        return;
      }
    } else if (currentStep === 3 || currentStep === 5) {
      const isValid = await validateStep(currentStep);
      if (!isValid) {
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 7));
  }, [currentStep, validateStep, validateSlugAvailability]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 2));
  }, []);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    form.setValue("role", roleId);
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const newPlatforms = prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId];
      form.setValue("primaryPlatforms", newPlatforms);
      return newPlatforms;
    });
  };

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger(["name", "slug", "description"]);
    if (!isValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    if (!validateSlugAvailability()) {
      return;
    }

    const formData = form.getValues();

    try {
      await userApi.updateCurrentUser({
        role: selectedRole || undefined,
        primaryPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
    }

    createWorkspaceMutation.mutate(
      {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description?.trim() || undefined,
      },
      {
        onSuccess: async () => {
          // Store the workspace slug for redirect
          setCreatedWorkspaceSlug(formData.slug.trim().toLowerCase());
          // Mark user as onboarded
          try {
            await userApi.completeOnboarding();
          } catch (error) {
            console.error("Error completing onboarding:", error);
          }
          setCurrentStep(7);
        },
        onError: (error: any) => {
          console.error("Error creating workspace:", error);
          toast.error(error.message || "Failed to create workspace");
        },
      }
    );
  }, [form, validateSlugAvailability, createWorkspaceMutation, selectedRole, selectedPlatforms]);

  useEffect(() => {
    if (currentStep === 7 && createdWorkspaceSlug) {
      const timer = setTimeout(() => {
        router.push(`/${createdWorkspaceSlug}`);
        router.refresh();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, router, createdWorkspaceSlug]);

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_SLUG_LENGTH);
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (currentStep === 3 && !slugManuallyEditedRef.current) {
      const autoSlug = generateSlugFromName(value);
      if (autoSlug.length >= MIN_SLUG_LENGTH) {
        form.setValue("slug", autoSlug);
      } else {
        form.setValue("slug", "");
      }
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", value);
    slugManuallyEditedRef.current = true;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTextarea = event.target instanceof HTMLTextAreaElement;
      const hasModifiers = event.metaKey || event.ctrlKey;

      if (isTextarea && event.key === "Enter" && !hasModifiers) {
        return;
      }

      if (event.key === "Enter" && !isLoading) {
        event.preventDefault();
        if (currentStep === 6) {
          handleSubmit();
        } else if (currentStep >= 2 && currentStep < 7) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLoading, handleNext, handleSubmit]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-8 px-4">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4">
          <LogoIcon size={48} />
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Content */}
      <div className="relative min-h-[400px]">
        {/* Step 1: Welcome */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-4 text-center transition-all duration-500",
            currentStep === 1
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary text-sm">
            <IconSparkles className="size-4" />
            <span>Let's get started</span>
          </div>
          <h1 className="font-semibold text-3xl tracking-tight">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="max-w-sm text-muted-foreground">
            We'll help you set up your workspace in just a few steps.
          </p>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground/60 text-sm">
            <Spinner className="size-4" />
            <span>Setting things up...</span>
          </div>
        </div>

        {/* Step 2: Role Selection */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col gap-6 transition-all duration-500",
            currentStep === 2
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">What best describes you?</h1>
            <p className="text-muted-foreground text-sm">This helps us personalize your experience</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn(
                    "size-5 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className={cn(
                    "font-medium text-sm whitespace-nowrap transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleNext}
            size="lg"
            type="button"
          >
            {selectedRole ? "Continue" : "Skip for now"}
            <IconChevronRight className="size-4" />
          </Button>
        </div>

        {/* Step 3: Workspace Name */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col gap-6 transition-all duration-500",
            currentStep === 3
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">Name your workspace</h1>
            <p className="text-muted-foreground text-sm">This is where you'll manage all your content</p>
          </div>

          <div className="space-y-2">
            <Input
              id="name"
              {...form.register("name")}
              autoFocus={currentStep === 3}
              className="h-12 text-base"
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Workspace"
            />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handlePrev}
              size="lg"
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handleNext}
              size="lg"
              type="button"
            >
              Continue
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Step 4: Workspace Slug */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col gap-6 transition-all duration-500",
            currentStep === 4
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">Choose your URL</h1>
            <p className="text-muted-foreground text-sm">This will be your workspace's unique address</p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground text-sm">
                app.scalereach.ai/
              </div>
              <Input
                id="slug"
                {...form.register("slug")}
                autoFocus={currentStep === 4}
                className="h-12 pl-[136px] pr-24 text-base"
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-workspace"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {checkingSlug && <Spinner className="size-4" />}
                {!checkingSlug && slugAvailable !== null && slug?.trim() && (
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    slugAvailable ? "text-green-500" : "text-destructive"
                  )}>
                    {slugAvailable ? (
                      <>
                        <IconCheck className="size-3" />
                        Available
                      </>
                    ) : (
                      "Not available"
                    )}
                  </span>
                )}
              </div>
            </div>
            <FieldError>{form.formState.errors.slug?.message}</FieldError>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handlePrev}
              size="lg"
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading || slugAvailable === false}
              onClick={handleNext}
              size="lg"
              type="button"
            >
              Continue
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Step 5: Workspace Description */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col gap-6 transition-all duration-500",
            currentStep === 5
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">Describe your workspace</h1>
            <p className="text-muted-foreground text-sm">Optional, but helps your team understand its purpose</p>
          </div>

          <div className="space-y-2">
            <Textarea
              id="description"
              {...form.register("description")}
              autoFocus={currentStep === 5}
              className="min-h-[120px] resize-none text-base"
              placeholder="A brief description of what this workspace is for..."
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handlePrev}
              size="lg"
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handleNext}
              size="lg"
              type="button"
            >
              Continue
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Step 6: Platform Selection */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col gap-6 transition-all duration-500",
            currentStep === 6
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">Where do you share content?</h1>
            <p className="text-muted-foreground text-sm">Select all platforms you use</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-full border px-5 py-3 transition-all duration-200",
                    isSelected
                      ? `${platform.selectedBorder} ${platform.selectedBg}`
                      : "border-border bg-background hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="font-medium text-sm whitespace-nowrap">
                    {platform.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handlePrev}
              size="lg"
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              loading={isLoading}
              onClick={handleSubmit}
              size="lg"
              type="button"
            >
              Create Workspace
            </Button>
          </div>
        </div>

        {/* Step 7: Success */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-6 text-center transition-all duration-500",
            currentStep === 7
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0"
          )}
        >
          <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
            <IconCheck className="size-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">You're all set!</h1>
            <p className="text-muted-foreground">Your workspace is ready. Redirecting you now...</p>
          </div>
          <Spinner className="size-5" />
        </div>
      </div>
    </div>
  );
}
