import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractTokenFromHeaders } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeaders(request.headers)
    
    if (!token) {
      return errorResponse('No token provided', 401)
    }

    // Delete the session
    await prisma.session.deleteMany({
      where: { token },
    })

    return successResponse(null, 'Logout successful')
  } catch (error) {
    return handleApiError(error)
  }
}