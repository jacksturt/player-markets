"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/components/ui/use-toast";
import { changeCode } from "@/server/invite";
import { Loader2 } from "lucide-react";

function ChangeCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleChangeCode() {
    setLoading(true);
    try {
      const newCode = await changeCode(code);
      toast({
        title: "Code changed",
        description: `Code: ${newCode}`,
        duration: 5000,
      });
      setCode("");
    } catch (error: any) {
      toast({
        title: "Error changing invite code",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-5 mt-4">
      <Input
        className="px-4 py-2 text-lg"
        type="string"
        placeholder="Change Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button onClick={handleChangeCode} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Changing" : "Change"}
      </Button>
    </div>
  );
}

export { ChangeCode };