export function ProfileAvatar({ profile, size = "sm" }) {
  const dimensions = size === "lg" ? "w-20 h-20 text-2xl" : "w-9 h-9 text-sm";
  const initial = (profile?.name || profile?.email || "U").charAt(0).toUpperCase();

  return (
    <div className={`${dimensions} rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {profile?.avatar ? (
        <img src={profile.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="font-semibold text-white">{initial}</span>
      )}
    </div>
  );
}
