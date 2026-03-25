'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import type { StyleFunction } from 'leaflet';
import MapFilters, { type AccessToggles } from './MapFilters';

type PassportOption = { code: string; name: string };

function getIso3(feature: any): string | null {
  const p = feature?.properties;
  const iso = p?.ADM0_A3 ?? p?.ISO_A3 ?? p?.SOV_A3 ?? null;
  return typeof iso === 'string' ? iso : null;
}

function getIso2(feature: any): string | null {
  const p = feature?.properties;
  const iso = p?.ISO_A2_EH ?? p?.ISO_A2 ?? null;
  if (typeof iso !== 'string') return null;
  const trimmed = iso.trim();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  if (trimmed === '-9') return null;
  return trimmed;
}

function getCountryName(feature: any): string {
  const p = feature?.properties;
  const name = p?.ADMIN ?? p?.NAME ?? p?.NAME_LONG ?? 'Unknown';
  return typeof name === 'string' ? name : 'Unknown';
}

function getCityName(feature: any): string {
  const p = feature?.properties;
  const name = p?.name ?? p?.NAME ?? p?.NAMEASCII ?? 'Unknown city';
  return typeof name === 'string' ? name : 'Unknown city';
}

function shiftGeometryLng(geometry: any, deltaLng: number): any {
  if (!geometry) return geometry;

  const t = geometry.type;
  const coords = geometry.coordinates;

  const shiftPoint = (pt: any) => {
    if (!Array.isArray(pt) || pt.length < 2) return pt;
    return [pt[0] + deltaLng, pt[1], ...pt.slice(2)];
  };

  if (t === 'Point') {
    return { ...geometry, coordinates: shiftPoint(coords) };
  }
  if (t === 'MultiPoint' || t === 'LineString') {
    return { ...geometry, coordinates: coords.map(shiftPoint) };
  }
  if (t === 'MultiLineString' || t === 'Polygon') {
    return { ...geometry, coordinates: coords.map((line: any) => line.map(shiftPoint)) };
  }
  if (t === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: coords.map((poly: any) => poly.map((ring: any) => ring.map(shiftPoint))),
    };
  }
  if (t === 'GeometryCollection') {
    return { ...geometry, geometries: (geometry.geometries ?? []).map((g: any) => shiftGeometryLng(g, deltaLng)) };
  }
  return geometry;
}

type VisaApiItem = { code: string; name?: string; duration?: number | null };
type VisaApiResponse = {
  code: string; // passport ISO2
  name: string;
  VF?: VisaApiItem[]; // visa-free
  EV?: VisaApiItem[]; // eVisa
  VOA?: VisaApiItem[];
  VR?: VisaApiItem[];
  last_updated?: string;
};

type CityFeature = {
  type: 'Feature';
  properties?: Record<string, any>;
  geometry: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
};

function MapFlyTo({
  target,
}: {
  target: { lat: number; lng: number; zoom: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 });
  }, [map, target]);

  return null;
}

