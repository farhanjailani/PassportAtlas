import MapWrapper from '../components/MapWrapper';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">PassportAtlas</h1>
          <div className="text-sm opacity-70">
            Pick a passport, then filter visa-free / eVisa countries
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <MapWrapper />
      </div>
    </main>
  );
}