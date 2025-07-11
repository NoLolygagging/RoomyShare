
import { Shield } from "lucide-react";

const Header = () => {
  return (
    <header style={{ backgroundColor: '#7A5B47' }} className="shadow-lg border-b-4 border-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/roomy.png" 
              alt="Roomyshare Logo" 
              className="h-12 w-auto"
            />
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-orange-200" />
              <h1 className="text-3xl font-bold text-orange-100 tracking-wider">Roomyshare</h1>
            </div>
          </div>
        </div>
        <p className="text-center text-orange-200 mt-2 max-w-2xl mx-auto font-mono text-sm">
          Secure, easy file transfers through isolated rooms hosted behind our private VPN network. 
          All files are recursively deleted and securely overwritten once the transfer is complete.
        </p>
      </div>
    </header>
  );
};

export default Header;
