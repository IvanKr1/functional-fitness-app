import * as bookingService from './bookingService.js'

/**
 * Scheduler service for automatic booking status updates
 */
class SchedulerService {
    private intervalId: NodeJS.Timeout | null = null
    private isRunning = false

    /**
     * Start the scheduler to automatically mark past bookings as completed
     * Runs every minute
     */
    start(): void {
        if (this.isRunning) {
            console.log('Scheduler is already running')
            return
        }

        this.isRunning = true
        console.log('Starting booking status scheduler...')

        // Run immediately on start
        this.markPastBookingsAsCompleted()

        // Then run every minute
        this.intervalId = setInterval(() => {
            this.markPastBookingsAsCompleted()
        }, 60 * 1000) // 60 seconds
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
        this.isRunning = false
        console.log('Booking status scheduler stopped')
    }

    /**
     * Check if scheduler is running
     */
    isSchedulerRunning(): boolean {
        return this.isRunning
    }

    /**
     * Mark past bookings as completed
     */
    private async markPastBookingsAsCompleted(): Promise<void> {
        try {
            const completedCount = await bookingService.markPastBookingsAsCompleted()
            if (completedCount > 0) {
                console.log(`✅ Scheduler: Marked ${completedCount} booking${completedCount !== 1 ? 's' : ''} as completed`)
            }
        } catch (error) {
            console.error('❌ Scheduler: Error marking past bookings as completed:', error)
        }
    }
}

// Export singleton instance
export const schedulerService = new SchedulerService() 