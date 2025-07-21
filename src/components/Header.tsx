import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AcademicCompanion
            </Link>
          </div>
          
          <div className="-mr-2 -my-2 md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
          
          <nav className="hidden md:flex space-x-10">
            <a href="#features" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#about" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
          
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden">
            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-background divide-y-2 divide-border">
              <div className="pt-5 pb-6 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      AcademicCompanion
                    </span>
                  </div>
                  <div className="-mr-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsMenuOpen(false)}
                      className="inline-flex items-center justify-center p-2 rounded-md"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="mt-6">
                  <nav className="grid gap-y-8">
                    <a href="#features" className="text-base font-medium text-foreground hover:text-primary">
                      Features
                    </a>
                    <a href="#about" className="text-base font-medium text-foreground hover:text-primary">
                      About
                    </a>
                    <a href="#contact" className="text-base font-medium text-foreground hover:text-primary">
                      Contact
                    </a>
                    <Link to="/dashboard" className="text-base font-medium text-foreground hover:text-primary">
                      Dashboard
                    </Link>
                  </nav>
                </div>
              </div>
              <div className="py-6 px-5 space-y-6">
                <Button variant="hero" className="w-full">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;