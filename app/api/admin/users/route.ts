import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const isVerified = searchParams.get("isVerified");
    const role = searchParams.get("role");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }

    if (isVerified !== null) {
      whereClause.isVerified = isVerified === "true";
    }

    if (role) {
      whereClause.role = role;
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          isVerified: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              payments: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    const verificationStats = await prisma.user.groupBy({
      by: ["isVerified"],
      _count: { id: true },
    });

    // Transform users data
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      isVerified: user.isVerified,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      stats: {
        totalBookings: user._count.bookings,
        totalPayments: user._count.payments,
      },
    }));

    return NextResponse.json({
      message: "Users retrieved successfully",
      data: {
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statistics: {
          byRole: userStats.map((stat) => ({
            role: stat.role,
            count: stat._count.id,
          })),
          byVerification: verificationStats.map((stat) => ({
            isVerified: stat.isVerified,
            count: stat._count.id,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch users",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      email, 
      firstName, 
      lastName, 
      phone, 
      isActive, 
      isVerified, 
      role 
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (role) updateData.role = role;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        lastLoginAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        role: updatedUser.role,
        lastLoginAt: updatedUser.lastLoginAt,
        updatedAt: updatedUser.updatedAt,
        stats: {
          totalBookings: updatedUser._count.bookings,
          totalPayments: updatedUser._count.payments,
        },
      },
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        message: "Failed to update user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Soft delete by deactivating user
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      message: "User deactivated successfully",
      data: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: `${deletedUser.firstName} ${deletedUser.lastName}`,
      },
    });
  } catch (error: any) {
    console.error("Error deactivating user:", error);
    return NextResponse.json(
      {
        message: "Failed to deactivate user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

