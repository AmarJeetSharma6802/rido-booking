import prisma from "@/app/api/db/primsa";
import { cookies, headers } from "next/headers";

interface JwtPayloadType {
  user_id: string;
}

const jwt = require("jsonwebtoken") as {
  verify: (token: string, secret: string) => JwtPayloadType | string;
};

export const authUser = async () => {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const token =
      cookieStore.get("accessToken")?.value ??
      headerStore.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.ACCESSTOKEN as string);

    if (typeof decoded === "string" || !decoded.user_id) {
      throw new Error("Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.user_id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
