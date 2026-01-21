"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBriefcase,
  IconChevronLeft,
  IconChevronRight,
  IconMicrophone,
  IconMovie,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const SLUG_DEBOUNCE_MS = 300;

const ROLES = [
  { id: "creator", label: "Content Creator", icon: IconVideo },
  { id: "agency", label: "Marketing Agency", icon: IconBriefcase },
  { id: "social-manager", label: "Social Media Manager", icon: IconUsers },
  { id: "podcaster", label: "Podcaster", icon: IconMicrophone },
  { id: "other", label: "Other", icon: IconMovie },
] as const;

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: IconBrandTiktok, color: "hover:border-pink-500 hover:bg-pink-500/10" },
  { id: "youtube", label: "YouTube", icon: IconBrandYoutube, color: "hover:border-red-500 hover:bg-red-500/10" },
  { id: "instagram", label: "Instagram", icon: IconBrandInstagram, color: "hover:border-purple-500 hover:bg-purple-500/10" },
  { id: "linkedin", label: "LinkedIn", icon: IconBrandLinkedin, color: "hover:border-blue-500 hover:bg-blue-500/10" },
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
      }, 5000);
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
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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

    // First update user with role and platforms
    try {
      await userApi.updateCurrentUser({
        role: selectedRole || undefined,
        primaryPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      // Continue with workspace creation even if this fails
    }

    createWorkspaceMutation.mutate(
      {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description?.trim() || undefined,
      },
      {
        onSuccess: () => {
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
    if (currentStep === 7) {
      const timer = setTimeout(() => {
        router.push("/home");
        router.refresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, router]);

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
    const handleEnterKey = (event: KeyboardEvent) => {
      const isTextarea = event.target instanceof HTMLTextAreaElement;
      const hasModifiers = event.metaKey || event.ctrlKey;

      if (isTextarea && event.key === "Enter" && !hasModifiers) {
        return true;
      }

      if (
        hasModifiers &&
        event.key === "Enter" &&
        currentStep === 5 &&
        !isLoading
      ) {
        event.preventDefault();
        handleSubmit();
        return true;
      }

      if (
        event.key === "Enter" &&
        !hasModifiers &&
        !isTextarea &&
        (currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 6)
      ) {
        event.preventDefault();
        if (currentStep === 6) {
          handleSubmit();
        } else {
          handleNext();
        }
        return true;
      }

      return false;
    };

    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && currentStep > 1 && !isLoading) {
        event.preventDefault();
        handlePrev();
        return true;
      }

      if (event.key === "ArrowRight" && currentStep < 7 && !isLoading) {
        event.preventDefault();
        if (currentStep === 6) {
          handleSubmit();
        } else {
          handleNext();
        }
        return true;
      }

      return false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (handleEnterKey(event)) {
        return;
      }
      handleArrowKeys(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLoading, handleNext, handlePrev, handleSubmit]);

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <Image alt="Staxk" height={42} src="/logo.svg" width={42} />

        {/* Content */}
        <div className="relative flex min-h-[320px] w-full flex-col gap-6">
          {/* Step 1: Welcome */}
          <div
            className={`absolute inset-0 flex flex-col gap-2 transition-opacity duration-300 ${currentStep === 1
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <h1 className="font-medium text-xl">
              Welcome to Staxk
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Let's get you set up with your workspace.
            </p>
          </div>

          {/* Step 2: Role Selection */}
          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${currentStep === 2
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">What best describes you?</h1>
              <p className="text-muted-foreground text-sm">This helps us personalize your experience</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("size-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                      {role.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                {selectedRole ? "Continue" : "Skip"}
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Step 3: Workspace Name */}
          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${currentStep === 3
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                What would you like to name your workspace?
              </h1>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <Input
                id="name"
                {...form.register("name")}
                autoFocus={currentStep === 3}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Workspace"
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Step 4: Workspace Slug */}
          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${currentStep === 4
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                Choose a unique URL-friendly identifier for your workspace.
              </h1>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <div className="relative">
                <Input
                  id="slug"
                  {...form.register("slug")}
                  autoFocus={currentStep === 4}
                  className="pr-20"
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-workspace"
                />
                {checkingSlug && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <Spinner className="size-4" />
                  </div>
                )}
                {!checkingSlug && slugAvailable !== null && slug?.trim() && (
                  <div
                    className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs ${slugAvailable ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {slugAvailable ? "Available" : "Slug is not available"}
                  </div>
                )}
              </div>
              <FieldError>{form.formState.errors.slug?.message}</FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Step 5: Workspace Description */}
          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${currentStep === 5
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                Tell us a bit about your workspace.
              </h1>
              <p className="text-muted-foreground text-sm">(optional)</p>
            </div>
            <div className="flex flex-col gap-2">
              <Textarea
                id="description"
                {...form.register("description")}
                autoFocus={currentStep === 5}
                placeholder="A brief description of what this workspace is for..."
                rows={4}
              />
              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Step 6: Platform Selection */}
          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${currentStep === 6
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">Where do you post your clips?</h1>
              <p className="text-muted-foreground text-sm">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : `border-border ${platform.color}`
                    )}
                  >
                    <Icon className={cn(
                      "size-8",
                      isSelected ? "text-primary" : "text-muted-foreground",
                      platform.id === "tiktok" && isSelected && "text-pink-500",
                      platform.id === "youtube" && isSelected && "text-red-500",
                      platform.id === "instagram" && isSelected && "text-purple-500",
                      platform.id === "linkedin" && isSelected && "text-blue-500"
                    )} />
                    <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                      {platform.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                loading={isLoading}
                onClick={handleSubmit}
                type="button"
              >
                Create Workspace
              </Button>
            </div>
          </div>

          {/* Step 7: Success */}
          <div
            className={`absolute inset-0 flex flex-col gap-2 transition-opacity duration-300 ${currentStep === 7
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
              }`}
          >
            <h1 className="font-medium text-xl">You're all set up!</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
