import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import { authUser } from "@/app/api/middleware/auth.middleware";
import { uploadBuffer } from "@/app/api/utils/cloudinary";

interface driverTypes {
  driverName: string;
  numberPlate?: string;
  isOnline?: boolean;
  rating?: number;
  categoryId: string;
  vehicleName?:string
}

export async function POST(req: Request) {
  try {
    const user = await authUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // const body: driverTypes = await req.json();

    const formData = await req.formData();

    const driverName = formData.get("driverName") as string;
    const numberPlate = formData.get("numberPlate") as string;
    const categoryId = formData.get("categoryId") as string;
    const isOnline = formData.get("isOnline") === "true" ? true : false;
    const rating = Number(formData.get("rating"));
    const driverImage = formData.get("driverImage") as File;
    const vehicleName = formData.get("vehicleName") as string; 

    // const tmp = path.join(os.tmpdir(), driverImage.name);
    // await fs.writeFile(tmp, Buffer.from(await driverImage.arrayBuffer()));
    // const uploaded = await uploadFile(tmp);

    let imageUrl = "";
    if (driverImage && driverImage.size > 0) {
      const uploaded: any = await uploadBuffer(driverImage);
      imageUrl = uploaded.secure_url;
    }


    if (!imageUrl) {
      return NextResponse.json(
        { error: "Cloudinary image upload failed" },
        { status: 500 },
      );
    }

   

    if (!driverName || !categoryId) {
      return NextResponse.json(
        { message: "driverName and categoryId required" },
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

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        driverName,
        numberPlate,
        isOnline: isOnline ?? true,
        rating: rating ?? 0,
        latitude: 0,
        longitude: 0,
        categoryId,
        driverImage:imageUrl,
        vehicleName
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        message: "Driver created successfully",
        data: driver,
      },
      { status: 201 },
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
  const user = await authUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const driverName = formData.get("driverName") as string;
  const numberPlate = formData.get("numberPlate") as string;
  const driverImage = formData.get("driverImage") as File;

  if (!driverName) {
    return NextResponse.json(
      { message: "driverName and categoryId required" },
      { status: 400 },
    );
  }

  const existingDriver = await prisma.driver.findFirst({
    where: { userId: user.id },
  });

  if (!existingDriver) {
    return NextResponse.json(
      { message: "Driver profile not found" },
      { status: 404 },
    );
  }

  const updateData: any = {};
if (driverName) updateData.driverName = driverName;
if (numberPlate) updateData.numberPlate = numberPlate;
  

    if (driverImage && driverImage.size > 0) {
      // 🔒 File type check
      if (!driverImage.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "Only image files allowed" },
          { status: 400 }
        );
      }

      // 🔒 Size check (2MB)
      if (driverImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Image must be less than 5MB" },
          { status: 400 }
        );
      }

      const uploaded = await uploadBuffer(driverImage);

      updateData.driverImage = uploaded.secure_url;
    }

  const updatedDriver = await prisma.driver.update({
    where: { id: existingDriver.id },
    data: {
      ...updateData,
    },
    include: { category: true },
  });
  
  return NextResponse.json({
      message: "Driver updated successfully",
      data: updatedDriver,
    }, { status: 200 });
}
