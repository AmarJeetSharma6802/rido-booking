import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import {authUser} from "@/app/api/middleware/auth.middleware"
import { getDistance } from "@/app/api/utils/distance";
import { calculateFare } from "@/app/api/utils/fare";

export async function POST(req: Request) {
  try {
    const user = await authUser();

    const { driverId, pickup, destination ,pickupLatitude,categoryId ,pickupLongitude,destinationLatitude,destinationLongitude} = await req.json();

    if (!driverId || !pickup || !destination ||!categoryId) {
      return NextResponse.json(
        { message: "driverId, pickup, destination required" },
        { status: 400 }
      );
    }
    const category = await prisma.vehicleCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
          return NextResponse.json(
            { message: "Invalid category" },
            { status: 400 }
          );
        }

    const existingRide = await prisma.ride.findFirst({
      where: {
        userId :user.id ,
        status: {
          in: ["pending", "ongoing"],
        },
      },
    });

    if (existingRide) {
      return NextResponse.json(
        { message: "You already have an active ride" },
        { status: 400 }
      );
    }

     const distance = getDistance(
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude
    );

    const fare = calculateFare(
      category.baseFare,
      category.perKmRate,
      distance
    );

    const drivers = await prisma.driver.findMany({
  where: {
    isOnline: true,
    categoryId: categoryId, 
  },
});

    let selectedDriver = null;

       for (const driver of drivers) {
          const d = getDistance(
            pickupLatitude,
            pickupLongitude,
            driver.latitude,
            driver.longitude
          );
    
          if (d <= 2) {
            selectedDriver = driver;
            break;
          }
        }
    
        if (!selectedDriver) {
          return NextResponse.json(
            { message: "No nearby driver found" },
            { status: 404 }
          );
        }

     const createRide = await prisma.ride.create({
      data: {
        userId: user.id,
        driverId:selectedDriver.id,
        categoryId: category.id,
        pickup,         
        destination,    
        pickupLatitude,
        pickupLongitude,
        destinationLatitude,
        destinationLongitude,
        estimatedDistanceKm:distance,
        estimatedFare: fare,
        status: "pending",
      },
      include: {
        category: true,
        driver: true, 
      },
    });

    return NextResponse.json(
      {
        message: "Ride created successfully",
        data: createRide,
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PUT(req: Request) {

  const user = await authUser();

  if (!user) {
      return NextResponse.json(
        { message: "You are bot logged in" },
        { status: 400 }
      );
    }

  try {
    const { rideId, status } = await req.json();

    if (!rideId || !status) {
      return NextResponse.json(
        { message: "rideId and status are required" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.findUnique({
  where: {
    id: rideId, 
  },
});

if (!ride) {
  return NextResponse.json({ message: "Ride not found" }, { status: 404 });
}

    if (ride?.status === "complete") {
  return NextResponse.json(
    { message: "Completed ride cannot be cancelled" },
    { status: 400 }
  );
}

    const updatedRide = await prisma.ride.update({
      where: {
        id: rideId, 
      },
      data: {
       status: "cancelled",
      },
    });

    return NextResponse.json(
      {
        message: "Ride updated successfully",
        data: updatedRide,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// $near, $geometry, $maxDistance MongoDB ke hi operators hain
// location: {
//   $near: {
//     $geometry: {
//       type: "Point",
//       coordinates: [lng, lat],
//     },
//     $maxDistance: 5000,
//   },

// Mujhe is location ke paas wale drivers chahiye (5km ke andar)


// 1️⃣ $near

// 👉 MongoDB operator
// 👉 nearest data find karta hai (distance ke basis par)

// 📌 Example:
// Tum Delhi me ho
// Ye closest drivers return karega


// 2️⃣ $geometry

// 👉 batata hai location ka type kya hai

// $geometry: {
//   type: "Point",
//   coordinates: [lng, lat],
// }

// 👉 MongoDB me format hamesha:

// [lng, lat] ❗ (lat, lng nahi)


// 3️⃣ $maxDistance

// 👉 maximum distance limit (meters me)

// $maxDistance: 5000

// 👉 matlab:
// 👉 5 km ke andar ke drivers