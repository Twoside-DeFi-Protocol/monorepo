import React, { useEffect, useState } from "react";

interface LoaderProps {
  show?: boolean;
  text?: string;
}

const FullScreenLoader: React.FC<LoaderProps> = ({
  show = true,
  text = "Initializing Protocol...",
}) => {
  const [visible, setVisible] = useState(show);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!show) {
      setFade(true);
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    } else {
      setVisible(true);
      setFade(false);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center transition-opacity duration-300 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      // style={{
      //   backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)",
      //   backgroundSize: "16px 16px",
      // }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src="https://raw.githubusercontent.com/Twoside-DeFi-Protocol/monorepo/main/apps/web/public/favicon-96x96.png"
          alt="logo"
          className="w-20 h-20 object-contain animate-pulse"
          style={{
            filter: "drop-shadow(0 0 10px rgba(58,160,255,0.3))",
            animationDuration: "1.6s",
          }}
        />

        {/* Progress Bar */}
        <div className="w-44 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full animate-[progressMove_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Text */}
        <p className="text-sm text-gray-500 tracking-wide">{text}</p>
      </div>

      {/* Custom animation */}
      <style>
        {`@keyframes progressMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }`}
      </style>
    </div>
  );
};

export default FullScreenLoader;
