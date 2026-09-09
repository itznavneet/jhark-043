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
        viewBox="0 0 48 48"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <path
          d="M14 5.5 22 4l6 2 7-1 5 5-1 6 4 4-3 6 2 5-6 2-4 6-6-2-5 2-5-4-5-1-1-6-4-4 3-5-1-5 5-3Z"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="m10 20 10 4 7-5 8 3m-17-7 4 9-3 8m10-15-2 7 6 4m-12-7 8 2"
          fill="none"
          stroke="#ffd7bd"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".9"
        />
        <g fill="white" stroke="#f15a24" strokeWidth="1.2">
          <circle cx="20" cy="24" r="2.1" />
          <circle cx="27" cy="19" r="2.1" />
          <circle cx="35" cy="22" r="2.1" />
          <circle cx="24" cy="32" r="2.1" />
        </g>
      </svg>
    </span>
  );
}
