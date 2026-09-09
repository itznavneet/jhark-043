export function JharkhandMap() {
  return (
    <div className="relative mx-auto max-w-md" aria-label="Illustrated map of Jharkhand">
      <svg className="h-auto w-full" viewBox="0 0 440 360" role="img">
        <title>Jharkhand innovation network map</title>
        <defs>
          <linearGradient id="jharkhand-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1b73c9" />
            <stop offset="1" stopColor="#0b4f9c" />
          </linearGradient>
          <filter id="jharkhand-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" floodColor="#031c3d" floodOpacity="0.35" stdDeviation="8" />
          </filter>
        </defs>
        <path
          d="M123 30 179 24 219 35 265 27 306 48 312 80 356 100 348 131 382 153 368 189 337 208 345 244 319 267 308 306 273 326 224 319 195 342 151 329 122 299 84 294 78 260 48 235 64 198 36 174 67 143 60 106 94 90Z"
          fill="url(#jharkhand-fill)"
          filter="url(#jharkhand-shadow)"
          stroke="#8fc8ff"
          strokeWidth="3"
        />
        <g fill="none" stroke="#8fc8ff" strokeOpacity="0.45" strokeWidth="1.5">
          <path d="m92 90 70 46 50-10 45 42 52-14 38 35" />
          <path d="m78 158 84-22 20 56-48 55 44 82" />
          <path d="m162 136 28 56 82-18 10 66-58 79" />
          <path d="m267 27-18 93 45 54-21 51 46 42" />
          <path d="m219 35 30 85-59 72 70 36" />
        </g>
        <g fill="#ff8a4c" stroke="#fff" strokeWidth="3">
          <circle cx="185" cy="170" r="7"><title>Ranchi</title></circle>
          <circle cx="274" cy="178" r="7"><title>Bokaro</title></circle>
          <circle cx="320" cy="150" r="7"><title>Dhanbad</title></circle>
          <circle cx="285" cy="99" r="7"><title>Deoghar</title></circle>
          <circle cx="217" cy="253" r="7"><title>Gumla</title></circle>
          <circle cx="327" cy="222" r="7"><title>Jamshedpur</title></circle>
        </g>
        <g fill="#e8f4ff" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="700">
          <text x="194" y="166">Ranchi</text>
          <text x="282" y="174">Bokaro</text>
          <text x="328" y="146">Dhanbad</text>
          <text x="293" y="95">Deoghar</text>
          <text x="226" y="250">Gumla</text>
          <text x="335" y="218">Jamshedpur</text>
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-4 left-5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-50 backdrop-blur-sm">
        24 districts · one shared mission
      </div>
    </div>
  );
}
