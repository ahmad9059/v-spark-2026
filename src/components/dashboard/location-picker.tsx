"use client";

import { MapPin, Search, X } from "lucide-react";
import { useState } from "react";

import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/field";
import { env } from "~/env";
import { api } from "~/trpc/react";

export type Place = { name: string; address?: string; lat: number; lng: number };

export function MapPreview({ place }: { place: Place }) {
  const key = env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  if (!key) return null;
  return (
    <iframe
      title={`Map of ${place.name}`}
      className="h-40 w-full rounded-lg border border-gray-20"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${place.lat},${place.lng}&zoom=14`}
    />
  );
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: Place | null;
  onChange: (p: Place | null) => void;
}) {
  const [query, setQuery] = useState("");
  const search = api.places.search.useMutation();

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2 rounded-lg border border-gray-20 p-3">
          <div className="flex min-w-0 gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden />
            <div className="min-w-0">
              <p className="t-text-s truncate text-black">{value.name}</p>
              {value.address ? (
                <p className="t-text-xs text-gray-60">{value.address}</p>
              ) : null}
            </div>
          </div>
          <Button
            variant="tertiary-alt"
            size="small"
            iconOnly
            aria-label="Remove location"
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <MapPreview place={value} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 2) search.mutate({ query });
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place, e.g. Blue Bottle Coffee"
          aria-label="Search a place"
        />
        <Button type="submit" variant="secondary" isLoading={search.isPending} className="h-10">
          <Search className="size-4" /> Search
        </Button>
      </form>
      {search.error ? <Alert tone="danger">{search.error.message}</Alert> : null}
      {search.data?.length === 0 ? (
        <p className="t-text-xs text-gray-60">No places found. Try other words.</p>
      ) : null}
      {search.data && search.data.length > 0 ? (
        <ul className="divide-y divide-gray-20 rounded-lg border border-gray-20">
          {search.data.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-10"
                onClick={() => onChange({ name: p.name, address: p.address, lat: p.lat, lng: p.lng })}
              >
                <span className="t-text-s block text-black">{p.name}</span>
                <span className="t-text-xs block text-gray-60">{p.address}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
