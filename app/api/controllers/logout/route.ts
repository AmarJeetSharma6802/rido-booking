import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";

export async function POST() {
  try {
    const user = await authUser();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: null,
      },
    });
  } catch {
    // Even if auth lookup fails, clear browser cookies so logout still works.
  }

  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    expires: new Date(0),
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    expires: new Date(0),
  });

  return response;
}
