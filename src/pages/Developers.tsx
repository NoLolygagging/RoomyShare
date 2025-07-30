import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Linkedin } from "lucide-react";

const Developers = () => {
  const navigate = useNavigate();

  const developers = [ // I need to stop spelling things wrong. (╯°Д°)╯︵ ┻━┻

    {
      id: 1,
      name: "Luke McEachern",
      role: "Algorithm Designer, Programing Specialist & Network Storage Specialist",
      description: "Luke McEachern has been around technology since he was a kid. His love for all things with a 1 and 0, has led him to closing out a Information Technology Services diploma at the Southern Alberta Institute of Technology. With skills in OOP, networking, cloud architecture, and even a award in algorithm design, he was crucial in bringing Roomyshare to life. He looks forward to how the world of technology with evolve and hopes to build a meaningful career with the hobby he grew up with.",
      image: "/lovable-uploads/dev1.png",
      linkedin: ""
    },
    {
      id: 2,
      name: "Muhammad Mohammad", 
      role: "Flask Specialist, Dependency Manager & Networking Specialist",
      description: "Muhammad is a last semester IT student at the Southern Alberta Institute of technology. He has worked on RoomyShare with his fellow developers, specifically on file upload and download and room functionalities. He currently possesses strong experience in networking, virtualization, server administration, and IT service management platforms like ServiceNow. He also has skills in communication, teamwork, and documentation from the many projects he participated in including RoomyShare.",
      image: "/lovable-uploads/dev2.png",
      linkedin: ""
    },
    {
      id: 3,
      name: "Janeah Mae Obaldo",
      role: "Booth Designer, Frontend Developer & Project Delivery Organizer",
      description: "Janeah Mae Obaldo is an international student currently enrolled in the Information Technology Services program at the Southern Alberta Institute of Technology. Her passion for gaming and interest in PC building sparked her curiosity in the IT field. With a growing enthusiasm for technology, she is developing her skills in the field of technology, aiming to build a strong foundation for a future career in the IT industry.",
      image: "/lovable-uploads/dev4.png",
      linkedin: ""
    },
    {
      id: 4,
      name: "Victoria Louise Taningco",
      role: "Booth Designer, Frontend Developer & Project Delivery Organizer",
      description: "Hi! I'm Victoria Taningco and I'm an international student from the Philippines. I have found out that my heart is in learning about technology. When I was in high school, I was part of our school's robotics club.I want to know how technology works in the background and I want to enhance my skills and knowledge in the IT industry. Since technology is getting broader and wider day by day, I want to learn and test the different trending applications that most people use. And that's why this project is very important to me, it's not just a project, it's a core part of who I am.",
      image: "/lovable-uploads/dev5.png",
      linkedin: ""
    },
    {
      id: 5,
      name: "Mitchell Castro",
      role: "Assistant Project Delivery Organizer, Backend Developer & Testing Specialist",
      description: "Hello, My name is Mitchell Castro, an IT student at SAIT. I took the IT program for my love and interest in computers. It started with building PCs, having to learn how each parts works with each other sparks my interest in the world of technology. Coming in this program, I had little to no knowledge about technologies. As I reach my final time here on SAIT, I have learned a lot and I am excited to apply the knowledge I have learned into the real world and keep developing my skills.",
      image: "/lovable-uploads/dev3.png",
      linkedin: ""
    },
    {
      id: 6,
      name: "Umar Mohammed",
      role: " Initial Project Visionary, Frontend Developer & Testing Specialist",
      description: "I am Umar Mohammed, a final-semester IT student at Southern Alberta Institute of Technology. My passion for technology grew as I worked hands-on with networking, automation, firewalls, and virtualization. I am fascinated by how systems work behind the scenes and enjoy building real solutions using tools like Proxmox, Ansible, and Palo Alto. As tech continues to evolve rapidly, I'm driven to stay ahead by learning, testing, and applying what I know in meaningful ways. This project matters to me because it reflects my growth, dedication, and the future I see for myself in the IT industry.",
      image: "/lovable-uploads/dev6.png",
      linkedin: ""
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
          <p className="text-orange-200 font-mono text-lg">The developers behind RoomyShare.</p>
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
                  {dev.role && (
                    <p className="text-orange-200 font-mono text-sm mt-2 tracking-wide">{dev.role}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-orange-900 font-mono text-sm mb-4 min-h-[60px]">
                  {dev.description}
                </p>
                
                {/* Social Links */}
                <div className="flex justify-center space-x-3">
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
