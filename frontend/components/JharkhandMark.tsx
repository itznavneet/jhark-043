type JharkhandMarkProps = {
  className?: string;
  title?: string;
};

export function JharkhandMark({
  className = "h-10 w-10",
  title = "Jharkhand collaboration mark",
}: JharkhandMarkProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-accent shadow-sm ${className}`}
      aria-hidden="true"
    >
      <svg
        className="h-[72%] w-[72%]"
        viewBox="30 20 360 325"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <path
          d="M123 30 179 24 219 35 265 27 306 48 312 80 356 100 348 131 382 153 368 189 337 208 345 244 319 267 308 306 273 326 224 319 195 342 151 329 122 299 84 294 78 260 48 235 64 198 36 174 67 143 60 106 94 90Z"
          fill="white"
          fillRule="evenodd"
          stroke="#fff4ed"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <g
          fill="none"
          stroke="#f15a24"
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".78"
        >
          <path d="m92 90 70 46 50-10 45 42 52-14 38 35" />
          <path d="m78 158 84-22 20 56-48 55 44 82" />
          <path d="m162 136 28 56 82-18 10 66-58 79" />
          <path d="m267 27-18 93 45 54-21 51 46 42" />
          <path d="m219 35 30 85-59 72 70 36" />
        </g>
        <g fill="#0b4f9c" stroke="white" strokeWidth="4">
          <circle cx="185" cy="170" r="8" />
          <circle cx="274" cy="178" r="8" />
          <circle cx="320" cy="150" r="8" />
          <circle cx="285" cy="99" r="8" />
          <circle cx="217" cy="253" r="8" />
          <circle cx="327" cy="222" r="8" />
        </g>
      </svg>
    </span>
  );
}
