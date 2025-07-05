
const LogoSection = () => {
  return (
    <div className="text-center mb-12">
      <div style={{ backgroundColor: '#7A5B47' }} className="p-8 rounded-lg shadow-2xl border-2 border-orange-500">
        <img 
          src="/lovable-uploads/773e41a9-e062-4b0c-9237-202057fccd00.png" 
          alt="Roomyshare Logo" 
          className="h-24 w-auto mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-orange-100 mb-2 font-mono tracking-widest">ROOMYSHARE</h2>
        <p className="text-orange-200 font-mono">The retro way to share files securely</p>
      </div>
    </div>
  );
};

export default LogoSection;
