export function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colors = [
    "from-cyan-400 to-cyan-600",
    "from-violet-400 to-violet-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-amber-500",
    "from-pink-400 to-pink-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className={`w-7 h-7 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  );
}
