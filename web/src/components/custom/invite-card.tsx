import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CreateInvite } from "@/components/custom/create-invite";
import { AllocateInvites } from "@/components/custom/allocate-invites";
import { ChangeCode } from "@/components/custom/change-code";

interface InviteCardProps {
  username: string | null;
  twitterId: string | null;
  invites: { code: string; uses: number }[];
}

const InviteCard: React.FC<InviteCardProps> = ({ username, twitterId, invites }) => {
  const isAdmin = twitterId === "1433140607569088512";

  return (
    <div>
      <Card className="w-full border-[#f2c1fb] w-[430px]">
        <CardHeader className="text-center py-4">
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Invite Management" : "Invite Code"}
          </h1>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {isAdmin ? (
            <>
              <h1 className="text-2xl font-bold mt-4">Invite Codes</h1>
              <div className="flex flex-col items-center">
                {invites.map((invite, index) => (
                  <div key={index} className="flex flex-col items-center mb-2">
                    <p>Code: {invite.code}</p>
                    <p>Remaining Uses: {invite.uses}</p>
                  </div>
                ))}
              </div>
              <h1 className="text-2xl font-bold mt-4">Create Invite</h1>
              <CreateInvite />
              <h1 className="text-2xl font-bold mt-4">Allocate Invites</h1>
              <AllocateInvites />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                {invites.map((invite, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <p>Code: {invite.code}</p>
                    <p>Remaining Uses: {invite.uses}</p>
                  </div>
                ))}
              </div>
              <ChangeCode />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteCard;
