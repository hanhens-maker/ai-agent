import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function RadarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 18.5 5.5M12 3.5V2M12 22v-1.5M3.5 12H2M22 12h-1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <circle cx="10.7" cy="10.7" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="m12 2 1.2 4.2a6.4 6.4 0 0 0 4.5 4.5L22 12l-4.2 1.2a6.4 6.4 0 0 0-4.5 4.5L12 22l-1.2-4.2a6.4 6.4 0 0 0-4.5-4.5L2 12l4.2-1.2a6.4 6.4 0 0 0 4.5-4.5L12 2Z" />
    </svg>
  );
}

export function WarningTriangleIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...defaults} {...props}>
      <path d="M10.4 4.1 2.8 17.3A1.8 1.8 0 0 0 4.4 20h15.2a1.8 1.8 0 0 0 1.6-2.7L13.6 4.1a1.8 1.8 0 0 0-3.2 0Z" />
      <path d="M12 9v4.5M12 17h.01" />
    </svg>
  );
}
