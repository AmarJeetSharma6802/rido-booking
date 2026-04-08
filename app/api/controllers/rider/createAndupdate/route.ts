import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";
import { getDistance } from "@/app/api/utils/distance";
import { calculateFare } from "@/app/api/utils/fare";

const NEARBY_DRIVER_RADIUS_KM = 25;
const allowedRideTransitions = {
  pending: ["ongoing", "cancelled"],
  ongoing: ["complete", "cancelled"],
  complete: [],
  cancelled: [],
} as const;

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function GET() {
  try {
    const user = await authUser();

    if (user.role === "driver") {
      const driverProfile = await prisma.driver.findFirst({
        where: { userId: user.id },
      });

      if (!driverProfile) {
        return NextResponse.json(
          { message: "Driver profile not found" },
          { status: 404 },
        );
      }

      const activeRide = await prisma.ride.findFirst({
        where: {
          driverId: driverProfile.id,
          status: {
            in: ["pending", "ongoing"],
          },
        },
        include: {
          category: true,
          driver: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(
        {
          data: activeRide
            ? {
                ...activeRide,
                otp: null,
              }
            : null,
        },
        { status: 200 },
      );
    }

    const activeRide = await prisma.ride.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["pending", "ongoing"],
        },
      },
      include: {
        category: true,
        driver: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: activeRide }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authUser();

    const {
      pickup,
      destination,
      categoryId,
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude,
    } = await req.json();

    if (!pickup || !destination || !categoryId) {
      return NextResponse.json(
        { message: "pickup, destination and category required" },
        { status: 400 },
      );
    }

    const pickupLat = toNumber(pickupLatitude);
    const pickupLng = toNumber(pickupLongitude);
    const destinationLat = toNumber(destinationLatitude);
    const destinationLng = toNumber(destinationLongitude);

    if (
      pickupLat === null ||
      pickupLng === null ||
      destinationLat === null ||
      destinationLng === null
    ) {
      return NextResponse.json(
        { message: "Location permission ya destination location missing hai" },
        { status: 400 },
      );
    }

    const category = await prisma.vehicleCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Invalid category" },
        { status: 400 },
      );
    }

    const existingRide = await prisma.ride.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["pending", "ongoing"],
        },
      },
    });

    if (existingRide) {
      return NextResponse.json(
        { message: "You already have an active ride" },
        { status: 400 },
      );
    }

    const distance = getDistance(
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
    );

    const fare = calculateFare(category.baseFare, category.perKmRate, distance);
    const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
      },
      include: {
        category: true,
      },
    });

    const nearbyDrivers = drivers
      .map((driver) => ({
        driver,
        distanceKm: getDistance(
          pickupLat,
          pickupLng,
          driver.latitude,
          driver.longitude,
        ),
      }))
      .filter((item) => item.distanceKm <= NEARBY_DRIVER_RADIUS_KM)
      .sort((a, b) => {
        const aCategoryScore = a.driver.categoryId === categoryId ? 0 : 1;
        const bCategoryScore = b.driver.categoryId === categoryId ? 0 : 1;

        if (aCategoryScore !== bCategoryScore) {
          return aCategoryScore - bCategoryScore;
        }

        return a.distanceKm - b.distanceKm;
      });

    const selectedDriver = nearbyDrivers[0]?.driver;

    if (!selectedDriver) {
      return NextResponse.json(
        { message: "No nearby online driver found. Driver dashboard me location online karo." },
        { status: 404 },
      );
    }

    const createRide = await prisma.ride.create({
      data: {
        userId: user.id,
        driverId: selectedDriver.id,
        categoryId: category.id,
        pickup,
        destination,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        destinationLatitude: destinationLat,
        destinationLongitude: destinationLng,
        estimatedDistanceKm: distance,
        estimatedFare: fare,
        otp: rideOtp,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
        isVerified: false,
        status: "pending",
      },
      include: {
        category: true,
        driver: true,
        user: true,
      },
    });

    return NextResponse.json(
      {
        message: "Ride created successfully. Share OTP with driver to start trip.",
        data: createRide,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authUser();

    const { rideId, status, otp } = await req.json();

    if (!rideId || !status) {
      return NextResponse.json(
        { message: "rideId and status are required" },
        { status: 400 },
      );
    }

    if (!["pending", "ongoing", "complete", "cancelled"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid ride status" },
        { status: 400 },
      );
    }

    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId,
      },
      include: {
        driver: true,
      },
    });

    if (!ride) {
      return NextResponse.json({ message: "Ride not found" }, { status: 404 });
    }

    const nextStatus = status as keyof typeof allowedRideTransitions;
    const currentStatus = ride.status as keyof typeof allowedRideTransitions;

    if (!allowedRideTransitions[currentStatus].includes(nextStatus as never)) {
      return NextResponse.json(
        {
          message:
            ride.status === "complete"
              ? "Completed ride cannot be started again"
              : ride.status === "cancelled"
                ? "Cancelled ride cannot be changed"
                : `Ride cannot move from ${ride.status} to ${status}`,
        },
        { status: 400 },
      );
    }

    if (user.role === "driver") {
      const driverProfile = await prisma.driver.findFirst({
        where: { userId: user.id },
      });

      if (!driverProfile || driverProfile.id !== ride.driverId) {
        return NextResponse.json(
          { message: "Unauthorized ride access" },
          { status: 403 },
        );
      }

      if (ride.status === "pending" && status === "ongoing") {
        if (!otp || otp.trim() !== ride.otp) {
          return NextResponse.json(
            { message: "Valid rider OTP required to start trip" },
            { status: 400 },
          );
        }

        if (ride.otpExpiry && ride.otpExpiry < new Date()) {
          return NextResponse.json(
            { message: "Ride OTP expired. Please rebook ride." },
            { status: 400 },
          );
        }
      }
    } else if (ride.userId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized ride access" },
        { status: 403 },
      );
    }

    const updatedRide = await prisma.ride.update({
      where: {
        id: rideId,
      },
      data: {
        status,
        ...(ride.status === "pending" && status === "ongoing"
          ? {
              isVerified: true,
            }
          : {}),
      },
      include: {
        category: true,
        driver: true,
        user: true,
      },
    });

    return NextResponse.json(
      {
        message: "Ride updated successfully",
        data: updatedRide,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
