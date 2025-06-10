import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { config } from '../config/index.js'

/**
 * Seed the database with initial data
 */
async function main(): Promise<void> {
    console.log('🌱 Starting database seed...')

    // Create admin user
    const adminPasswordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 12)

    const admin = await prisma.user.upsert({
        where: { email: config.ADMIN_EMAIL },
        update: {},
        create: {
            name: 'Gym Administrator',
            email: config.ADMIN_EMAIL,
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            weeklyBookingLimit: 10,
            notes: 'System administrator account'
        }
    })

    console.log('✅ Admin user created:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
    })

    // Create sample users for development
    if (config.NODE_ENV === 'development') {
        const sampleUsers = [
            {
                name: 'John Doe',
                email: 'john@example.com',
                mobilePhone: '+1234567890',
                weeklyBookingLimit: 3,
                notes: 'Regular member, prefers morning sessions'
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                mobilePhone: '+0987654321',
                weeklyBookingLimit: 2,
                notes: 'New member, needs orientation'
            },
            {
                name: 'Mike Johnson',
                email: 'mike@example.com',
                mobilePhone: '+1122334455',
                weeklyBookingLimit: 4,
                notes: 'Experienced member, training for marathon'
            }
        ]

        for (const userData of sampleUsers) {
            // Generate random password for sample users
            const password = Math.random().toString(36).substring(2, 9)
            const passwordHash = await bcrypt.hash(password, 12)

            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: {},
                create: {
                    ...userData,
                    passwordHash,
                    role: 'USER'
                }
            })

            console.log(`✅ Sample user created: ${user.email} (password: ${password})`)
        }

        // Create sample bookings for the next week
        const users = await prisma.user.findMany({
            where: { role: 'USER' },
            take: 3
        })

        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        for (let i = 0; i < users.length; i++) {
            const user = users[i]
            const bookingDate = new Date(nextWeek)
            bookingDate.setDate(bookingDate.getDate() + i)
            bookingDate.setHours(9 + i, 0, 0, 0)

            const endTime = new Date(bookingDate)
            endTime.setHours(bookingDate.getHours() + 1)

            if (!user) {
                console.error('❌ User not found')
                continue
            }

            await prisma.booking.create({
                data: {
                    userId: user.id,
                    startTime: bookingDate,
                    endTime: endTime,
                    status: 'CONFIRMED',
                    notes: `Sample booking for ${user.name}`
                }
            })

            console.log(`✅ Sample booking created for ${user.name}`)
        }

        // Create sample payment records
        for (const user of users) {
            const paymentDate = new Date()
            paymentDate.setDate(paymentDate.getDate() - 30) // 30 days ago

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 30) // 30 days from now

            await prisma.paymentRecord.create({
                data: {
                    userId: user.id,
                    amount: 50.00,
                    currency: 'EUR',
                    paymentDate,
                    dueDate,
                    status: 'PAID',
                    notes: 'Monthly membership fee'
                }
            })

            console.log(`✅ Sample payment record created for ${user.name}`)
        }
    }

    console.log('🎉 Database seeding completed!')
}

/**
 * Execute the seed function
 */
main()
    .catch((error) => {
        console.error('❌ Database seeding failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 