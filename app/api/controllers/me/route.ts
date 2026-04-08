import { authUser } from "@/app/api/middleware/auth.middleware";
import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await authUser();
    const driverProfile =
      user.role === "driver"
        ? await prisma.driver.findFirst({
            where: { userId: user.id },
            include: { category: true },
          })
        : null;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        driverProfile,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
