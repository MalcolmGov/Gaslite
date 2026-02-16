/// <reference types="@types/google.maps" />
import { useState, useRef, useEffect, useCallback, useId } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    initGoogleMaps: () => void;
  }
}

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (googleMapsLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    loadCallbacks.push({ resolve, reject });

    if (googleMapsLoading) return;
    googleMapsLoading = true;

    window.initGoogleMaps = () => {
      googleMapsLoaded = true;
      loadCallbacks.forEach((cb) => cb.resolve());
      loadCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      googleMapsLoading = false;
      const err = new Error("Failed to load Google Maps script");
      loadCallbacks.forEach((cb) => cb.reject(err));
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: string, placeId: string, coordinates?: PlaceCoordinates) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address...",
  className = "",
  "data-testid": testId,
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenDivRef = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const listboxId = useId();

  const { data: mapsConfig } = useQuery<{ key: string }>({
    queryKey: ["/api/config/maps-key"],
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!mapsConfig?.key) return;

    loadGoogleMapsScript(mapsConfig.key)
      .then(() => {
        if (!mountedRef.current) return;
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        if (!hiddenDivRef.current) {
          hiddenDivRef.current = document.createElement("div");
        }
        placesService.current = new window.google.maps.places.PlacesService(hiddenDivRef.current);
        setIsReady(true);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setLoadError(true);
      });
  }, [mapsConfig?.key]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!autocompleteService.current || input.length < 3) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      autocompleteService.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "za" },
          types: ["address"],
        },
        (results, status) => {
          if (!mountedRef.current) return;
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const mapped: Prediction[] = results.map((r) => ({
              placeId: r.place_id,
              description: r.description,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text,
            }));
            setPredictions(mapped);
            setIsOpen(true);
            setActiveIndex(-1);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        }
      );
    },
    []
  );

  const selectingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectingRef.current) return;
    const val = e.target.value;
    onChange(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(val);
    }, 300);
  };

  const handleSelect = (prediction: Prediction) => {
    selectingRef.current = true;
    setIsOpen(false);
    setPredictions([]);
    setActiveIndex(-1);

    if (placesService.current && onSelect) {
      placesService.current.getDetails(
        { placeId: prediction.placeId, fields: ["geometry"] },
        (place, status) => {
          if (!mountedRef.current) return;
          onChange(prediction.description);
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            onSelect(prediction.description, prediction.placeId, {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
          } else {
            onSelect(prediction.description, prediction.placeId);
          }
          selectingRef.current = false;
        }
      );
    } else {
      onChange(prediction.description);
      onSelect?.(prediction.description, prediction.placeId);
      selectingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {!isReady && mapsConfig?.key && !loadError && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={loadError ? "Type your address manually" : placeholder}
          className={`pl-9 ${className}`}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          data-testid={testId}
        />
      </div>
      {isOpen && predictions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden"
          data-testid={testId ? `${testId}-dropdown` : "places-dropdown"}
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId}
              id={`${listboxId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover-elevate"
              } ${index < predictions.length - 1 ? "border-b border-border/50" : ""}`}
              onClick={() => handleSelect(prediction)}
              onMouseEnter={() => setActiveIndex(index)}
              data-testid={testId ? `${testId}-option-${index}` : `places-option-${index}`}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{prediction.mainText}</p>
                <p className="text-xs text-muted-foreground truncate">{prediction.secondaryText}</p>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 border-t border-border/50 flex justify-end">
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png"
              alt="Powered by Google"
              className="h-3 dark:invert dark:opacity-70"
            />
          </div>
        </div>
      )}
    </div>
  );
}
