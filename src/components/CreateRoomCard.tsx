
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const CreateRoomCard = () => {
  const [roomDuration, setRoomDuration] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    console.log("Create Room button clicked");

    const duration = parseInt(roomDuration);
    if (!duration || duration < 5 || duration > 1440) {
      toast({
        title: "Invalid duration",
        description: "Room duration must be between 5 and 1440 minutes.",
        variant: "destructive",
      });
      return;
    }
    // Generate random room code and navigate
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    await fetch("/api/CreateRoom", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ roomCode, duration })
    });

    navigate(`/room?code=${roomCode}&duration=${duration}&creator=true`);
  };


  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-800 text-white rounded-t-lg">
        <div className="mx-auto w-12 h-12 bg-amber-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Upload className="h-6 w-6 text-amber-200" />
        </div>
        <CardTitle className="text-xl font-bold tracking-wide">CREATE A ROOM</CardTitle>
        <CardDescription className="text-amber-200 font-mono text-sm">
          Set up a new secure transfer room with a custom duration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div>
          <Label htmlFor="room-duration" className="text-amber-900 font-bold font-mono">ROOM DURATION (MINUTES)</Label>
          <Input
            id="room-duration"
            type="number"
            placeholder="60"
            min={5}
            max={1440}
            value={roomDuration}
            onChange={(e) => setRoomDuration(e.target.value)}
            className="mt-1 bg-amber-50 border-2 border-amber-400 focus:border-orange-500 font-mono"
          />
          <p className="text-sm text-amber-800 mt-1 font-mono">this is a test change (24 hours)</p>
        </div>
        <Button type="button" onClick={handleCreateRoom} className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 hover:from-amber-800 hover:via-amber-900 hover:to-yellow-900 text-white font-bold tracking-wide shadow-lg border border-orange-400">
          CREATE ROOM
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateRoomCard;
