import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Clock, Shield, ArrowLeft, RefreshCw, FileText, Copy } from "lucide-react";
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
  const [userName, setUserName] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeTime, setAccessCodeTime] = useState(30);
  const [canCopyUrl, setCanCopyUrl] = useState(false);
  
  // Connected users state
  const [connectedUsers, setConnectedUsers] = useState<Array<{username: string, isOwner: boolean}>>([]);
  
  // uploaded files list
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Generate random access code
  const generateAccessCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // AI SESSION STARTS HERE
  useEffect(() => {
    const checkSession = async () => {
      const guestToken = localStorage.getItem('guestToken');
      
      if (guestToken) {
        try {
          const response = await fetch('/api/CheckSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestToken })
          });
          const data = await response.json();
          
          if (data.sessionValid) {
            // Only restore if the room code matches or if no room code was provided
            if (!roomCode || data.roomCode === roomCode) {
              setRoomCode(data.roomCode);
              setUserName(data.username);
              setIsCreator(data.isHost);
              toast({
                title: "Session Restored",
                description: "Welcome back to your room!",
              });
              return; // Exit early - valid session found
            }
          }
          
          // Invalid session or wrong room - clear token
          localStorage.removeItem('guestToken');
        } catch (error) {
          console.error('Session check failed:', error);
          localStorage.removeItem('guestToken');
        }
      }
      
      // No valid session - redirect to join process if we have a room code
      if (roomCode) {
        toast({
          title: "Access Required",
          description: "Please enter the access code to join this room.",
          variant: "destructive",
        });
        navigate(`/?join=${roomCode}`);
      } else {
        // No room code and no session - go to home
        navigate('/');
      }
    };

    fetchFiles(); 
    checkSession();
  }, []); // Empty dependency array to run only on mount

  // 10-second timer to enable copy URL functionality
  useEffect(() => {
    if (roomCode && userName) {
      const timer = setTimeout(() => {
        setCanCopyUrl(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [roomCode, userName]);

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

  useEffect(() => {
    if (!roomCode) return; // Don't start polling until we have a room code
    
    const pollConnectedUsers = setInterval(async () => {
      const res = await fetch("/api/GetConnectedUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectedUsers(data.users);
      }
    }, 2000); // Poll every 2 seconds for connected users
    
    return () => clearInterval(pollConnectedUsers);
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
 /*
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
*/

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Files Uploaded",
          description: `${files.length} file(s) uploaded successfully.`,
        });
        fetchFiles(); // Refresh file list
      } else {
        toast({
          title: "Upload Failed",
          description: data.message || "Could not upload files.",
          variant: "destructive",
        });
      }
    };
 
  const handleDownload = async (fileName: string) => {
    const res = await fetch("/api/download", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: fileName }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}...`,
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Could not download file.",
        variant: "destructive",
      });
    }
  };

  const fetchFiles = async () => {
    const res = await fetch("/api/list_files", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      setUploadedFiles(data.files);
    }
  }

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

  const handleLeaveRoom = async () => {
    const guestToken = localStorage.getItem('guestToken');
    if (!guestToken) {
      toast({
        title: "Error",
        description: "No session found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/LeaveRoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken }),
      });

      if (response.ok) {
        localStorage.removeItem('guestToken');
        toast({
          title: "Left Room",
          description: "You have successfully left the room.",
        });
        navigate("/");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to leave room.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave room.",
        variant: "destructive",
      });
    }
  };

  const handleCopyRoomURL = () => {
    if (!canCopyUrl) {
      toast({
        title: "Please Wait",
        description: "Room information is still loading. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    if (!accessCode) {
      toast({
        title: "Access Code Loading",
        description: "Please wait for the access code to load.",
        variant: "destructive",
      });
      return;
    }

    const homeURL = window.location.origin;
    const copyText = `Hey! Come join my room!
${homeURL}

Room code: ${roomCode}
Access code: ${accessCode}`;
    
    navigator.clipboard.writeText(copyText).then(() => {
      toast({
        title: "Room Info Copied!",
        description: "Room details have been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Unable to copy room info to clipboard.",
        variant: "destructive",
      });
    });
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
                src="/lovable-uploads/roomy.png" 
                alt="Roomyshare Logo" 
                className="h-8 w-auto"
              />
              <Shield className="h-6 w-6 text-orange-300" />
              <h1 className="text-xl font-bold text-orange-100 tracking-wider">ROOMYSHARE</h1> 
              
              {/* Leave Room button for NON-OWNERS only */}
              {!isCreator && (
                <Button 
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white border-gray-600 font-mono font-bold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>LEAVE ROOM</span>
                </Button>
              )}
              
              {/* Host controls */}
              {isCreator && (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline"
                    onClick={handleCopyRoomURL}
                    disabled={!canCopyUrl}
                    className={`flex items-center space-x-2 font-mono font-bold ${
                      canCopyUrl 
                        ? 'bg-blue-700 hover:bg-blue-800 text-white border-blue-600' 
                        : 'bg-gray-500 text-gray-300 border-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Copy className="h-4 w-4" />
                    <span>{canCopyUrl ? 'COPY ROOM URL' : 'LOADING... (10s)'}</span>
                  </Button>
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
                </div>
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
                    className={`px-3 py-1 font-mono font-bold ${
                      user.isOwner 
                        ? 'bg-red-200 text-red-900' 
                        : user.username === userName 
                          ? 'bg-orange-200 text-orange-900' 
                          : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {user.username}
                    {user.isOwner && ' (HOST)'}
                    {user.username === userName && !user.isOwner && ' (YOU)'}
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
