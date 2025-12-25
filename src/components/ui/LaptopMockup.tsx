import React from "react";

interface LaptopMockupProps {
  imageSrc?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
}

const LaptopMockup: React.FC<LaptopMockupProps> = ({
  imageSrc,
  alt = "Registration process screenshot",
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className} max-w-[85%] lg:max-w-[72%] mx-auto`}>
      {/* MacBook M4 Frame */}
      <div className="relative mx-auto max-w-full">
        {/* Screen - MacBook style with rounded corners */}
        <div className="relative bg-linear-to-b from-gray-700 to-gray-900 rounded-2xl lg:rounded-[1.3rem] mx-2 p-1 lg:p-1.5 shadow-2xl">
          {/* Notch/Camera */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 lg:w-20 h-2.5 lg:h-3 bg-black rounded-b-md z-10"></div>

          {/* Browser Bar */}
          <div className="flex items-center gap-2 mb-0.5 bg-gray-900/50 backdrop-blur-sm rounded-t-lg px-3 py-0.5 mt-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 mx-3 bg-gray-800/70 rounded-md px-3 py-1">
              <div className="text-xs lg:text-sm text-gray-300 mr-8 text-center truncate">
                okoafamilia.innovasure.co.ke
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="bg-white rounded-b-[0.8rem] lg:rounded-b-2xl overflow-hidden w-full h-40 lg:h-56">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                {children || (
                  <div className="text-gray-400 text-sm">
                    Screenshot placeholder
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MacBook Base - Wider for better balance */}
        <div className="relative mt-[0.08rem]">
          {/* Top edge of base */}
          <div className="h-1 lg:h-1.5 bg-linear-to-b from-gray-700 to-gray-800 rounded-t-lg mx-auto w-full"></div>
          {/* Main base */}
          <div className="h-2 lg:h-2.5 bg-linear-to-b from-gray-800 via-gray-700 to-gray-800 rounded-b-lg mx-auto w-full"></div>
          {/* Bottom accent */}
          <div className="h-0.5 bg-gray-900 rounded-b-lg mx-auto w-[98%]"></div>
        </div>
      </div>
    </div>
  );
};

export default LaptopMockup;




