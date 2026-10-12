type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
};

const sizes = {
  sm: { icon: "w-7 h-7", text: "text-lg", play: "text-[16px]" },
  md: { icon: "w-9 h-9", text: "text-2xl", play: "text-[20px]" },
  lg: { icon: "w-11 h-11", text: "text-3xl", play: "text-[24px]" },
};

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className={`relative ${s.icon} rounded-[9px] bg-[#e50914] flex items-center justify-center shadow-[0_2px_12px_rgba(229,9,20,0.5)] shrink-0`}
      >
        <span
          className={`material-symbols-outlined text-white ${s.play}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          play_arrow
        </span>
        <span className="absolute -top-[3px] -right-[1px] w-[5px] h-[5px] rounded-full bg-[#feb700]" />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight ${s.text}`}>
            <span className="text-white">Pop</span>
            <span className="text-[#e50914]">C</span>
            <span className="text-white">only</span>
          </span>
          <span className="mt-[3px] h-[2.5px] w-full rounded-full bg-gradient-to-r from-transparent via-[#e50914] to-[#e50914]" />
        </span>
      )}
    </span>
  );
}
