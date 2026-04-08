import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";

export async function POST(req: Request) {
  try {
  const user = await authUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { rideId, categoryId, rating, reason } = await req.json();

  if (!rideId || !reason || typeof rating !== "number") {
    return NextResponse.json(
      { message: "rideId, rating and reason required" },
      { status: 400 },
    );
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: true,
      user: true,
    },
  });

  if (!ride) {
    return NextResponse.json({ message: "Ride not found" }, { status: 404 });
  }

  if (ride.userId !== user.id) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 403 },
    );
  }

  if (ride.status !== "complete") {
    return NextResponse.json(
      { message: "Ride not completed yet" },
      { status: 400 },
    );
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      rideId: ride.id,
    },
  });

  if (existingReview) {
    return NextResponse.json(
      { message: "Review already submitted for this ride" },
      { status: 400 },
    );
  }

  const createReview = await prisma.review.create({
    data: {
      userId: user.id,
      driverId: ride.driverId,
      rideId: ride.id,
      categoryId: categoryId ?? ride.categoryId,
      rating,
      reason,
    },
  });

  return NextResponse.json(
    {
      message: "Review submitted successfully",
      review: createReview,
    },
    { status: 201 },
  );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Review submit nahi hua" },
      { status: 500 },
    );
  }
}
