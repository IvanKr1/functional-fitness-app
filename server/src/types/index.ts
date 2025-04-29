export interface UserPayload {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
}

export interface ScheduleInput {
    startTime: Date;
    endTime: Date;
}
