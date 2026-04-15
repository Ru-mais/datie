import { Heart, X, MapPin, Briefcase, GraduationCap, Utensils } from "lucide-react";

interface ProfileProps {
  name: string;
  age: number;
  location: string;
  profession: string;
  education: string;
  favoriteFood: string;
  bio: string;
  image?: string;
}

export default function ProfileCard({ profile }: { profile: ProfileProps }) {
  return (
    <div className="relative w-full max-w-sm h-[600px] bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37]/30 transition-all group">
      {/* Profile Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10" />
      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-gray-400 text-6xl font-bold opacity-20">{profile.name[0]}</span>
      </div>

      {/* Info Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
            <div className="px-2 py-0.5 bg-[#D4AF37] text-black text-[10px] font-bold rounded-sm uppercase tracking-wider">Verified</div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge icon={<MapPin size={12} />} text={profile.location} />
            <Badge icon={<Briefcase size={12} />} text={profile.profession} />
            <Badge icon={<Utensils size={12} />} text={profile.favoriteFood} />
          </div>

          <p className="text-white/80 text-sm line-clamp-3 mb-6 font-light leading-relaxed">
            {profile.bio}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-4">
          <button className="flex-1 py-4 glass-morphism rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10">
            <X size={24} />
          </button>
          <button className="flex-1 py-4 bg-[#D4AF37] rounded-2xl flex items-center justify-center text-black hover:bg-[#B8860B] transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <Heart size={24} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium text-white/90">
      {icon}
      {text}
    </span>
  );
}
