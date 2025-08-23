import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // Build the where clause
    let whereClause: any = {
      isActive: true,
    }

    if (role) {
      whereClause.role = role
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        patient: {
          select: {
            id: true,
            dateOfBirth: true,
            insuranceProvider: true,
          },
        },
        provider: {
          select: {
            id: true,
            specialty: true,
            department: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}