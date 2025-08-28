import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { AppointmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const providerId = searchParams.get('providerId')
    const patientId = searchParams.get('patientId')

    const whereClause: {
      patientId?: string
      providerId?: string
      startTime?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    // Role-based filtering
    if (user.role === 'PATIENT') {
      // Patients can only see their own appointments
      whereClause.patientId = user.patient?.id
    } else if (user.role === 'PROVIDER') {
      // Providers can see their own appointments
      whereClause.providerId = user.provider?.id
    }
    // Admins can see all appointments

    // Date filtering
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Additional filters
    if (providerId && user.role === 'ADMIN') {
      whereClause.providerId = providerId
    }
    if (patientId && (user.role === 'ADMIN' || user.role === 'PROVIDER')) {
      whereClause.patientId = patientId
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: appointments,
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const user = await verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const body = await request.json()
    
    const { dateTime, duration, type, notes, patientId, providerId } = body

    // Validate required fields
    if (!dateTime || !duration || !type || !patientId || !providerId) {
      return NextResponse.json(
        { error: 'Missing required fields: dateTime, duration, type, patientId, and providerId are required' },
        { status: 400 }
      )
    }

    // Check if user can create appointments
    if (user.role === 'PATIENT') {
      // Patients can only create appointments for themselves
      if (patientId !== user.patient?.id) {
        return NextResponse.json({ error: 'Patients can only create appointments for themselves' }, { status: 403 })
      }
    }


    // Check for scheduling conflicts
    const appointmentDateTime = new Date(dateTime)
    const endDateTime = new Date(appointmentDateTime.getTime() + duration * 60000)

      appointmentDateTime,
      endDateTime,
      providerId
    })

    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        providerId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: appointmentDateTime } },
              { 
                startTime: { 
                  gte: new Date(appointmentDateTime.getTime() - 60 * 60000) // Check 1 hour buffer
                }
              }
            ],
          },
          {
            AND: [
              { startTime: { gte: appointmentDateTime } },
              { startTime: { lt: endDateTime } }
            ],
          },
        ],
      },
    })


    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing appointment' },
        { status: 409 }
      )
    }


    // AI No-show prediction stub
    const noShowRisk = Math.random() * 0.8 // Random risk between 0-80%
    

    const appointment = await prisma.appointment.create({
      data: {
        title: type,
        description: notes || '',
        startTime: appointmentDateTime,
        endTime: endDateTime,
        type,
        notes: notes || '',
        status: AppointmentStatus.SCHEDULED,
        patientId,
        providerId,
        createdById: user.id,
        noShowProbability: noShowRisk,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })


    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    })
  } catch (error) {
    console.error('🚨 Error creating appointment:', error)
    
    // Log additional error details
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}