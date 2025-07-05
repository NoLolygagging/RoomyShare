import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
const JoinRoomCard = () => {
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();
  const handleJoinRoom = () => {
    if (!joinName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the room.",
        variant: "destructive"
      });
      return;
    }
    if (joinCode.length !== 4) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 4-digit room code.",
        variant: "destructive"
      });
      return;
    }
    // Navigate to room with parameters
    navigate(`/room?code=${joinCode}&name=${joinName}`);
  };
  return <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-800 text-white rounded-t-lg">
        <div className="mx-auto w-12 h-12 bg-amber-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Users className="h-6 w-6 text-amber-200" />
        </div>
        <CardTitle className="text-xl font-bold tracking-wide">JOIN A ROOM</CardTitle>
        <CardDescription className="text-amber-200 font-mono text-sm">
          Enter your name and room code to join an existing transfer room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div>
          <Label htmlFor="join-name" className="text-amber-900 font-bold font-mono">ROOM NAME</Label>
          <Input id="join-name" placeholder="Enter your name" value={joinName} onChange={e => setJoinName(e.target.value)} className="mt-1 bg-amber-50 border-2 border-amber-400 focus:border-orange-500 font-mono" />
        </div>
        <div>
          <Label htmlFor="join-code" className="text-amber-900 font-bold font-mono">4-DIGIT ROOM CODE</Label>
          <Input id="join-code" placeholder="ABCD" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))} className="mt-1 text-center tracking-widest font-mono text-lg bg-amber-50 border-2 border-amber-400 focus:border-orange-500" maxLength={4} />
        </div>
        <Button onClick={handleJoinRoom} className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 hover:from-amber-800 hover:via-amber-900 hover:to-yellow-900 text-white font-bold tracking-wide shadow-lg border border-orange-400">
          JOIN ROOM
        </Button>
      </CardContent>
    </Card>;
};
export default JoinRoomCard;