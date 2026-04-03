import prisma from "@/app/api/db/primsa";
import { NextResponse } from "next/server";
import transporter from "@/app/api/utils/nodemailer"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export async function POST(req:Request){

    const {name,email,password,otp, action} = await req.json()


    if(action === "register"){
        if(!name || !email || !password){
        return NextResponse.json({message:"All fiedls are required"})
        }

        const exists = await prisma.user.findUnique({ where: { email } });

        if (exists) {
        return NextResponse.json({ message: "Email already registered" },{status:400});
      }

        const salt = await bcrypt.genSalt(10)

        const hashedPassword = await bcrypt.hash(password, salt)

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);

        const userCreate =  await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role:"user",
          emailOtp: hashedOtp,
          emailOtpExpires: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

    await transporter.sendMail({
        to: email,
        subject: "Verify your email",
        html: `<h3>Your OTP is <b>${otpCode}</b></h3>`,
      })

    return NextResponse.json({ message: "ERegistered successfully. OTP sent" ,next: "verify_otp" ,userCreate },{status:201});

    }

    if(action === "verify-otp"){
        if (!email || !otp) {
        return NextResponse.json({ message: "Email and OTP required" ,next: "verify_otp" },{status:400});
      }

 const user = await prisma.user.findUnique({ where: { email } });

 if (!user)  return NextResponse.json({ message: "User not found"  },{status:404});

if (!user.emailOtp || user.emailOtpExpires! < new Date()) {
    return NextResponse.json(
    { message: "OTP expired or not found" },
    { status: 400 }
  );
}

const isValid = await bcrypt.compare(otp, user.emailOtp);

if (!isValid) {
    return NextResponse.json({ message: "Invalid OTP"  },{status:400});

    }

     const accessToken = jwt.sign(
        { user_id: user.id },
        process.env.ACCESSTOKEN!,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { user_id: user.id },
        process.env.REFRESHTOKEN!,
        { expiresIn: "7d" },
      );

      await prisma.user.update({
        where: { email },
        data: {
          emailOtp: null,
          emailOtpExpires: null,
          isVerified: true,
          refreshToken,
        },
      });
      
      const response = NextResponse.json(
    {
      message: "OTP verified. Logged in",
      accessToken,
      refreshToken,
    },
    { status: 200 }
  );

 
  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    path: "/",
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    path: "/",
  });

  return response;

    }

    if (action === "login") {
  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { message: "Please verify your email first" },
      { status: 403 }
    );
  }

  // 🔐 Password check
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 400 }
    );
  }

  const accessToken = jwt.sign(
    { user_id: user.id },
    process.env.ACCESSTOKEN!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { user_id: user.id },
    process.env.REFRESHTOKEN!,
    { expiresIn: "7d" }
  );

  await prisma.user.update({
    where: { email },
    data: {
      refreshToken,
    },
  });

  const response = NextResponse.json(
    {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    { status: 200 }
  );

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

}


