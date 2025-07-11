import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Linkedin, Globe } from "lucide-react";

const Developers = () => {
  const navigate = useNavigate();

  // Developer slots - you can fill these in with actual dev info
  const developers = [
    {
      id: 1,
      name: "Developer 1",
      description: "Add your description here",
      image: "/placeholder.svg",
      github: "",
      linkedin: "",
      website: ""
    },
    {
      id: 2,
      name: "Developer 2", 
      description: "Add your description here",
      image: "/placeholder.svg",
      github: "",
      linkedin: "",
      website: ""
    },
    {
      id: 3,
      name: "Developer 3",
      description: "Add your description here", 
      image: "/placeholder.svg",
      github: "",
      linkedin: "",
      website: ""
    },
    {
      id: 4,
      name: "Developer 4",
      description: "Add your description here",
      image: "/placeholder.svg", 
      github: "",
      linkedin: "",
      website: ""
    },
    {
      id: 5,
      name: "Developer 5",
      description: "Add your description here",
      image: "/placeholder.svg",
      github: "",
      linkedin: "",
      website: ""
    },
    {
      id: 6,
      name: "Developer 6",
      description: "Add your description here",
      image: "/placeholder.svg",
      github: "",
      linkedin: "",
      website: ""
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#7A5B47', fontFamily: 'monospace' }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 shadow-lg border-b-4 border-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 text-orange-200 hover:text-orange-100 hover:bg-orange-700 font-mono font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>BACK TO HOME</span>
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/roomy.png" 
                alt="Roomyshare Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-orange-100 tracking-wider">ROOMYSHARE DEVELOPERS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-orange-100 mb-4 font-mono tracking-widest">MEET THE TEAM</h2>
          <p className="text-orange-200 font-mono text-lg">The developers behind RoomyShare's retro file sharing magic</p>
        </div>

        {/* Developer Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {developers.map((dev) => (
            <Card key={dev.id} className="bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
                <div className="text-center">
                  <img 
                    src={dev.image}
                    alt={dev.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-orange-300 object-cover"
                  />
                  <CardTitle className="text-lg font-mono font-bold tracking-wide">{dev.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-orange-900 font-mono text-sm mb-4 min-h-[60px]">
                  {dev.description}
                </p>
                
                {/* Social Links */}
                <div className="flex justify-center space-x-3">
                  {dev.github && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-2 border-orange-400 text-orange-800 hover:bg-orange-200"
                      onClick={() => window.open(dev.github, '_blank')}
                    >
                      <Github className="h-4 w-4" />
                    </Button>
                  )}
                  {dev.linkedin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-2 border-orange-400 text-orange-800 hover:bg-orange-200"
                      onClick={() => window.open(dev.linkedin, '_blank')}
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  )}
                  {dev.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-2 border-orange-400 text-orange-800 hover:bg-orange-200"
                      onClick={() => window.open(dev.website, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fun Stats Section */}
        <div className="mt-16 text-center">
          <Card className="inline-block bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-orange-900 mb-4 font-mono tracking-widest">TEAM STATS</h3>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-orange-800 font-mono">6</div>
                  <div className="text-sm text-orange-700 font-mono">DEVELOPERS</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-800 font-mono">∞</div>
                  <div className="text-sm text-orange-700 font-mono">COFFEE CUPS</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-800 font-mono">100%</div>
                  <div className="text-sm text-orange-700 font-mono">RETRO VIBES</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Developers;
