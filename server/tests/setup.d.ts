export declare const createTestUser: (overrides?: any) => Promise<{
    id: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    email: string;
    mobilePhone: string | null;
    passwordHash: string;
    role: import(".prisma/client").$Enums.Role;
    weeklyBookingLimit: number;
    lastPaymentDate: Date | null;
    nextPaymentDueDate: Date | null;
}>;
export declare const createTestAdmin: (overrides?: any) => Promise<{
    id: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    email: string;
    mobilePhone: string | null;
    passwordHash: string;
    role: import(".prisma/client").$Enums.Role;
    weeklyBookingLimit: number;
    lastPaymentDate: Date | null;
    nextPaymentDueDate: Date | null;
}>;
export declare const createTestBooking: (userId: string, overrides?: any) => Promise<{
    status: import(".prisma/client").$Enums.BookingStatus;
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=setup.d.ts.map