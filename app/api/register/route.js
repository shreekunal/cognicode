import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";

import bcrypt from "bcrypt";
import dbConnect from '@/utils/dbConnect';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 5) {
      return Response.json(
        { error: 'Password must be at least 5 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create UserInfo first
    const userInfo = new UserInfo();
    const savedUserInfo = await userInfo.save();

    // Create user
    const createdUser = await User.create({
      email,
      password: hashedPassword,
      userInfo: savedUserInfo._id,
    });

    // Return user without password
    return Response.json({
      _id: createdUser._id,
      email: createdUser.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}