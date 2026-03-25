'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
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

export default function WorldMap() {
  const [countriesGeoJson, setCountriesGeoJson] = useState<any | null>(null);

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
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const countryFilter = useMemo(() => {
    if (!allowedIso2) return undefined;
    return (feature: any) => {
      const iso2 = getIso2(feature);
      return iso2 ? allowedIso2.has(iso2) : false;
    };
  }, [allowedIso2]);

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
      />

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {countriesGeoJson ? (
          <GeoJSON
            key={geoJsonLayerKey}
            data={countriesGeoJson}
            style={polygonStyle}
            filter={countryFilter}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}