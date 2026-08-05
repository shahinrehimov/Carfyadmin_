import React, { useEffect, useRef, useState } from "react";
import { X, MapPin, LocateFixed, Loader2, Search } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn, useTranslation } from "@/lib/utils";

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (position: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size multiple times to ensure proper rendering
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [map]);

  return null;
}

// Flies the map to a target position, used to recenter the map when the
// user selects their current location via the browser geolocation API.
function MapFlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return null;
}

interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

async function searchLocations(query: string): Promise<NominatimSearchResult[]> {
  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "5",
    addressdetails: "1",
    countrycodes: "az",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { "Accept-Language": "az,en" } },
  );
  if (!response.ok) {
    throw new Error("Search request failed");
  }
  return response.json();
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 40.4093, // Baku, Azerbaijan
  initialLng = 49.8671,
  title = "Select Location",
}) => {
  const [position, setPosition] = useState<[number, number]>([
    initialLat,
    initialLng,
  ]);
  const [address, setAddress] = useState<string>("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [recenterTarget, setRecenterTarget] = useState<
    [number, number] | null
  >(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const locationWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const geolocationWatchIdRef = useRef<number | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);
  const skipSearchRef = useRef(false);
  const { t } = useTranslation();

  // Some browsers (notably Chrome on macOS when system Location Services
  // are disabled) never invoke either callback of getCurrentPosition and
  // ignore the native `timeout` option, leaving the button stuck loading
  // forever. This watchdog force-stops the loading state as a safety net.
  useEffect(() => {
    return () => {
      if (locationWatchdogRef.current) {
        clearTimeout(locationWatchdogRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (geolocationWatchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      const requestId = ++searchRequestIdRef.current;
      setIsSearching(true);
      setSearchError("");

      try {
        const results = await searchLocations(query);
        if (requestId !== searchRequestIdRef.current) {
          return;
        }
        if (results.length === 0) {
          setSearchResults([]);
          setSearchError(
            t("no_search_results", "No locations found for this search."),
          );
        } else {
          setSearchResults(results);
          setSearchError("");
        }
      } catch (error) {
        if (requestId !== searchRequestIdRef.current) {
          return;
        }
        console.error("Location search error:", error);
        setSearchResults([]);
        setSearchError(
          t(
            "search_failed",
            "Could not search for this address. Please try again.",
          ),
        );
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, t]);

  // Ensure map only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset client state when modal opens to force re-render
  useEffect(() => {
    if (isOpen) {
      setIsClient(false);
      const timer = setTimeout(() => {
        setIsClient(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPosition([initialLat, initialLng]);
    }
  }, [isOpen, initialLat, initialLng]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Fetch address from coordinates using Nominatim (OpenStreetMap)
  useEffect(() => {
    if (position) {
      setIsLoadingAddress(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&zoom=18&addressdetails=1`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch((err) => console.error("Error fetching address:", err))
        .finally(() => setIsLoadingAddress(false));
    }
  }, [position]);

  const handleConfirm = () => {
    onSelectLocation(position[0], position[1], address);
    onClose();
  };

  const clearLocationWatchdog = () => {
    if (locationWatchdogRef.current) {
      clearTimeout(locationWatchdogRef.current);
      locationWatchdogRef.current = null;
    }
  };

  const stopGeolocationWatch = () => {
    if (geolocationWatchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
      geolocationWatchIdRef.current = null;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        t(
          "geolocation_not_supported",
          "Your browser does not support geolocation.",
        ),
      );
      return;
    }

    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setLocationError(
        t(
          "geolocation_requires_https",
          "Detecting your location requires a secure (HTTPS) connection.",
        ),
      );
      return;
    }

    stopGeolocationWatch();
    clearLocationWatchdog();

    setIsLocating(true);
    setLocationError("");

    let settled = false;
    let sawPermissionDenied = false;

    const finishSuccess = (pos: GeolocationPosition) => {
      if (settled) {
        return;
      }
      settled = true;
      stopGeolocationWatch();
      clearLocationWatchdog();
      setLocationError("");

      const coords: [number, number] = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];
      setPosition(coords);
      setRecenterTarget(coords);
      setIsLocating(false);
    };

    const finishError = (error: Pick<GeolocationPositionError, "code">) => {
      if (settled) {
        return;
      }
      settled = true;
      stopGeolocationWatch();
      clearLocationWatchdog();
      setIsLocating(false);

      if (error.code === 1) {
        setLocationError(
          t(
            "location_permission_denied",
            "Location access was denied. Please allow location access in your browser settings and try again.",
          ),
        );
        return;
      }

      if (error.code !== 3) {
        console.error("Geolocation error:", error);
      }

      setLocationError(
        error.code === 3
          ? t(
              "location_timeout",
              "Couldn't get your location. Make sure Location Services are enabled for your browser in your system settings, then try again.",
            )
          : t(
              "location_unavailable",
              "Unable to determine your current location. Make sure Location Services are enabled on your device.",
            ),
      );
    };

    locationWatchdogRef.current = setTimeout(() => {
      locationWatchdogRef.current = null;
      finishError({ code: sawPermissionDenied ? 1 : 3 });
    }, 30000);

    geolocationWatchIdRef.current = navigator.geolocation.watchPosition(
      finishSuccess,
      (error) => {
        if (error.code === 1) {
          sawPermissionDenied = true;
          return;
        }
        finishError(error);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );

    navigator.geolocation.getCurrentPosition(
      finishSuccess,
      (error) => {
        if (error.code === 1) {
          sawPermissionDenied = true;
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSelectSearchResult = (result: NominatimSearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    skipSearchRef.current = true;
    searchRequestIdRef.current += 1;

    setPosition([lat, lng]);
    setRecenterTarget([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name?.split(",")[0] || searchQuery);
    setSearchError("");
    setIsSearching(false);
    if (result.display_name) {
      setAddress(result.display_name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-lg border shadow-lg",
          "border-border bg-card",
          "h-full w-full md:mx-4 md:h-auto md:max-h-[90vh] md:max-w-3xl",
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between border-b p-4")}>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map Container */}
        <div
          className="relative flex-1 overflow-visible"
          style={{ minHeight: "400px", height: "500px" }}
        >
          {!isClient ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-sm text-muted-foreground">
                {t("loading_map")}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <MapContainer
              center={position}
              zoom={13}
              style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                inset: 0,
              }}
              zoomControl={true}
              scrollWheelZoom={true}
              key={`map-${initialLat}-${initialLng}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapResizer />
              <MapFlyTo target={recenterTarget} />
            </MapContainer>
            </div>
          )}

          {isClient && (
            <>
              <form
                onSubmit={handleSearchSubmit}
                className="absolute left-3 top-3 right-14 z-1001"
              >
                <div className="flex overflow-hidden rounded-md border border-border bg-card shadow-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("search_location", "Search address...")}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center justify-center border-l border-border px-2.5 text-muted-foreground">
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {(searchResults.length > 0 ||
                  (isSearching && searchQuery.trim().length >= 3)) && (
                  <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                    {isSearching && searchResults.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">
                        {t("searching", "Searching...")}
                      </li>
                    ) : (
                      searchResults.map((result) => (
                        <li key={result.place_id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            {result.display_name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </form>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                title={t("use_current_location", "Use my current location")}
                className="absolute right-3 top-3 z-1001 flex items-center justify-center rounded-md border border-border bg-card p-2 shadow-md transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
              {isLocating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <LocateFixed className="h-5 w-5 text-foreground" />
              )}
            </button>
            </>
          )}
        </div>

        {locationError && (
          <div className="px-4 pt-3">
            <p className="text-sm text-destructive">{locationError}</p>
          </div>
        )}

        {searchError && (
          <div className="px-4 pt-3">
            <p className="text-sm text-destructive">{searchError}</p>
          </div>
        )}

        {/* Address Info */}
        <div className="border-t p-4">
          <div className="mb-4">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              {t("selected_coordinates")}:
            </p>
            <p className="text-sm">
              Latitude: {position[0].toFixed(6)}, Longitude:{" "}
              {position[1].toFixed(6)}
            </p>
          </div>

          {address && (
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {t("address")}:
              </p>
              <p className="text-sm">
                {isLoadingAddress ? t("loading_address") : address}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-md px-4 py-2 font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90 flex-1 rounded-md px-4 py-2 font-medium text-primary-foreground transition-colors"
            >
              {t("confirm_location")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
