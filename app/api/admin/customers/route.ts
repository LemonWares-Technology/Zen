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
    const hasBookings = searchParams.get("hasBookings");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }

    if (isVerified !== null) {
      whereClause.isVerified = isVerified === "true";
    }

    // Get customers with pagination
    const [customers, totalCount] = await Promise.all([
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

    // Filter customers with bookings if requested
    let filteredCustomers = customers;
    if (hasBookings === "true") {
      filteredCustomers = customers.filter(customer => customer._count.bookings > 0);
    } else if (hasBookings === "false") {
      filteredCustomers = customers.filter(customer => customer._count.bookings === 0);
    }

    // Get customer statistics
    const customerStats = await prisma.user.groupBy({
      by: ["isVerified"],
      _count: { id: true },
    });

    const activeStats = await prisma.user.groupBy({
      by: ["isActive"],
      _count: { id: true },
    });

    // Transform customers data
    const transformedCustomers = filteredCustomers.map((customer) => ({
      id: customer.id,
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      lastLoginAt: customer.lastLoginAt,
      createdAt: customer.createdAt,
      stats: {
        totalBookings: customer._count.bookings,
        totalPayments: customer._count.payments,
      },
    }));

    return NextResponse.json({
      message: "Customers retrieved successfully",
      data: {
        customers: transformedCustomers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statistics: {
          byVerification: customerStats.map((stat) => ({
            isVerified: stat.isVerified,
            count: stat._count.id,
          })),
          byActive: activeStats.map((stat) => ({
            isActive: stat.isActive,
            count: stat._count.id,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch customers",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      password,
      isActive = true,
      isVerified = false,
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        {
          message: "Email, first name, and last name are required",
        },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.user.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message: "Customer with this email already exists",
        },
        { status: 409 }
      );
    }

    // Create new customer
    const newCustomer = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        password: password || "temp_password_123", // Default password, should be changed
        isActive,
        isVerified,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Customer created successfully",
      data: {
        id: newCustomer.id,
        email: newCustomer.email,
        name: `${newCustomer.firstName} ${newCustomer.lastName}`,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        phone: newCustomer.phone,
        isActive: newCustomer.isActive,
        isVerified: newCustomer.isVerified,
        role: newCustomer.role,
        createdAt: newCustomer.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      {
        message: "Failed to create customer",
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
      customerId,
      email,
      firstName,
      lastName,
      phone,
      isActive,
      isVerified,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        {
          message: "Customer ID is required",
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

    // Update customer
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
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
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Customer updated successfully",
      data: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        name: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        phone: updatedCustomer.phone,
        isActive: updatedCustomer.isActive,
        isVerified: updatedCustomer.isVerified,
        role: updatedCustomer.role,
        updatedAt: updatedCustomer.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        message: "Failed to update customer",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        {
          message: "Customer ID is required",
        },
        { status: 400 }
      );
    }

    // Check if customer has bookings
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Check if customer has bookings
    if (customer._count.bookings > 0) {
      return NextResponse.json(
        {
          message: "Cannot delete customer with existing bookings. Please deactivate instead.",
        },
        { status: 400 }
      );
    }

    // Soft delete by deactivating customer
    const deletedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      message: "Customer deactivated successfully",
      data: {
        id: deletedCustomer.id,
        email: deletedCustomer.email,
        name: `${deletedCustomer.firstName} ${deletedCustomer.lastName}`,
        deactivatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error deactivating customer:", error);
    return NextResponse.json(
      {
        message: "Failed to deactivate customer",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
