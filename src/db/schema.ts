import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default(''),
  phone: text('phone'),
  role: text('role').notNull().default('customer'), // 'admin' | 'management' | 'customer'
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'blocked'
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const roomTypes = pgTable('room_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  capacity: integer('capacity').notNull().default(2),
  amenities: text('amenities').notNull().default(''),
  status: text('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  roomTypeId: integer('room_type_id').references(() => roomTypes.id).notNull(),
  floor: integer('floor').notNull().default(1),
  status: text('status').notNull().default('Available'), // 'Available' | 'Occupied' | 'Maintenance'
  pricePerNight: numeric('price_per_night', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone'),
  roomTypeId: integer('room_type_id').references(() => roomTypes.id).notNull(),
  roomId: integer('room_id').references(() => rooms.id),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  guests: integer('guests').notNull().default(1),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  adr: numeric('adr', { precision: 10, scale: 2 }).notNull(),
  bookingStatus: text('booking_status').notNull().default('Confirmed'), // 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled'
  cancellationRisk: text('cancellation_risk').notNull().default('LOW'), // 'HIGH' | 'MEDIUM' | 'LOW'
  cancellationProbability: integer('cancellation_probability').notNull().default(10),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  rooms: many(rooms),
  bookings: many(bookings),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  roomType: one(roomTypes, {
    fields: [bookings.roomTypeId],
    references: [roomTypes.id],
  }),
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
}));
