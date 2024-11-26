"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createInvite } from "@/server/invite";

function CreateInvite() {
  const [code, setCode] = useState("");
  const [uses, setUses] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleCreateInvite() {
    setLoading(true);
    try {
      const invite = await createInvite(code, uses);
      toast({
        title: "Invite created",
        description: `Code: ${invite?.code}, Uses: ${invite?.uses}`,
        duration: 5000,
      });
      setCode("");
      setUses(1);
    } catch (error: any) {
      toast({
        title: "Error creating invite",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center">
      <Input
        placeholder="Invite Code (optional)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-2"
      />
      <Input
        type="number"
        placeholder="Number of Uses"
        value={uses}
        onChange={(e) => setUses(parseInt(e.target.value))}
        className="mt-2"
      />
      <Button
        onClick={handleCreateInvite}
        disabled={loading}
        className="mt-2"
      >
        Create
      </Button>
    </div>
  );
}

export { CreateInvite };