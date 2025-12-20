import { TbPhoneCall } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa";

export interface FooterProps {
  variant?: "full" | "simple";
}

const Footer = ({ variant = "full" }: FooterProps) => {
  if (variant === "simple") {
    return (
      <footer className="py-6 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Okoa Familia by Innovasure
        </p>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 pt-10 lg:pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Partnership Logos */}
        <div className="text-center mb-10">
          <p className="text-gray-400 font-google text-sm mb-6">
            In Partnership With
          </p>
          <div className="flex items-center justify-center gap-0.5 md:gap-6 lg:gap-12 flex-wrap">
            <div className="flex items-center justify-center h-16 lg:h-20 px-4 py-2">
              <img
                src="/innovasure.webp"
                alt="Innovasure Logo"
                className="h-full w-auto max-w-[200px] object-contain "
              />
            </div>
            <div className="flex items-center justify-center h-20 lg:h-24 px-4 py-2">
              <img
                src="/birdview-logo.webp"
                alt="Birdview Logo"
                className="h-full w-auto bg white max-w-[200px] object-cover "
              />
            </div>
            <div className="flex items-center justify-center h-16 lg:h-20 px-4 py-2">
              <img
                src="/bnak.jpg"
                alt="Biashara Ndogo Logo"
                className="h-full w-auto max-w-[200px] object-contain "
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 ">
                <img
                  src="/logo.webp"
                  alt="Okoa Familia Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-white font-extrabold font-google text-base lg:text-lg">
                  Okoa Familia
                </h1>
                <p className="text-gray-400 text-xs -mt-1">by Innovasure</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="tel:+254729622622"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <TbPhoneCall className="w-5 h-5" />
                <span className="text-sm">+254 729 622 622</span>
              </a>
              <a
                href="https://wa.me/254729622622"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span className="text-sm">WhatsApp</span>
              </a>
            </div>

            <div className="flex flex-col font-google items-center lg:items-end gap-2">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Innovasure. All rights
                reserved.
              </p>
              <a
                href="https://innovasure.co.ke/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors underline underline-offset-2"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
