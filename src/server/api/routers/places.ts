import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

type PlacesResponse = {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
  }>;
  error?: { message?: string };
};

export const placesRouter = createTRPCRouter({
  search: protectedProcedure
    .input(z.object({ query: z.string().trim().min(2).max(120) }))
    .mutation(async ({ input }) => {
      if (!env.GOOGLE_MAPS_API_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Maps is not set up. Add GOOGLE_MAPS_API_KEY.",
        });
      }

      let res: Response;
      try {
        res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify({ textQuery: input.query, pageSize: 5 }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new TRPCError({ code: "TIMEOUT", message: "Maps took too long. Try again." });
      }

      const data = (await res.json().catch(() => ({}))) as PlacesResponse;
      if (!res.ok) {
        console.error("Places error", res.status, data.error?.message);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            res.status === 403 || res.status === 400
              ? "Maps rejected the request. Check the key and that Places API (New) is on."
              : "Maps had a problem. Try again.",
        });
      }

      return (data.places ?? [])
        .filter((p) => p.location)
        .map((p) => ({
          id: p.id,
          name: p.displayName?.text ?? input.query,
          address: p.formattedAddress ?? "",
          lat: p.location!.latitude,
          lng: p.location!.longitude,
        }));
    }),
});
