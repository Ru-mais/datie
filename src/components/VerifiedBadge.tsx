import { ShieldCheck, Check } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function VerifiedBadge({ isVerified = true, size = "md", showLabel = false }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <span 
      title="Photo Verified Profile (Selfie Pose Verified)"
      className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-2 py-0.5 shadow-md align-middle shrink-0 font-black tracking-wider"
    >
      <ShieldCheck size={iconSizes[size]} className="fill-white text-blue-600" />
      {showLabel && (
        <span className="text-[9px] uppercase tracking-widest font-black pr-0.5">
          Verified
        </span>
      )}
    </span>
  );
}
