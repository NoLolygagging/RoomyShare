
const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#7A5B47' }} className="border-t-4 border-orange-600 py-8 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="border-t border-orange-700 pt-6">
          <p className="text-orange-200 font-mono text-sm mb-2">
           UI Designed by <span className="text-orange-300 font-bold">Lovable AI</span> with countless edits by <span className="text-orange-300 font-bold cursor-help" title="psst..click the spinning floppy disk">our team.</span>
          </p>
          <p className="text-orange-300 font-mono text-xs mb-4">
            lovable.dev
          </p>
          <div className="border-t border-orange-600 pt-4">
            <p className="text-orange-300 font-mono text-xs">
              © {new Date().getFullYear()} Roomyshare. All rights reserved.
            </p>
            <p className="text-orange-400 font-mono text-xs mt-1">
              Created the <span className="text-orange-300 font-bold cursor-help" title="psst..click the spinning floppy disk"> team.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
