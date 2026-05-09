import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Users, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Kerala Backwaters"
            fill
            className="object-cover brightness-[0.4]"
            priority
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Heart className="w-12 h-12 text-primary fill-primary animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight">
            Find Your <span className="gold-text">Keralite Soulmate</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            The premium dating experience designed exclusively for the Malayali community. 
            Celebrate culture, traditions, and true love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-10 py-4 bg-primary text-black font-bold rounded-full hover:bg-primary-hover transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" /> Join Now
            </Link>
            <button className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all">
              Learn More
            </button>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-10 left-10 right-10 hidden md:flex justify-around z-10 glass-morphism p-6 rounded-2xl">
          <StatItem value="50K+" label="Active Members" />
          <div className="w-[1px] bg-white/20 h-10 my-auto"></div>
          <StatItem value="14" label="Districts Covered" />
          <div className="w-[1px] bg-white/20 h-10 my-auto"></div>
          <StatItem value="100%" label="Verified Profiles" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white dark:bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Why Choose <span className="gold-text">MalluLove</span>?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              We understand the unique culture of Kerala and help you find someone who shares your values and traditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<MapPin className="w-12 h-12 text-primary" />}
              title="District Based Matching"
              description="Find matches from your own district or anywhere in Kerala with our smart filters."
            />
            <FeatureCard 
              icon={<Users className="w-12 h-12 text-primary" />}
              title="Cultural Compatibility"
              description="Connect based on shared food preferences, traditions, and family values."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-12 h-12 text-primary" />}
              title="Safe & Verified"
              description="Every profile is verified through a rigorous check to ensure a safe dating environment."
            />
          </div>
        </div>
      </section>

      {/* Profile Sneak Peek */}
      <section className="py-32 bg-secondary/30 dark:bg-[#1A1A1A] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 text-left">
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Premium Profiles</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Designed for <span className="gold-text">Meaningful</span> Connections</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg leading-relaxed">
                Our profiles are more than just photos. Share your love for Sadya, your favorite local spots, and what makes you a true Malayali.
              </p>
              <div className="space-y-6">
                <CheckItem text="High-Quality Portraits" />
                <CheckItem text="Detailed Hobbies & Interests" />
                <CheckItem text="Family Values Integration" />
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="w-[320px] h-[480px] bg-white dark:bg-[#0F0F0F] rounded-[3rem] shadow-2xl rotate-3 border-8 border-white dark:border-gray-800 overflow-hidden relative">
                <div className="h-full bg-gradient-to-t from-black/90 via-black/20 to-transparent absolute inset-0 z-10 flex flex-col justify-end p-8">
                  <h3 className="text-white text-3xl font-bold mb-1">Meera, 24</h3>
                  <p className="text-white/80 mb-4">Kochi • Software Architect</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs">Appam Lover</span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs">Thrissur</span>
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-gray-800 h-full w-full"></div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-[240px] h-[360px] bg-white dark:bg-[#0F0F0F] rounded-[2.5rem] shadow-2xl -rotate-6 border-8 border-white dark:border-gray-800 overflow-hidden hidden xl:block">
                 <div className="h-full bg-gradient-to-t from-black/90 via-black/20 to-transparent absolute inset-0 z-10 flex flex-col justify-end p-6">
                  <h3 className="text-white text-xl font-bold">Rahul, 27</h3>
                  <p className="text-white/80 text-sm">Kottayam • Artist</p>
                </div>
                <div className="bg-gray-300 dark:bg-gray-700 h-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-primary p-2 rounded-xl">
              <Heart size={24} fill="black" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">MalluLove</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Connecting Malayali hearts around the world with culture and care.</p>
          <div className="h-[1px] w-full bg-gray-100 dark:bg-gray-900 mb-8"></div>
          <p className="text-gray-500 text-sm">© 2024 MalluLove. Proudly made for Kerala.</p>
        </div>
      </footer>
    </main>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="text-center">
      <p className="text-primary text-3xl font-bold mb-1">{value}</p>
      <p className="text-white/50 text-xs uppercase tracking-widest">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 group">
      <div className="mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">{icon}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-primary/10 p-2 rounded-full">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <span className="text-gray-700 dark:text-gray-300 font-medium">{text}</span>
    </div>
  );
}

