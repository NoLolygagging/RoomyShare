import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Clock, Shield, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const Room = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State for room data (will be set from URL params or session restore)
  const [roomCode, setRoomCode] = useState(searchParams.get("code") || "");
  const [userName, setUserName] = useState(searchParams.get("name") || "Anonymous");
  const [isCreator, setIsCreator] = useState(searchParams.get("creator") === "true");
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeTime, setAccessCodeTime] = useState(30);
  
  // Only show actually connected users (remove placeholders)
  const [connectedUsers] = useState([userName]);
  
  // Mock uploaded files list (around 30 items as requested)
  const [uploadedFiles, setUploadedFiles] = useState([ //This needs to be removed before launch as these are nothing burger files for testing
    "document_final_v2.pdf", "presentation_slides.pptx", "budget_2024.xlsx",
    "meeting_notes.docx", "project_timeline.pdf", "design_mockups.zip",
    "code_backup.tar.gz", "client_feedback.txt", "invoice_template.xlsx",
    "marketing_plan.pdf", "user_manual.docx", "database_schema.sql",
    "api_documentation.md", "test_results.csv", "logo_variations.zip",
    "contract_draft.pdf", "financial_report.xlsx", "team_photo.jpg",
    "wireframes.fig", "style_guide.pdf", "requirements_doc.docx",
    "performance_metrics.xlsx", "backup_files.zip", "changelog.txt",
    "user_stories.pdf", "architecture_diagram.png", "deployment_guide.md",
    "security_audit.pdf", "training_materials.zip", "compliance_checklist.xlsx"
  ]);

  // Generate random access code
  const generateAccessCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // AI SESSION STARTS HERE
  useEffect(() => {
    const checkSession = async () => {
      const guestToken = localStorage.getItem('guestToken');
      if (guestToken && !roomCode) { // Only check if we don't already have room data from URL
        try {
          const response = await fetch('/api/CheckSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestToken })
          });
          const data = await response.json();
          
          if (data.sessionValid) {
            // Restore room state from session
            setRoomCode(data.roomCode);
            setUserName(data.username);
            setIsCreator(data.isHost);
            toast({
              title: "Session Restored",
              description: "Welcome back to your room!",
            });
          } else {
            // Invalid session, clear token and redirect to home if no room data
            localStorage.removeItem('guestToken');
            if (!roomCode) {
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Session check failed:', error);
          localStorage.removeItem('guestToken');
          if (!roomCode) {
            navigate('/');
          }
        }
      }
    };

    checkSession();
  }, []); // Empty dependency array to run only on mount

  useEffect(() => {
    if (!roomCode) return; // Don't start timer until we have a room code
    
    const pollTimer = setInterval(async () => {
      const res = await fetch("/api/RoomTimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomCode }),
      });
      const data = await res.json();
      if (!data.success || data.timeLeft <= 0) {
        if (!isCreator) {
          toast({
            title: "Room Closed",
            description: "The host has closed this room or it has expired.",
            variant: "destructive",
          });
        }
        localStorage.removeItem('guestToken'); // Clear session on room close
        navigate("/");
        return;
      }
      setTimeRemaining(data.timeLeft);
    }, 1000);

    return () => clearInterval(pollTimer);
  }, [roomCode, navigate, toast, isCreator]);

  useEffect(() => {
    if (!roomCode) return; // Don't start polling until we have a room code
    
    const pollAccessCode = setInterval(async () => {
      const res = await fetch("/api/CurrentAccessCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAccessCode(data.accessCode);
        setAccessCodeTime(data.secondsLeft);
      }
    }, 1000);
    return () => clearInterval(pollAccessCode);
  }, [roomCode]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      toast({
        title: "Files Uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      });
    }
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    });
  };

  const handleDeleteRoom = async () => {
     await fetch("/api/DeleteRoom", {
    method: "POST",
    credentials: "include",
  });
    localStorage.removeItem('guestToken'); // Clear session when deleting room
    toast({
      title: "Room Deleted",
      description: "The room has been permanently deleted.",
      variant: "destructive",
    });
    navigate("/");
  };


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
                src="/lovable-uploads/773e41a9-e062-4b0c-9237-202057fccd00.png" 
                alt="Roomyshare Logo" 
                className="h-8 w-auto"
              />
              <Shield className="h-6 w-6 text-orange-300" />
              <h1 className="text-xl font-bold text-orange-100 tracking-wider">ROOMYSHARE</h1> 
              {/* Delete button */}
               {isCreator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 font-mono font-bold"
                  >
                    <span>DELETE ROOM</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-orange-900 font-mono font-bold">DELETE ROOM</AlertDialogTitle>
                    <AlertDialogDescription className="text-orange-800 font-mono">
                      Are you sure you want to delete this room? This action cannot be undone and all files will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-mono font-bold">CANCEL</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteRoom}
                      className="bg-red-700 hover:bg-red-800 font-mono font-bold"
                    >
                      DELETE ROOM
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Countdown Timer - Top Center */}
        <div className="text-center mb-8">
          <Card className="inline-block bg-gradient-to-br from-red-600 to-red-700 border-4 border-red-800 shadow-2xl">
            <CardContent className="py-4 px-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-red-100" />
                <div>
                  <div className="text-2xl font-mono font-bold text-red-100 tracking-widest">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-red-200 font-mono">TIME UNTIL ROOM DELETION</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Code and Access Code */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="text-lg font-mono font-bold tracking-widest">ROOM CODE</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-4xl font-mono font-bold text-orange-900 tracking-widest bg-orange-100 p-4 rounded border-2 border-orange-500">
                {roomCode}
              </div>
              <p className="text-sm text-orange-800 mt-2 font-mono">Share this code with others to join</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center justify-center space-x-2 font-mono font-bold tracking-widest">
                <span>ACCESS CODE</span>
                <RefreshCw className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-4xl font-mono font-bold text-orange-900 tracking-widest bg-orange-100 p-4 rounded border-2 border-orange-500">
                {accessCode}
              </div>
              <p className="text-sm text-orange-800 mt-2 font-mono">
                RESETS IN {accessCodeTime} SECONDS
              </p>
            </CardContent>
          </Card>
        </div>

        {/* File Transfer Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Upload Files */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 font-mono font-bold tracking-wide text-sm">
                <Upload className="h-4 w-4 text-orange-200" />
                <span>UPLOAD FILES</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-4 border-dashed border-orange-400 rounded-lg h-32 flex items-center justify-center hover:border-orange-600 transition-colors cursor-pointer relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="h-6 w-6 text-orange-700 mx-auto mb-2" />
                  <p className="text-orange-800 font-mono font-bold text-xs">DROP FILES HERE</p>
                  <p className="text-xs text-orange-700 mt-1 font-mono">MAX: 2GB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files List */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 font-mono font-bold tracking-wide text-sm">
                <FileText className="h-4 w-4 text-orange-200" />
                <span>UPLOADED FILES ({uploadedFiles.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-32 overflow-y-auto space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-1 rounded border border-orange-300 text-xs">
                    <span className="truncate flex-1 font-mono text-orange-900">
                      {file.length > 20 ? `${file.substring(0, 20)}...` : file}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Download Files */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 font-mono font-bold tracking-wide text-sm">
                <Download className="h-4 w-4 text-orange-200" />
                <span>DOWNLOAD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-32 overflow-y-auto space-y-1">
                {uploadedFiles.slice(0, 10).map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-1 rounded border border-orange-300">
                    <span className="text-xs truncate flex-1 font-mono text-orange-900">
                      {file.length > 15 ? `${file.substring(0, 15)}...` : file}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(file)}
                      className="ml-1 h-6 w-6 p-0 border border-orange-400 text-orange-800 hover:bg-orange-200"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Users - Bottom Center */}
        <div className="text-center">
          <Card className="inline-block bg-gradient-to-br from-orange-50 to-orange-100 border-4 border-orange-500 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-800 to-orange-700 text-white rounded-t-lg">
              <CardTitle className="text-lg font-mono font-bold tracking-widest">CONNECTED USERS</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-center gap-2">
                {connectedUsers.map((user, index) => (
                  <Badge 
                    key={index} 
                    className="px-3 py-1 font-mono font-bold bg-orange-200 text-orange-900"
                  >
                    {user} (YOU)
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-orange-800 mt-3 font-mono font-bold">
                {connectedUsers.length} USER{connectedUsers.length !== 1 ? 'S' : ''} CONNECTED
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Room;