export default function WorldMap() {
  const [countriesGeoJson, setCountriesGeoJson] = useState<any | null>(null);
  const [citiesGeoJson, setCitiesGeoJson] = useState<any | null>(null);

  const [passportCode, setPassportCode] = useState('');
  const [access, setAccess] = useState<AccessToggles>({
    visaFree: true,
    eVisa: true,
    visaRequired: false,
  });

  const [visaStatus, setVisaStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [visaData, setVisaData] = useState<{ vf: Set<string>; ev: Set<string>; vr: Set<string> } | null>(
    null
  );
  const visaCacheRef = useRef<Map<string, { vf: Set<string>; ev: Set<string>; vr: Set<string> }>>(
    new Map()
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const countriesRes = await fetch('/data/countries.geojson');
      if (!cancelled && countriesRes.ok) setCountriesGeoJson(await countriesRes.json());

      const citiesRes = await fetch('/data/cities.geojson');
      if (!cancelled && citiesRes.ok) setCitiesGeoJson(await citiesRes.json());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const iso3ToIso2 = useMemo(() => {
    const m = new Map<string, string>();
    const features: any[] = countriesGeoJson?.features ?? [];
    for (const f of features) {
      const iso3 = getIso3(f);
      const iso2 = getIso2(f);
      if (iso3 && iso2) m.set(iso3, iso2);
    }
    return m;
  }, [countriesGeoJson]);

  const passportOptions: PassportOption[] = useMemo(() => {
    const features: any[] = countriesGeoJson?.features ?? [];
    const list = features
      .map((f) => ({
        code: getIso2(f) ?? '',
        name: getCountryName(f),
      }))
      .filter((x) => x.code)
      .sort((a, b) => a.name.localeCompare(b.name));

    const seen = new Set<string>();
    return list.filter((x) => (seen.has(x.code) ? false : (seen.add(x.code), true)));
  }, [countriesGeoJson]);

  useEffect(() => {
    if (!passportCode) {
      setVisaStatus('idle');
      setVisaData(null);
      return;
    }

    const cached = visaCacheRef.current.get(passportCode);
    if (cached) {
      setVisaStatus('loaded');
      setVisaData(cached);
      return;
    }

    const ac = new AbortController();
    setVisaStatus('loading');

    (async () => {
      try {
        const res = await fetch(`https://rough-sun-2523.fly.dev/country/${passportCode}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as VisaApiResponse;
        const vf = new Set<string>((json.VF ?? []).map((x) => x.code).filter((c) => /^[A-Z]{2}$/.test(c)));
        const ev = new Set<string>((json.EV ?? []).map((x) => x.code).filter((c) => /^[A-Z]{2}$/.test(c)));
        const vr = new Set<string>((json.VR ?? []).map((x) => x.code).filter((c) => /^[A-Z]{2}$/.test(c)));

        const parsed = { vf, ev, vr };
        visaCacheRef.current.set(passportCode, parsed);
        setVisaData(parsed);
        setVisaStatus('loaded');
      } catch {
        if (!ac.signal.aborted) {
          setVisaStatus('error');
          setVisaData({ vf: new Set(), ev: new Set(), vr: new Set() });
        }
      }
    })();

    return () => ac.abort();
  }, [passportCode]);

  const allowedIso2 = useMemo(() => {
    if (!passportCode) return null;
    if (!visaData) return null;

    const allowed = new Set<string>();
    if (access.visaFree) visaData.vf.forEach((x) => allowed.add(x));
    if (access.eVisa) visaData.ev.forEach((x) => allowed.add(x));
    if (access.visaRequired) visaData.vr.forEach((x) => allowed.add(x));
    return allowed;
  }, [passportCode, visaData, access]);

  const activeIso2 = useMemo(() => {
    // If no passport selected, "active" = all countries with ISO2 codes.
    if (!passportCode) {
      return new Set(passportOptions.map((p) => p.code));
    }
    return allowedIso2 ?? new Set<string>();
  }, [passportCode, allowedIso2, passportOptions]);

  const geoJsonLayerKey = useMemo(() => {
    const parts = [
      passportCode || 'ALL',
      access.visaFree ? 'VF1' : 'VF0',
      access.eVisa ? 'EV1' : 'EV0',
      access.visaRequired ? 'VR1' : 'VR0',
      visaStatus,
    ];
    return parts.join('|');
  }, [passportCode, access, visaStatus]);

  const visibleCountriesGeoJson = useMemo(() => {
    const fc = countriesGeoJson;
    const features: any[] = fc?.features ?? [];
    if (!fc || !Array.isArray(features)) return null;

    // When no passport is selected, show all countries (no filtering).
    if (!passportCode) return fc;

    // When a passport is selected, show only currently-allowed countries.
    if (!allowedIso2) return { ...fc, features: [] };
    const filtered = features.filter((f) => {
      const iso2 = getIso2(f);
      return iso2 ? allowedIso2.has(iso2) : false;
    });
    return { ...fc, features: filtered };
  }, [countriesGeoJson, passportCode, allowedIso2]);

  const repeatingCountriesLayers = useMemo(() => {
    if (!visibleCountriesGeoJson) return [];
    // Render -360, 0, +360 so polygons match repeating tiles.
    const deltas = [-360, 0, 360];
    return deltas.map((deltaLng) => {
      if (deltaLng === 0) return { key: '0', data: visibleCountriesGeoJson };
      const shiftedFeatures = (visibleCountriesGeoJson.features ?? []).map((f: any) => ({
        ...f,
        geometry: shiftGeometryLng(f.geometry, deltaLng),
      }));
      return {
        key: String(deltaLng),
        data: { ...visibleCountriesGeoJson, features: shiftedFeatures },
      };
    });
  }, [visibleCountriesGeoJson, geoJsonLayerKey]);

  const [selectedCity, setSelectedCity] = useState<{
    name: string;
    lat: number;
    lng: number;
    countryIso2: string;
  } | null>(null);

  const selectedCityLabel = useMemo(() => {
    if (!selectedCity) return null;
    return `${selectedCity.name} (${selectedCity.countryIso2})`;
  }, [selectedCity]);

  const flyTarget = useMemo(() => {
    if (!selectedCity) return null;
    return { lat: selectedCity.lat, lng: selectedCity.lng, zoom: 6 };
  }, [selectedCity]);

  const dartDisabled = useMemo(() => {
    return !citiesGeoJson || activeIso2.size === 0;
  }, [citiesGeoJson, activeIso2.size]);

  const onDart = () => {
    const features: CityFeature[] = citiesGeoJson?.features ?? [];
    if (!features.length) return;

    const pool: Array<{ feature: CityFeature; iso2: string }> = [];
    for (const f of features) {
      const iso3 = f?.properties?.adm0_a3 ?? f?.properties?.ADM0_A3 ?? null;
      const iso2 = typeof iso3 === 'string' ? iso3ToIso2.get(iso3) : undefined;
      if (!iso2) continue;
      if (!activeIso2.has(iso2)) continue;
      pool.push({ feature: f, iso2 });
    }
    if (!pool.length) return;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const [lng, lat] = pick.feature.geometry.coordinates;
    setSelectedCity({
      name: getCityName(pick.feature),
      lat,
      lng,
      countryIso2: pick.iso2,
    });
  };

  const polygonStyle: StyleFunction<any> = useMemo(() => {
    return () => ({
      color: '#111827',
      weight: 1,
      opacity: 0.7,
      fillColor: '#60a5fa',
      fillOpacity: 0.18,
    });
  }, []);

  return (
    <div className="relative" style={{ height: '100vh', width: '100%' }}>
      <MapFilters
        passportOptions={passportOptions}
        passportCode={passportCode}
        setPassportCode={setPassportCode}
        access={access}
        setAccess={setAccess}
        visaStatus={visaStatus}
        onDart={onDart}
        dartDisabled={dartDisabled}
        selectedCityLabel={selectedCityLabel}
      />

      <MapContainer
        center={[20, 0]}
        zoom={2}
        zoomControl={false}
        worldCopyJump
        style={{ height: '100%', width: '100%' }}
      >
        <MapFlyTo target={flyTarget} />
        <ZoomControl position="topright" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {repeatingCountriesLayers.map((layer) => (
          <GeoJSON
            key={`${geoJsonLayerKey}|wrap:${layer.key}`}
            data={layer.data}
            style={polygonStyle}
          />
        ))}

        {selectedCity ? (
          <CircleMarker center={[selectedCity.lat, selectedCity.lng]} radius={7} pathOptions={{ color: '#ef4444' }}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              {selectedCity.name}
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  );
}