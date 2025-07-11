import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import JoinRoomCard from "@/components/JoinRoomCard";
import CreateRoomCard from "@/components/CreateRoomCard";
import FeaturesSection from "@/components/FeaturesSection";
import LogoSection from "@/components/LogoSection";
import AdvertisementCard from "@/components/AdvertisementCard";
import SideAdvertisement from "@/components/SideAdvertisement";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [existingRoom, setExistingRoom] = useState<{roomCode: string, isOwner: boolean} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSession = async () => {
      const guestToken = localStorage.getItem('guestToken');
      if (!guestToken) return;

      try {
        const response = await fetch('/api/CheckSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestToken })
        });
        const data = await response.json();
        
        if (data.sessionValid) {
          setExistingRoom({
            roomCode: data.roomCode,
            isOwner: data.isHost
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    checkExistingSession();
  }, []);

  const handleRejoinRoom = () => {
    if (existingRoom) {
      navigate(`/room?code=${existingRoom.roomCode}`);
    }
  };
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
          {/* Existing Room Prompt */}
          {existingRoom && (
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-4 border-yellow-500 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-700 to-orange-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2 font-mono font-bold tracking-wide">
                    {existingRoom.isOwner && <Crown className="h-5 w-5 text-yellow-200" />}
                    <span>
                      {existingRoom.isOwner ? 'YOUR ROOM IS STILL ACTIVE' : 'YOU HAVE AN ACTIVE SESSION'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-orange-900 font-mono mb-4">
                      {existingRoom.isOwner 
                        ? `You are the owner of room ${existingRoom.roomCode}. Would you like to return to manage it?`
                        : `You are connected to room ${existingRoom.roomCode}. Would you like to return?`
                      }
                    </p>
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleRejoinRoom}
                        className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white font-mono font-bold"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>REJOIN ROOM {existingRoom.roomCode}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <JoinRoomCard />
            {!existingRoom ? (
              <CreateRoomCard />
            ) : (
              <Card className="bg-gradient-to-br from-red-100 to-red-200 border-4 border-red-500 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-t-lg">
                  <CardTitle className="text-center font-mono font-bold tracking-wide">
                   ⚠️ ACTIVE ROOM DETECTED ⚠️
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <img 
                    src="/lovable-uploads/roomerror.png" 
                    alt="Warning" 
                    className="mx-auto mb-4 max-w-32 h-auto rounded-lg shadow-lg border-2 border-red-400"
                  />
                  <p className="text-red-800 font-mono font-bold">
                    Either delete or leave the room you are in.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <FeaturesSection />

          <div className="mb-8">
            <AdvertisementCard />
          </div>
          <LogoSection />
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
