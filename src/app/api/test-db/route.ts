import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection and profileImage field...')
    
    const user = await verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test 1: Basic database connection
    const userCount = await prisma.user.count()
    console.log('✅ Database connected. Total users:', userCount)
    
    // Test 2: Check if profileImage field exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true
      }
    })
    
    console.log('✅ Current user data:', currentUser)
    
    // Test 3: Try to update profileImage
    const testImageUrl = `/test-image-${Date.now()}.jpg`
    console.log('🧪 Testing update with URL:', testImageUrl)
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: testImageUrl },
      select: {
        id: true,
        email: true,
        profileImage: true
      }
    })
    
    console.log('✅ Update successful:', updatedUser)
    
    // Test 4: Revert the change
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: currentUser?.profileImage }
    })
    
    console.log('✅ Test change reverted')
    
    return NextResponse.json({
      success: true,
      message: 'Database test completed successfully',
      results: {
        totalUsers: userCount,
        currentUser: currentUser,
        testUpdate: updatedUser,
        profileImageFieldExists: true
      }
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}