import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";
import { uploadBuffer } from "@/app/api/utils/cloudinary";

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function uploadDriverImage(driverImage: FormDataEntryValue | null) {
  if (!(driverImage instanceof File) || driverImage.size === 0) {
    return "";
  }

  if (!driverImage.type.startsWith("image/")) {
    throw new Error("Only image files allowed");
  }

  if (driverImage.size > 5 * 1024 * 1024) {
    throw new Error("Image must be less than 5MB");
  }

  const uploaded = await uploadBuffer(driverImage);
  return uploaded.secure_url;
}

export async function GET() {
  try {
    const user = await authUser();

    const driver = await prisma.driver.findFirst({
      where: { userId: user.id },
      include: { category: true },
    });

    return NextResponse.json({ data: driver }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const driverName = formData.get("driverName") as string;
    const numberPlate = formData.get("numberPlate") as string;
    const categoryId = formData.get("categoryId") as string;
    const isOnline = formData.get("isOnline") !== "false";
    const rating = toNumber(formData.get("rating"));
    const driverImage = formData.get("driverImage");
    const vehicleName = formData.get("vehicleName") as string;
    const latitude = toNumber(formData.get("latitude"));
    const longitude = toNumber(formData.get("longitude"));

    if (!driverName || !categoryId || !vehicleName) {
      return NextResponse.json(
        { message: "driverName, vehicleName and categoryId required" },
        { status: 400 },
      );
    }

    const category = await prisma.vehicleCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Invalid categoryId" },
        { status: 400 },
      );
    }

    let imageUrl = "";
    try {
      imageUrl = await uploadDriverImage(driverImage);
    } catch (imageError) {
      const message =
        imageError instanceof Error ? imageError.message : "Image upload failed";

      return NextResponse.json({ message }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "driver" },
    });

    const existingDriver = await prisma.driver.findFirst({
      where: { userId: user.id },
    });

    const driver = existingDriver
      ? await prisma.driver.update({
          where: { id: existingDriver.id },
          data: {
            driverName,
            numberPlate,
            isOnline,
            rating,
            latitude,
            longitude,
            categoryId,
            vehicleName,
            ...(imageUrl ? { driverImage: imageUrl } : {}),
          },
          include: {
            category: true,
          },
        })
      : await prisma.driver.create({
          data: {
            userId: user.id,
            driverName,
            numberPlate,
            isOnline,
            rating,
            latitude,
            longitude,
            categoryId,
            vehicleName,
            ...(imageUrl ? { driverImage: imageUrl } : {}),
          },
          include: {
            category: true,
          },
        });

    return NextResponse.json(
      {
        message: existingDriver
          ? "Driver updated successfully"
          : "Driver created successfully",
        data: driver,
      },
      { status: existingDriver ? 200 : 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const user = await authUser();

    const existingDriver = await prisma.driver.findFirst({
      where: { userId: user.id },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { message: "Driver profile not found" },
        { status: 404 },
      );
    }

    if (req.headers.get("content-type")?.includes("application/json")) {
      const { latitude, longitude, isOnline } = await req.json();

      const updatedDriver = await prisma.driver.update({
        where: { id: existingDriver.id },
        data: {
          ...(typeof latitude === "number" ? { latitude } : {}),
          ...(typeof longitude === "number" ? { longitude } : {}),
          ...(typeof isOnline === "boolean" ? { isOnline } : {}),
        },
        include: { category: true },
      });

      return NextResponse.json(
        {
          message: "Driver location updated",
          data: updatedDriver,
        },
        { status: 200 },
      );
    }

    const formData = await req.formData();
    const driverName = formData.get("driverName") as string;
    const numberPlate = formData.get("numberPlate") as string;
    const vehicleName = formData.get("vehicleName") as string;
    const driverImage = formData.get("driverImage");

    const updateData: {
      driverName?: string;
      numberPlate?: string;
      vehicleName?: string;
      driverImage?: string;
    } = {};
    if (driverName) updateData.driverName = driverName;
    if (numberPlate) updateData.numberPlate = numberPlate;
    if (vehicleName) updateData.vehicleName = vehicleName;

    const imageUrl = await uploadDriverImage(driverImage);
    if (imageUrl) updateData.driverImage = imageUrl;

    const updatedDriver = await prisma.driver.update({
      where: { id: existingDriver.id },
      data: {
        ...updateData,
      },
      include: { category: true },
    });

    return NextResponse.json(
      {
        message: "Driver updated successfully",
        data: updatedDriver,
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
