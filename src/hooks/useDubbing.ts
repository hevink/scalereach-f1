import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dubbingApi, type StartDubbingParams } from "@/lib/api/dubbing";

export function useDubbingsByVideo(videoId: string | undefined) {
  return useQuery({
    queryKey: ["dubbings", videoId],
    queryFn: () => dubbingApi.getDubbingsByVideo(videoId!),
    enabled: !!videoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasInProgress = data?.some(
        (d) =>
          d.status === "pending" ||
          d.status === "generating_tts" ||
          d.status === "mixing_audio"
      );
      return hasInProgress ? 3000 : false;
    },
  });
}

export function useDubbing(dubbingId: string | undefined) {
  return useQuery({
    queryKey: ["dubbings", "detail", dubbingId],
    queryFn: () => dubbingApi.getDubbing(dubbingId!),
    enabled: !!dubbingId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data?.status === "pending" ||
        data?.status === "generating_tts" ||
        data?.status === "mixing_audio"
      ) {
        return 3000;
      }
      return false;
    },
  });
}

export function useTTSVoices(provider?: string, language?: string) {
  return useQuery({
    queryKey: ["dubbing", "voices", provider, language],
    queryFn: () => dubbingApi.listVoices(provider, language),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useStartDubbing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      translationId,
      params,
    }: {
      translationId: string;
      videoId: string;
      params: StartDubbingParams;
    }) => dubbingApi.startDubbing(translationId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dubbings", variables.videoId],
      });
    },
  });
}

export function useDeleteDubbing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dubbingId,
    }: {
      dubbingId: string;
      videoId: string;
    }) => dubbingApi.deleteDubbing(dubbingId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dubbings", variables.videoId],
      });
    },
  });
}

export function useDubbingPreview(dubbingId: string | undefined) {
  return useQuery({
    queryKey: ["dubbings", "preview", dubbingId],
    queryFn: () => dubbingApi.getPreview(dubbingId!),
    enabled: !!dubbingId,
    staleTime: 30 * 60 * 1000, // 30 minutes (signed URLs last 1 hour)
  });
}

export function useClipDubbedAudio(
  clipId: string | undefined,
  dubbingId: string | undefined
) {
  return useQuery({
    queryKey: ["dubbings", "clip-audio", clipId, dubbingId],
    queryFn: () => dubbingApi.getClipAudio(clipId!, dubbingId!),
    enabled: !!clipId && !!dubbingId,
  });
}
