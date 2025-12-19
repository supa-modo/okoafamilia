import { TbArrowBack, TbArrowRight } from "react-icons/tb";
import { Link } from "react-router-dom";

export interface NavbarProps {
  variant?: "full" | "simple";
  maxWidth?: "default" | "narrow";
}

const Navbar = ({ variant = "full", maxWidth = "default" }: NavbarProps) => {
  const maxWidthClass =
    maxWidth === "narrow" ? "max-w-4xl" : "max-w-screen-2xl";
  const heightClass = variant === "full" ? "h-16 lg:h-20" : "h-16";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className={`flex items-center justify-between ${heightClass}`}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center">
              <img
                src="/logo.webp"
                alt="logo"
                className="w-auto h-full object-cover"
              />
            </div>
            {variant === "full" && (
              <div>
                <h1 className="text-lg lg:text-xl font-extrabold text-primary-800 font-google">
                  Okoa Familia
                </h1>
                <p className="text-[0.65rem] lg:text-xs font-open pl-1 text-gray-700 -mt-0.5">
                  by Innovasure
                </p>
              </div>
            )}
            {variant === "simple" && (
              <div>
                <h1 className="text-lg lg:text-xl font-extrabold text-primary-800 font-google">
                  Okoa Familia
                </h1>
                <p className="text-[0.65rem] lg:text-xs font-open pl-1 text-gray-700 -mt-0.5">
                  by Innovasure
                </p>
              </div>
            )}
          </Link>

          {variant === "full" && (
            <div className="flex items-center gap-2 lg:gap-4">
              <Link
                to="/pay"
                className="px-4 lg:px-6 py-2 text-sm hidden lg:inline-flex font-bold font-google border-2  text-tertiary-700 bg-transparent hover:border-tertiary-700 rounded-full transition-colors shadow-lg shadow-tertiary-500/25"
              >
                Pay Daily Premium
              </Link>
              <Link
                to="/register"
                className="px-4 lg:px-6 py-1.5 lg:hidden text-[0.82rem] font-bold font-google border-2  text-tertiary-700 bg-transparent hover:border-tertiary-700 rounded-full transition-colors shadow-lg shadow-tertiary-500/25"
              >
                Jiandikishe Leo
              </Link>
              <Link
                to="/register"
                className="px-4 lg:px-6 py-2 lg:py-2.5 hidden lg:flex text-sm font-bold font-google text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-colors shadow-lg shadow-primary-500/25 items-center gap-1.5"
              >
                <span className="">Jiandikishe Leo</span>
                <TbArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {variant === "simple" && (
            <Link
              to="/"
              className="text-sm text-tertiary-600 hover:text-tertiary-800 transition-colors flex items-center gap-1.5"
            >
              <TbArrowBack className="w-4 h-4" />
              <span className="">Back to Home</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
