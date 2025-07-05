
import { Shield, Download, Users } from "lucide-react";

const FeaturesSection = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      <div className="text-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-amber-400 shadow-lg">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Shield className="h-8 w-8 text-amber-200" />
        </div>
        <h3 className="font-bold text-amber-900 mb-2 font-mono tracking-wide">PRIVATE VPN NETWORK</h3>
        <p className="text-amber-800 text-sm font-mono">All transfers are routed through our secure private network.</p>
      </div>
      <div className="text-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-amber-400 shadow-lg">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Download className="h-8 w-8 text-amber-200" />
        </div>
        <h3 className="font-bold text-amber-900 mb-2 font-mono tracking-wide">AUTO-DELETE</h3>
        <p className="text-amber-800 text-sm font-mono">Files are recursively deleted and securely overwritten after transfer.</p>
      </div>
      <div className="text-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-amber-400 shadow-lg">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Users className="h-8 w-8 text-amber-200" />
        </div>
        <h3 className="font-bold text-amber-900 mb-2 font-mono tracking-wide">ISOLATED ROOMS</h3>
        <p className="text-amber-800 text-sm font-mono">Each transfer happens in a completely isolated environment.</p>
      </div>
    </div>
  );
};

export default FeaturesSection;
