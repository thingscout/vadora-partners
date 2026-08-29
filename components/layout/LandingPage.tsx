"use client";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #8B5E83 0%, #6B4063 100%)" }}>

      <div className="text-center mb-12">
        <div className="w-[90px] h-[90px] rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-5 text-white text-4xl font-extrabold">
          V
        </div>
        <h1 className="text-white text-[28px] font-bold tracking-wide">Vadora Beauty</h1>
        <p className="text-white/70 text-[15px] mt-2">Partner Network</p>
      </div>

      <div className="w-full max-w-[340px] space-y-3">
        <button
          onClick={onLogin}
          className="w-full py-4 rounded-btn bg-white text-brand text-[16px] font-bold active:scale-[0.98] transition-transform shadow-card-lg"
        >
          Login
        </button>
        <button
          onClick={onRegister}
          className="w-full py-4 rounded-btn bg-white/15 backdrop-blur-md text-white text-[16px] font-bold border border-white/30 active:scale-[0.98] transition-transform"
        >
          Create Account
        </button>
      </div>

      <p className="text-white/40 text-xs mt-10">
        Vadora Beauty Partners © {new Date().getFullYear()}
      </p>
    </div>
  );
}
