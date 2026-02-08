import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { translationsApi } from "@/lib/api/translations";

export function useTranslations(videoId: string | undefined) {
  return useQuery({
    queryKey: ["translations", videoId],
    queryFn: () => translationsApi.getTranslations(videoId!),
    enabled: !!videoId,
    refetchInterval: (query) => {
      // Poll while any translation is in progress
      const data = query.state.data;
      const hasInProgress = data?.some(
        (t) => t.status === "pending" || t.status === "translating"
      );
      return hasInProgress ? 3000 : false;
    },
  });
}

export function useTranslation(videoId: string | undefined, language: string | undefined) {
  return useQuery({
    queryKey: ["translations", videoId, language],
    queryFn: () => translationsApi.getTranslation(videoId!, language!),
    enabled: !!videoId && !!language,
  });
}

export function useSupportedLanguages() {
  return useQuery({
    queryKey: ["translations", "languages"],
    queryFn: () => translationsApi.getSupportedLanguages(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — languages don't change
  });
}

export function useStartTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      videoId,
      targetLanguage,
    }: {
      videoId: string;
      targetLanguage: string;
    }) => translationsApi.startTranslation(videoId, targetLanguage),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["translations", variables.videoId],
      });
    },
  });
}

export function useDeleteTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      translationId,
      videoId,
    }: {
      translationId: string;
      videoId: string;
    }) => translationsApi.deleteTranslation(translationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["translations", variables.videoId],
      });
    },
  });
}

export function useTranslatedCaptions(
  clipId: string | undefined,
  language: string | undefined
) {
  return useQuery({
    queryKey: ["translations", "captions", clipId, language],
    queryFn: () => translationsApi.getTranslatedCaptions(clipId!, language!),
    enabled: !!clipId && !!language,
  });
}

export function useClipTranslationLanguages(clipId: string | undefined) {
  return useQuery({
    queryKey: ["translations", "clip-languages", clipId],
    queryFn: () => translationsApi.getClipTranslationLanguages(clipId!),
    enabled: !!clipId,
  });
}
