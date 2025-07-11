
import { useNavigate } from "react-router-dom";

const LogoSection = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-12">
      <div style={{ backgroundColor: '#7A5B47' }} className="p-8 rounded-lg shadow-2xl border-2 border-orange-500">
        <img 
          src="/lovable-uploads/3dgifmaker32020.gif" 
          alt="Roomyshare Logo" 
          className="h-40 w-auto mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity duration-300"
          onClick={() => navigate('/developers')}
          title="Meet the developers!"
        />
        <h2 className="text-2xl font-bold text-orange-100 mb-2 font-mono tracking-widest">ROOMYSHARE</h2>
        <p className="text-orange-200 font-mono">Turns out you can even nostalgia bait file uploading.</p>
      </div>
    </div>
  );
};

export default LogoSection;
