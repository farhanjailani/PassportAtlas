'use client';

type PassportOption = { code: string; name: string };

export type AccessToggles = {
  visaFree: boolean;
  eVisa: boolean;
  voa: boolean;
  visaRequired: boolean;
  na: boolean;
};

export type ContinentKey = 'Europe' | 'Asia' | 'Africa' | 'North America' | 'South America' | 'Oceania';
export type CountryMode = 'block' | 'target';

export type ContinentOption = {
  key: ContinentKey;
  label: string;
  emoji: string;
  colorClass: string; // tailwind class for headers/backgrounds
};

export type CountryItem = { code: string; name: string };
export type CountryGroup = { continent: ContinentKey; items: CountryItem[] };

export default function MapFilters({
  passportOptions,
  passportCode,
  setPassportCode,
  access,
  setAccess,
  visaStatus,
  onDart,
  dartDisabled,
  selectedCityLabel,
  dartIconSrc,
  onResetAll,
  continentOptions,
  selectedContinents,
  onToggleContinent,
  countryMode,
  setCountryMode,
  countrySearch,
  setCountrySearch,
  countryGroups,
  selectedCountries,
  onToggleCountry,
}: {
  passportOptions: PassportOption[];
  passportCode: string;
  setPassportCode: (next: string) => void;
  access: AccessToggles;
  setAccess: (next: AccessToggles) => void;
  visaStatus: 'idle' | 'loading' | 'loaded' | 'error';
  onDart: () => void;
  dartDisabled: boolean;
  selectedCityLabel: string | null;
  dartIconSrc: string;
  onResetAll: () => void;
  continentOptions: ContinentOption[];
  selectedContinents: Set<ContinentKey>;
  onToggleContinent: (key: ContinentKey) => void;
  countryMode: CountryMode;
  setCountryMode: (mode: CountryMode) => void;
  countrySearch: string;
  setCountrySearch: (next: string) => void;
  countryGroups: CountryGroup[];
  selectedCountries: Set<string>;
  onToggleCountry: (iso2: string) => void;
}) {
  return (
    <>
      <style>{`
        @keyframes visaProgressAnim {
          0% { width: 0%; }
          100% { width: 80%; }
        }
      `}</style>
      <div className="absolute left-3 top-3 z-[1000] w-[min(360px,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-y-auto rounded-xl border border-black/10 bg-white/90 backdrop-blur px-3 py-3 shadow-sm dark:border-white/10 dark:bg-black/60">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Filters</div>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          onClick={onResetAll}
        >
          Reset
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="min-w-0 flex-1 text-xs opacity-80 truncate pr-2">
            {selectedCityLabel ? <>Selected: {selectedCityLabel}</> : 'No city selected'}
          </div>
          <button
            type="button"
            onClick={onDart}
            disabled={dartDisabled}
            className="h-9 w-11 shrink-0 grid place-items-center rounded-md border border-black/10 bg-white/70 hover:bg-white disabled:opacity-50 disabled:hover:bg-white/70 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
            title={dartDisabled ? 'Select a passport + filters first' : 'Pick a random city'}
          >
            <img
              src={dartIconSrc}
              alt="Dart"
              className="h-6 w-6"
              draggable={false}
            />
          </button>
        </div>

        <label className="grid gap-1">
          <div className="text-xs font-medium opacity-80">Passport holder</div>
          <select
            className="h-9 rounded-md border border-black/10 bg-white px-2 text-sm dark:border-white/10 dark:bg-black/40"
            value={passportCode}
            onChange={(e) => setPassportCode(e.target.value)}
          >
            <option value="">All countries</option>
            {passportOptions.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-1.5">
          <legend className="text-xs font-medium opacity-80 mb-1">Allowed entries</legend>
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <span className="opacity-90">Visa-free</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={access.visaFree}
                onChange={(e) => setAccess({ ...access, visaFree: e.target.checked })}
              />
              <div className="w-9 h-5 bg-black/10 rounded-full peer dark:bg-black/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <span className="opacity-90">eVisa</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={access.eVisa}
                onChange={(e) => setAccess({ ...access, eVisa: e.target.checked })}
              />
              <div className="w-9 h-5 bg-black/10 rounded-full peer dark:bg-black/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <span className="opacity-90">Visa on arrival</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={access.voa}
                onChange={(e) => setAccess({ ...access, voa: e.target.checked })}
              />
              <div className="w-9 h-5 bg-black/10 rounded-full peer dark:bg-black/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <span className="opacity-90">Visa required</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={access.visaRequired}
                onChange={(e) => setAccess({ ...access, visaRequired: e.target.checked })}
              />
              <div className="w-9 h-5 bg-black/10 rounded-full peer dark:bg-black/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </div>
          </label>
        {/* 
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <span className="opacity-90">No admission</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={access.na}
                onChange={(e) => setAccess({ ...access, na: e.target.checked })}
              />
              <div className="w-9 h-5 bg-black/10 rounded-full peer dark:bg-black/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </div>
          </label>
        */}
        </fieldset>

        {passportCode ? (
          <div className="relative overflow-hidden text-xs rounded-md border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.06]">
            <div
              className={`absolute inset-y-0 left-0 transition-all ${
                visaStatus === 'loaded'
                  ? 'w-full duration-500 ease-out bg-green-500/40 dark:bg-green-500/50'
                  : visaStatus === 'error'
                  ? 'w-full duration-500 ease-out bg-red-500/40 dark:bg-red-500/50'
                  : ''
              }`}
              style={
                visaStatus === 'loading'
                  ? {
                      animation: 'visaProgressAnim 4s ease-out forwards',
                      backgroundColor: 'rgba(128,128,128,0.25)',
                    }
                  : {}
              }
            />
            <div className="relative z-10 px-2 py-2">
              {visaStatus === 'loading' ? 'Loading visa access…' : null}
              {visaStatus === 'loaded' ? 'Visa access loaded.' : null}
              {visaStatus === 'error'
                ? 'Could not load visa access (network/CORS/server error).'
                : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold opacity-80">Countries</div>
        </div>

        <div className="mt-2 flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setCountryMode('block')}
            className={[
              'flex-1 px-2 py-2 text-xs font-bold transition-colors',
              countryMode === 'block'
                ? 'bg-red-600 text-white'
                : 'bg-white/50 text-black/70 hover:bg-white/80 dark:bg-black/20 dark:text-white/70 dark:hover:bg-black/10',
            ].join(' ')}
          >
            Block
          </button>
          <div className="w-px bg-black/10 dark:bg-white/10" />
          <button
            type="button"
            onClick={() => setCountryMode('target')}
            className={[
              'flex-1 px-2 py-2 text-xs font-bold transition-colors',
              countryMode === 'target'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/50 text-black/70 hover:bg-white/80 dark:bg-black/20 dark:text-white/70 dark:hover:bg-black/10',
            ].join(' ')}
          >
            Target
          </button>
        </div>

        <p className="mt-2 text-[11px] opacity-70">
          {countryMode === 'block'
            ? 'Selected countries will be ignored when throwing the dart.'
            : 'The dart will exclusively land in the countries you select.'}
        </p>

        <div className="relative mt-2">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/magnifying-glass-part-2-svgrepo-com.svg`}
            alt=""
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50"
          />
          <input
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full rounded-lg border border-black/10 bg-white/60 pl-8 pr-2 py-2 text-xs outline-none focus:border-black/20 dark:border-white/10 dark:bg-black/30 dark:focus:border-white/30"
          />
        </div>

        <div className="mt-3">
          <div className="text-[11px] font-bold opacity-80 mb-2 flex items-center gap-1.5">
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/globe-2-svgrepo-com.svg`}
              alt=""
              className="w-3.5 h-3.5 opacity-60 dark:invert"
            />
            Continents
          </div>

          <div className="flex flex-wrap gap-2">
            {continentOptions.map((c) => {
              const checked = selectedContinents.has(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onToggleContinent(c.key)}
                  className={[
                    'flex items-center gap-2 px-2 py-1 rounded-lg border text-xs transition-colors',
                    checked
                      ? 'border-black/10 bg-blue-600 text-white'
                      : 'border-black/10 bg-white/30 text-black/70 hover:bg-white/60 dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:hover:bg-black/10',
                  ].join(' ')}
                  aria-pressed={checked}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-[10px] opacity-90">{checked ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pb-2">
          {countryGroups.length === 0 ? (
            <div className="text-[11px] opacity-70">No countries match.</div>
          ) : (
            <div className="space-y-3">
              {countryGroups.map((g) => {
                return (
                  <div key={g.continent}>
                    <div className="text-[11px] uppercase font-bold tracking-wide mb-2 rounded-md px-2 py-1 bg-blue-600 text-white">
                      {g.continent}
                    </div>
                    <div className="grid gap-1">
                      {g.items.map((item) => {
                        const checked = selectedCountries.has(item.code);
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => onToggleCountry(item.code)}
                            className={[
                              'flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs transition-colors',
                              checked
                                ? 'border-emerald-500/30 bg-emerald-500/15'
                                : 'border-black/10 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/10',
                            ].join(' ')}
                            aria-pressed={checked}
                          >
                            <img
                              src={`https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/${item.code.toLowerCase()}.svg`}
                              alt=""
                              className="w-4 h-3 object-cover rounded-[2px]"
                              loading="lazy"
                            />
                            <span className="flex-1 text-left truncate">{item.name}</span>
                            <span className="text-[10px] opacity-80">{checked ? '✓' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

