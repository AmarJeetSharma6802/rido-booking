import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const categories = await prisma.vehicleCategory.createMany({
      data: [
        { name: "Bike", baseFare: 20, perKmRate: 5, capacity: 1 },
        { name: "Auto", baseFare: 20, perKmRate: 8, capacity: 3 },
        { name: "Uber Go", baseFare: 40, perKmRate: 10, capacity: 4 },
        { name: "Uber XL", baseFare: 80, perKmRate: 18, capacity: 6 },
      ],
    });

    return NextResponse.json({ message: "Categories created", categories });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function GET() {
  const categories = await prisma.vehicleCategory.findMany();
  return NextResponse.json({ categories });
}