import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO, Socket } from 'socket.io'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO
    }
  }
}

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

// Socket.io event types
export interface ServerToClientEvents {
  newMessage: (message: {
    id: string
    content: string
    senderId: string
    senderName: string
    receiverId: string
    timestamp: string
    isRead: boolean
  }) => void
  
  appointmentUpdate: (appointment: {
    id: string
    title: string
    startTime: string
    status: string
    patientName: string
    providerName: string
    type: 'created' | 'updated' | 'cancelled'
  }) => void
  
  notification: (notification: {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    userId: string
    timestamp: string
  }) => void
  
  billingUpdate: (billing: {
    id: string
    patientName: string
    amount: number
    status: string
    type: 'payment' | 'overdue' | 'processed'
  }) => void
  
  userOnline: (user: { id: string; name: string }) => void
  userOffline: (user: { id: string; name: string }) => void
}

export interface ClientToServerEvents {
  join: (room: string) => void
  leave: (room: string) => void
  sendMessage: (data: {
    content: string
    receiverId: string
  }) => void
  markMessageRead: (messageId: string) => void
  typing: (data: { receiverId: string; isTyping: boolean }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  userRole: string
  userName: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
  } else {
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
        methods: ['GET', 'POST'],
      },
    })
    
    res.socket.server.io = io

    // Authentication middleware
    io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication error'))
        }

        const payload = verifyToken(token)
        if (!payload) {
          return next(new Error('Invalid token'))
        }

        // Get user info from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.userId = user.id
        socket.userRole = user.role
        socket.userName = `${user.firstName} ${user.lastName}`
        
        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication error'))
      }
    })

    io.on('connection', (socket: any) => {

      // Join user to their personal room
      socket.join(`user_${socket.userId}`)
      
      // Join user to role-based rooms
      if (socket.userRole === 'PROVIDER' || socket.userRole === 'ADMIN') {
        socket.join('staff')
      }
      if (socket.userRole === 'PATIENT') {
        socket.join('patients')
      }

      // Broadcast user online status to all connected clients (including self)
      const userOnlineData = {
        id: socket.userId,
        name: socket.userName,
      }
      
      // Emit to all clients including sender
      io.emit('userOnline', userOnlineData)

      // Handle joining specific rooms (e.g., appointment rooms)
      socket.on('join', (room: string) => {
        socket.join(room)
      })

      socket.on('leave', (room: string) => {
        socket.leave(room)
      })

      // Handle sending messages
      socket.on('sendMessage', async (data: { content: string; receiverId: string }) => {
        try {
          
          // Get receiver info to determine if they are a patient
          const receiver = await prisma.user.findUnique({
            where: { id: data.receiverId },
            include: {
              patient: true,
              provider: true,
            },
          })

          if (!receiver) {
            console.error(`Receiver not found: ${data.receiverId}`)
            socket.emit('error', { message: 'Receiver not found' })
            return
          }

          // Get sender info
          const sender = await prisma.user.findUnique({
            where: { id: socket.userId },
            include: {
              patient: true,
              provider: true,
            },
          })

          // Determine the patient ID for the message
          let patientId = null
          if (sender?.role === 'PATIENT') {
            patientId = sender.patient?.id
          } else if (receiver.role === 'PATIENT') {
            patientId = receiver.patient?.id
          }


          // Save message to database
          const message = await prisma.message.create({
            data: {
              senderId: socket.userId,
              receiverId: data.receiverId,
              patientId: patientId,
              content: data.content,
              isRead: false,
            },
            include: {
              sender: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          })


          const messagePayload = {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: `${message.sender.firstName} ${message.sender.lastName}`,
            receiverId: data.receiverId,
            timestamp: message.createdAt.toISOString(),
            isRead: message.isRead,
          }

          // Emit to receiver's room with confirmation
          const receiverRoom = `user_${data.receiverId}`
          
          // Get all sockets in the receiver's room to confirm delivery
          const socketsInRoom = await io.in(receiverRoom).fetchSockets()
          
          io.to(receiverRoom).emit('newMessage', messagePayload)

          // Also emit back to sender for confirmation
          socket.emit('newMessage', {
            ...messagePayload,
            senderName: 'You',
          })

        } catch (error: any) {
          console.error('Error sending message:', error)
          console.error('Error details:', error.message, error.stack)
          socket.emit('error', { message: 'Failed to send message' })
        }
      })

      // Handle marking messages as read
      socket.on('markMessageRead', async (messageId: string) => {
        try {
          await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true },
          })
        } catch (error) {
          console.error('Error marking message as read:', error)
        }
      })

      // Handle typing indicators
      socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
        socket.to(`user_${data.receiverId}`).emit('typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping: data.isTyping,
        })
      })

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        
        const userOfflineData = {
          id: socket.userId,
          name: socket.userName,
        }
        
        // Broadcast to all clients that user went offline
        io.emit('userOffline', userOfflineData)
      })
    })
  }
  res.end()
}