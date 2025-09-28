import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        {
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get user with detailed information
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { userId: userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        bookingType: true,
        status: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
      },
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { 
        booking: { userId: userId } 
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        transactionId: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        createdAt: true,
        booking: {
          select: {
            bookingNumber: true,
          },
        },
      },
    });

    // Get user statistics
    const bookingStats = await prisma.booking.groupBy({
      by: ["status"],
      where: { userId: userId },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const paymentStats = await prisma.payment.groupBy({
      by: ["status"],
      where: { 
        booking: { userId: userId } 
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      message: "User details retrieved successfully",
      data: {
        user: {
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
          updatedAt: user.updatedAt,
          stats: {
            totalBookings: user._count.bookings,
            totalPayments: user._count.payments,
          },
        },
        recentBookings: recentBookings.map((booking) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          type: booking.bookingType,
          status: booking.status,
          amount: booking.totalAmount,
          currency: booking.currency,
          createdAt: booking.createdAt,
        })),
        recentPayments: recentPayments.map((payment) => ({
          id: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          bookingNumber: payment.booking.bookingNumber,
          createdAt: payment.createdAt,
        })),
        statistics: {
          bookings: bookingStats.map((stat) => ({
            status: stat.status,
            count: stat._count.id,
            totalAmount: Number(stat._sum.totalAmount) || 0,
          })),
          payments: paymentStats.map((stat) => ({
            status: stat.status,
            count: stat._count.id,
            totalAmount: Number(stat._sum.amount) || 0,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch user details",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { 
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        {
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if user has bookings
    if (user._count.bookings > 0) {
      return NextResponse.json(
        {
          message: "Cannot delete user with existing bookings. Please deactivate instead.",
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
        deactivatedAt: new Date().toISOString(),
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
