"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";

interface BinForMap {
  id: string;
  code: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

export function BinMap({ bins }: { bins: BinForMap[] }) {
  const [selected, setSelected] = useState<BinForMap | null>(null);

  const center =
    bins.length > 0
      ? { lat: bins[0]!.latitude, lng: bins[0]!.longitude }
      : { lat: -3.1019, lng: -60.025 };

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-[400px]">
      <Map
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 13,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" />
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            longitude={bin.longitude}
            latitude={bin.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(bin);
            }}
          >
            <div className="cursor-pointer rounded-full bg-primary text-primary-foreground p-2 shadow-lg hover:scale-110 transition-transform">
              <MapPin className="h-4 w-4" />
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            onClose={() => setSelected(null)}
            anchor="top"
            closeButton={true}
            closeOnClick={false}
            offset={[0, -10] as [number, number]}
          >
            <div className="space-y-1 p-1">
              <p className="font-display font-semibold text-sm">{selected.locationName}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selected.code}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
