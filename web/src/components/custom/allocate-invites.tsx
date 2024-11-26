"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/components/ui/use-toast";
import { allocateInvites } from "@/server/invite";

function AllocateInvites() {
  const [uses, setUses] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleAllocateInvites() {
    setLoading(true);
    try {
      const invite = await allocateInvites(uses);
      toast({
        title: "Invites allocated",
        description: `Uses: ${invite?.updatedCount}`,
        duration: 5000,
      });
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
        type="number"
        placeholder="Number of Uses"
        value={uses}
        onChange={(e) => setUses(parseInt(e.target.value))}
        className="mt-2"
      />
      <Button
        onClick={handleAllocateInvites}
        disabled={loading}
        className="mt-2"
      >
        Allocate
      </Button>
    </div>
  );
}

export { AllocateInvites };