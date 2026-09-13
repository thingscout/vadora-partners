"use client";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #3D3D22 0%, #242217 100%)" }}>

      <div className="text-center mb-12">
        <img src="/vadora-logo-light.png" alt="Vadora Cares" className="h-[84px] w-auto object-contain mx-auto mb-5" />
        <p className="text-white/70 text-[15px] mt-2">Partners</p>
      </div>

      <div className="w-full max-w-[340px] space-y-3">
        <button
          onClick={onLogin}
          className="w-full py-4 rounded-btn bg-white text-[#E8792B] text-[16px] font-bold active:scale-[0.98] transition-transform shadow-card-lg"
        >
          Login
        </button>
        <button
          onClick={onRegister}
          className="w-full py-4 rounded-btn text-white text-[16px] font-bold border border-white/30 active:scale-[0.98] transition-transform"
          style={{ background: "#E8792B" }}
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
