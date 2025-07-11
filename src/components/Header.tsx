
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header style={{ backgroundColor: '#7A5B47' }} className="shadow-lg border-b-4 border-orange-600 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3">
          <img 
            src="/lovable-uploads/FloatingMainPage.gif" 
            alt="Floating Animation" 
            className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-80 hover:opacity-100 transition-opacity duration-300"
            onClick={() => navigate('/developers')}
            title="Meet the developers!"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-100 tracking-wide sm:tracking-wider md:tracking-widest font-mono" style={{ fontFamily: 'Courier New, monospace', textShadow: '2px 2px 0px #000000' }}>ROOMYSHARE</h1>
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
