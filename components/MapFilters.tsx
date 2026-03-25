'use client';

type PassportOption = { code: string; name: string };

export type AccessToggles = {
  visaFree: boolean;
  eVisa: boolean;
  visaRequired: boolean;
};

export default function MapFilters({
  passportOptions,
  passportCode,
  setPassportCode,
  access,
  setAccess,
  visaStatus,
}: {
  passportOptions: PassportOption[];
  passportCode: string;
  setPassportCode: (next: string) => void;
  access: AccessToggles;
  setAccess: (next: AccessToggles) => void;
  visaStatus: 'idle' | 'loading' | 'loaded' | 'error';
}) {
  return (
    <div className="absolute left-3 top-3 z-[1000] w-[min(360px,calc(100vw-24px))] rounded-xl border border-black/10 bg-white/90 backdrop-blur px-3 py-3 shadow-sm dark:border-white/10 dark:bg-black/60">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Filters</div>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-md border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          onClick={() => {
            setPassportCode('');
            setAccess({ visaFree: true, eVisa: true, visaRequired: false });
          }}
        >
          Reset
        </button>
      </div>

      <div className="mt-3 grid gap-2">
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

        <fieldset className="grid gap-1">
          <legend className="text-xs font-medium opacity-80">Allowed entries</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={access.visaFree}
              onChange={(e) => setAccess({ ...access, visaFree: e.target.checked })}
            />
            Visa-free
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={access.eVisa}
              onChange={(e) => setAccess({ ...access, eVisa: e.target.checked })}
            />
            eVisa
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={access.visaRequired}
              onChange={(e) => setAccess({ ...access, visaRequired: e.target.checked })}
            />
            Visa required
          </label>
        </fieldset>

        {passportCode ? (
          <div className="text-xs rounded-md border border-black/10 bg-black/[0.03] px-2 py-2 dark:border-white/10 dark:bg-white/[0.06]">
            {visaStatus === 'loading' ? 'Loading visa access…' : null}
            {visaStatus === 'loaded' ? 'Visa access loaded.' : null}
            {visaStatus === 'error'
              ? 'Could not load visa access (network/CORS/server error).'
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

