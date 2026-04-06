import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";

export async function POST(req: Request) {
  const user = await authUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { driverId,message } = await req.json();

  if (!driverId || !message) {
    return NextResponse.json(
      { message: "userId, driverId and categoryId required" },
      { status: 400 },
    );
  }

  const driverID = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driverID) {
    return NextResponse.json({ message: "Driver not found" }, { status: 404 });
  }

  const createComplaint = await prisma.complaint.create({
    data: {
      userId: user.id,
      driverId: driverId,
      message,
    status: "pending",
    },
  });

  return NextResponse.json(
    {
      message: "Driver created successfully",
      createComplaint: createComplaint,
    },
    { status: 201 },
  );
}


export async function PATCH(req: Request) {
    
    const user = await authUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }


  const { complaintId, status } = await req.json();

  if (!complaintId || !status) {
    return NextResponse.json(
      { message: "complaintId and status required" },
      { status: 400 }
    );
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status:"resolved", 
    },
  });

  return NextResponse.json({
    message: "Complaint updated",
    data: updatedComplaint,
  });
}