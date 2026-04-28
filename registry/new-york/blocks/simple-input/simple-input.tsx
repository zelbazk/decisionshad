import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SimpleInput() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="simple-input">Label</Label>
      <Input id="simple-input" placeholder="Enter text..." />
    </div>
  );
}
