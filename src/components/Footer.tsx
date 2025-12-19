import { TbShieldCheck, TbPhone } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa";

interface FooterProps {
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
    <footer className="bg-gray-900 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Partnership Logos */}
        <div className="text-center mb-10">
          <p className="text-gray-400 text-sm mb-6">In Partnership With</p>
          <div className="flex items-center justify-center gap-8 lg:gap-16 flex-wrap">
            <div className="text-center">
              <div className="h-10 lg:h-12 flex items-center justify-center mb-2">
                <span className="text-xl lg:text-2xl font-bold text-white font-lexend">
                  Innovasure
                </span>
              </div>
              <p className="text-xs text-gray-500">Platform Owner</p>
            </div>
            <div className="text-center">
              <div className="h-10 lg:h-12 flex items-center justify-center mb-2">
                <span className="text-xl lg:text-2xl font-bold text-secondary-400 font-lexend">
                  Birdview
                </span>
              </div>
              <p className="text-xs text-gray-500">Insurance Provider</p>
            </div>
            <div className="text-center">
              <div className="h-10 lg:h-12 flex items-center justify-center mb-2">
                <span className="text-xl lg:text-2xl font-bold text-primary-400 font-lexend">
                  Biashara Ndogo
                </span>
              </div>
              <p className="text-xs text-gray-500">On-Ground Agent</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                <TbShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold font-lexend">
                Okoa Familia
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="tel:+254729622622"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <TbPhone className="w-5 h-5" />
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

            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Innovasure. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

