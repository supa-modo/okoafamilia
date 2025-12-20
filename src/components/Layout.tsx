import { ReactNode } from "react";
import Navbar, { NavbarProps } from "./Navbar";
import Footer, { FooterProps } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  navbarVariant?: NavbarProps["variant"];
  navbarMaxWidth?: NavbarProps["maxWidth"];
  footerVariant?: FooterProps["variant"];
  background?: string;
  contentClassName?: string;
}

const Layout = ({
  children,
  navbarVariant = "full",
  navbarMaxWidth = "default",
  footerVariant = "full",
  background = "bg-white",
  contentClassName = "",
}: LayoutProps) => {
  // Calculate padding-top based on navbar variant
  // full variant: h-16 (4rem) lg:h-20 (5rem), simple variant: h-16 (4rem)
  const paddingTop = navbarVariant === "full" ? "pt-16 lg:pt-20" : "pt-16";

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${background}`}>
      {/* Fixed Navbar */}
      <Navbar variant={navbarVariant} maxWidth={navbarMaxWidth} />

      {/* Scrollable Content Area */}
      <div className="overflow-y-auto">
        <main
          className={`flex-1 overflow-y-auto ${paddingTop} ${contentClassName}`}
        >
          {children}
        </main>
        {/* Footer inside scrollable area */}
        <Footer variant={footerVariant} />
      </div>
    </div>
  );
};

export default Layout;
