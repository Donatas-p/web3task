import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { SiweMessage } from "siwe";
import ironOptions from "@/config/ironOptions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case "POST":
      try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.validate(signature);

        if (fields.nonce !== req.session.nonce)
          return res.status(422).json({ message: "Invalid nonce." });

        console.log(await prisma.users.findMany());

        const user = await prisma.users.findFirst({
          where: {
            address: message.address,
          },
        });
        console.log(user);

        if (user) {
          await prisma.users.update({
            where: {
              address: message.address,
            },
            data: {
              issuedAt: message.issuedAt,
              nonce: message.nonce,
            },
          });
        } else {
          await prisma.users.create({
            data: {
              signature,
              address: message.address,
              issuedAt: message.issuedAt,
              nonce: message.nonce,
            },
          });
        }
        req.session.siwe = fields;
        await req.session.save();
        res.json({ ok: true });
      } catch (_error) {
        console.log(_error);
        res.json({ ok: false });
      }
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
