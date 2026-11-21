function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // 48 x 48 hit area
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-12 items-center justify-center rounded-full active:bg-neutral-100"
    >
      {children}
    </button>
  );
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default function PageHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-1">
      <IconButton label="Back">
        <svg {...iconProps}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </IconButton>
      <span className="text-sm font-semibold tracking-wide">Shop</span>
      <div className="flex">
        <IconButton label="Add to favorites">
          <svg {...iconProps}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </IconButton>
        <IconButton label="Open bag">
          <svg {...iconProps}>
            <path d="M5 8h14l-1 12H6L5 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
