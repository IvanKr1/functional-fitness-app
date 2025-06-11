import { Request, Response } from 'express'
import * as attendanceService from '../services/attendanceService.js'
import { AuthenticatedRequest } from '../types/index.js'

/**
 * Get attendance records endpoint
 * Returns user's own attendance or all attendance for admin
 */
export const getAttendanceRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { userId, startDate, endDate, month } = req.query

        let attendanceRecords

        if (user!.role === 'ADMIN') {
            // Admin can see all attendance records or filter by userId
            const options: any = {}
            if (userId) options.userId = userId as string
            if (startDate) options.startDate = new Date(startDate as string)
            if (endDate) options.endDate = new Date(endDate as string)
            if (month) options.month = month as string

            attendanceRecords = await attendanceService.getAllAttendanceRecords(options)
        } else {
            // Regular user can only see their own attendance records
            const options: any = {}
            if (startDate) options.startDate = new Date(startDate as string)
            if (endDate) options.endDate = new Date(endDate as string)
            if (month) options.month = month as string

            attendanceRecords = await attendanceService.getUserAttendanceRecords(user!.id, options)
        }

        res.status(200).json({
            success: true,
            data: attendanceRecords,
            message: 'Attendance records retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve attendance records'
        })
    }
}

/**
 * Create attendance record endpoint
 */
export const createAttendanceRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { bookingId, attended, notes } = req.body

        const attendanceRecord = await attendanceService.createAttendanceRecord(
            user!.id,
            bookingId,
            attended,
            notes
        )

        res.status(201).json({
            success: true,
            data: attendanceRecord,
            message: 'Attendance record created successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create attendance record'
        })
    }
}

/**
 * Update attendance record endpoint
 */
export const updateAttendanceRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { id } = req.params
        const updateData = req.body

        if (!id) {
            throw new Error('Attendance ID is required')
        }

        const attendanceRecord = await attendanceService.updateAttendanceRecord(
            id,
            user!.id,
            user!.role,
            updateData
        )

        res.status(200).json({
            success: true,
            data: attendanceRecord,
            message: 'Attendance record updated successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update attendance record'
        })
    }
}

/**
 * Get attendance statistics endpoint
 */
export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { userId, month, year } = req.query

        // Users can only get their own stats, admins can get any user's stats
        const targetUserId = (user!.role === 'ADMIN' && userId) ? userId as string : user!.id

        const options: any = {}
        if (month) options.month = month as string
        if (year) options.year = parseInt(year as string)

        const stats = await attendanceService.getUserAttendanceStats(targetUserId, options)

        res.status(200).json({
            success: true,
            data: stats,
            message: 'Attendance statistics retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve attendance statistics'
        })
    }
} 