
import Header from "@/components/Header";
import JoinRoomCard from "@/components/JoinRoomCard";
import CreateRoomCard from "@/components/CreateRoomCard";
import FeaturesSection from "@/components/FeaturesSection";
import LogoSection from "@/components/LogoSection";
import AdvertisementCard from "@/components/AdvertisementCard";
import SideAdvertisement from "@/components/SideAdvertisement";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#7A5B47', fontFamily: 'monospace' }}>
      <Header />

      {/* Main Content with Side Ads */}
      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 gap-6">
        {/* Left Advertisement */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <SideAdvertisement position="left" />
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <JoinRoomCard />
            <CreateRoomCard />
          </div>

          <FeaturesSection />
          <LogoSection />
          <AdvertisementCard />
        </main>

        {/* Right Advertisement */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <SideAdvertisement position="right" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
