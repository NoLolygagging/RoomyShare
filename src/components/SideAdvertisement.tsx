
import { Card, CardContent } from "@/components/ui/card";

interface SideAdvertisementProps {
  position: "left" | "right";
}

const SideAdvertisement = ({ position }: SideAdvertisementProps) => {
  return (
    <div className="sticky top-8">
      <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-dashed border-4 border-orange-400 shadow-lg">
        <CardContent className="py-32 px-4 text-center">
          <div className="text-amber-800 text-sm font-bold font-mono tracking-wide mb-3">
            {position === "left" ? "LEFT BANNER" : "RIGHT BANNER"}
          </div>
          <div className="text-amber-700 text-xs font-mono mb-4">
            160x600
          </div>
          <div className="text-amber-600 text-xs font-mono leading-tight">
            Your advertisement could be here! Contact us for premium placement.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SideAdvertisement;
