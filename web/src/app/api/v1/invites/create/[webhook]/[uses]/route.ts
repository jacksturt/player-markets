import prisma from '@/lib/db';
import { WEBHOOK_SECRET } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, {
  params,
}: {
  params: { webhook: string, uses: string }
}) {
  if (params.webhook !== WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Invalid webhook secret' }, { status: 401 });
  }

  const creator = await prisma.userProfile.findFirst({
    where: { username: "bangerdotlol" },
  });

  if (!creator) {
    return NextResponse.json({ message: 'Creation user not found' }, { status: 404 });
  }

  const newInvite = await prisma.invite.create({
    data: {
      code: Math.floor(100000 + Math.random() * 999999).toString(),
      inviterId: creator.id,
      uses: parseInt(params.uses),
    }
  });

  return NextResponse.json({ message: 'Invite created', code: newInvite.code });
}