// Hero graphic: subscribers head for the exit; at the CancelKit gate some
// loop back (jade), the rest leave freely (slate). The exit is never blocked.
// 2 of 8 dots loop back — inside the 15–30% save-rate benchmark, not above it.

const EXIT = "M170 210 H930";
const KEPT = "M170 210 H470 C470 60 250 40 196 150";

type Dot = { kept: boolean; begin: number };
const DOTS: Dot[] = [
  { kept: false, begin: 0 },
  { kept: true, begin: 1 },
  { kept: false, begin: 2 },
  { kept: false, begin: 3 },
  { kept: false, begin: 4 },
  { kept: true, begin: 5 },
  { kept: false, begin: 6 },
  { kept: false, begin: 7 },
];

export function FlowGraphic() {
  return (
    <>
    <svg
      viewBox="0 0 960 290"
      className="h-auto w-full"
      role="img"
      aria-label="Subscribers moving toward the exit. At the CancelKit checkpoint, some take an offer and loop back into the product; the rest continue out, unblocked."
    >
      <defs>
        <linearGradient id="fg-exit" x1="0" x2="1">
          <stop offset="0" stopColor="#7C8A9E" stopOpacity="0.2" />
          <stop offset="0.45" stopColor="#7C8A9E" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7C8A9E" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="fg-glow">
          <stop offset="0" stopColor="#FFB400" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFB400" stopOpacity="0" />
        </radialGradient>
        <path id="fg-exit-path" d={EXIT} />
        <path id="fg-kept-path" d={KEPT} />
      </defs>

      {/* your app */}
      <g>
        <rect x="24" y="150" width="146" height="112" rx="18" fill="#1B2D4D" stroke="#2C4169" />
        <circle cx="44" cy="170" r="4" fill="#3A5080" />
        <circle cx="58" cy="170" r="4" fill="#3A5080" />
        <circle cx="72" cy="170" r="4" fill="#3A5080" />
        <rect x="42" y="190" width="92" height="9" rx="4.5" fill="#2C4169" />
        <rect x="42" y="208" width="64" height="9" rx="4.5" fill="#2C4169" />
        <rect x="42" y="232" width="56" height="16" rx="8" fill="#3A5080" />
        <text className="max-sm:hidden" x="97" y="284" textAnchor="middle" fill="#8FA0BA" fontSize="15" fontFamily="var(--font-body)">
          your app
        </text>
      </g>

      {/* exit — always open */}
      <path d={EXIT} stroke="url(#fg-exit)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={EXIT} stroke="#AAB6C8" strokeWidth="1.5" fill="none" className="flow-dash" opacity="0.35" />
      <path d="M916 198 L932 210 L916 222" stroke="#7C8A9E" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text className="max-sm:hidden" x="930" y="250" textAnchor="end" fill="#8FA0BA" fontSize="15" fontFamily="var(--font-body)">
        cancel anyway, always open
      </text>

      {/* the loop back */}
      <path d={KEPT} stroke="#0B9A6D" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M204 136 L194 152 L212 156" stroke="#0B9A6D" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text className="max-sm:hidden" x="330" y="44" textAnchor="middle" fill="#5FD3A8" fontSize="15" fontFamily="var(--font-body)">
        paused or discounted, still a customer
      </text>

      {/* the checkpoint */}
      <circle cx="470" cy="210" r="56" fill="url(#fg-glow)" />
      <circle cx="470" cy="210" r="22" fill="#FFB400" />
      <circle cx="470" cy="210" r="22" fill="none" stroke="#FFB400" strokeWidth="2" className="motion-only">
        <animate attributeName="r" values="22;40" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <rect x="462" y="201" width="5" height="18" rx="2" fill="#0F1E36" />
      <rect x="473" y="201" width="5" height="18" rx="2" fill="#0F1E36" />
      <text className="max-sm:hidden" x="470" y="262" textAnchor="middle" fill="#FFD466" fontSize="15" fontWeight="600" fontFamily="var(--font-body)">
        one fair offer
      </text>

      {/* subscribers in motion */}
      <g className="motion-only">
        {DOTS.map((d, i) => (
          <circle key={i} r="7" fill="#AAB6C8" opacity="0">
            <animateMotion dur={d.kept ? "7.2s" : "7.6s"} begin={`${d.begin}s`} repeatCount="indefinite">
              <mpath href={d.kept ? "#fg-kept-path" : "#fg-exit-path"} />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.06;0.9;1"
              dur={d.kept ? "7.2s" : "7.6s"}
              begin={`${d.begin}s`}
              repeatCount="indefinite"
            />
            {d.kept && (
              <animate
                attributeName="fill"
                values="#AAB6C8;#AAB6C8;#34D399;#34D399"
                keyTimes="0;0.4;0.45;1"
                dur="7.2s"
                begin={`${d.begin}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </g>
    </svg>
    {/* labels scale to ~6px inside the SVG on phones — show them as HTML there */}
    <ul className="mt-4 grid gap-2 text-sm text-[#C9D3E1] sm:hidden" aria-hidden="true">
      <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-marigold" />One fair offer when they click cancel</li>
      <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />Paused or discounted, still a customer</li>
      <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-exit" />Cancel anyway, always open</li>
    </ul>
    </>
  );
}
