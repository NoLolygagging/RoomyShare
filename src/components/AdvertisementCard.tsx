
import { Card, CardContent } from "@/components/ui/card";

const AdvertisementCard = () => {
  return (
    <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-dashed border-4 border-orange-400 shadow-lg">
      <CardContent className="py-20 text-center">
        <div className="text-amber-800 text-lg font-bold font-mono tracking-wide">
          YOU CAN ADVERTISE HERE!
        </div>
        <p className="text-amber-700 text-sm mt-2 font-mono">
          Contact us to place your advertisement in this premium location.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdvertisementCard;
