import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from "next"

import prisma from '../../../lib/prisma';
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { title, content } = req.body;

  const session = await getServerSession(req, res, authOptions);
  const result = await prisma.post.create({
    data: {
      title: title,
      content: content,
      author: { connect: { email: session?.user?.email } },
    },
  });
  res.json(result);
}