import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const JoinRoomCard = () => {
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState(searchParams.get("join") || "");
  const [accessCode, setAccessCode] = useState("");
  const navigate = useNavigate();

  // Auto-focus access code if room code is pre-filled
  useEffect(() => {
    if (searchParams.get("join")) {
      const accessCodeInput = document.getElementById("accessCode");
      if (accessCodeInput) {
        accessCodeInput.focus();
      }
    }
  }, [searchParams]);

  const handleJoinRoom = async () => {
    if (roomCode.length < 5) {
      toast({
        title: "Room code required",
        description: "Please enter the full room code (e.g. ABCD123).",
        variant: "destructive"
      });
      return;
    }
    if (accessCode.length !== 4) {
      toast({
        title: "Invalid access code",
        description: "Please enter the 4-digit access code.",
        variant: "destructive"
      });
      return;
    }

    const guestToken = localStorage.getItem('guestToken');
    const requestBody: { roomCode: string; accessCode: string; guestToken?: string } = { roomCode, accessCode };
    if (guestToken) {
      requestBody.guestToken = guestToken;
    }

    const response = await fetch("/api/JoinRoom", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const data = await response.json();
      toast({
        title: "Room not found",
        description: data.message || "The room code or access code is incorrect.",
        variant: "destructive"
      });
      return;
    }

    const data = await response.json();
    if (data.success && data.guestToken) {
      // Store the guest token for session management
      localStorage.setItem('guestToken', data.guestToken);
      toast({
        title: "Joined successfully!",
        description: "Welcome to the room.",
      });
      // Navigate with only the room code - no sensitive data in URL
      navigate(`/room?code=${roomCode}`);
    }
  };

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-800 text-white rounded-t-lg">
        <div className="mx-auto w-12 h-12 bg-amber-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Users className="h-6 w-6 text-amber-200" />
        </div>
        <CardTitle className="text-xl font-bold tracking-wide">JOIN A ROOM</CardTitle>
        <CardDescription className="text-amber-200 font-mono text-sm">
          Enter the room code and access code to join an existing transfer room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div>
          <Label htmlFor="room-code" className="text-amber-900 font-bold font-mono">ROOM CODE</Label>
          <Input
            id="room-code"
            placeholder="ABCD123"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 7))}
            className="mt-1 bg-amber-50 border-2 border-amber-400 focus:border-orange-500 font-mono"
            maxLength={7}
          />
        </div>
        <div>
          <Label htmlFor="access-code" className="text-amber-900 font-bold font-mono">4-DIGIT ACCESS CODE</Label>
          <Input
            id="accessCode"
            placeholder="1234"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="mt-1 text-center tracking-widest font-mono text-lg bg-amber-50 border-2 border-amber-400 focus:border-orange-500"
            maxLength={4}
          />
        </div>
        <Button onClick={handleJoinRoom} className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 hover:from-amber-800 hover:via-amber-900 hover:to-yellow-900 text-white font-bold tracking-wide shadow-lg border border-orange-400">
          JOIN ROOM
        </Button>
      </CardContent>
    </Card>
  );
};

export default JoinRoomCard;