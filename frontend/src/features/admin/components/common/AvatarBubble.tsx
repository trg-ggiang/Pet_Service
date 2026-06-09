export function AvatarBubble({
  initials,
  name,
  colors,
  size = "md",
}: {
  initials: string;
  name: string;
  colors: string[];
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-[12px]",
    lg: "w-14 h-14 text-[16px]",
  }[size];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ${sz}`}
    >
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}
