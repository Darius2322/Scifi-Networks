import { z } from 'zod';

// Kenyan-friendly phone: accepts 07xx/01xx local or +254 international.
const phoneRegex = /^(?:\+254|0)(7|1)\d{8}$/;

export const installationRequestSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(120),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number, e.g. 07XXXXXXXX'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  site_id: z.string().uuid('Choose a service location'),
  estate_area: z.string().trim().min(2, 'Tell us your estate or area').max(120),
  address_details: z.string().trim().max(500).optional().or(z.literal('')),
  package_id: z.string().uuid().optional().or(z.literal('')),
  preferred_datetime: z.string().optional().or(z.literal('')),
  additional_notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const trackAuthSchema = z.object({
  ticket_number: z.string().trim().min(5).max(40),
  contact: z.string().trim().min(4).max(120), // phone OR email
});

export const agentLoginSchema = z.object({
  username: z.string().trim().min(3).max(60),
  password: z.string().min(1).max(200),
});

export const staffLoginSchema = z.object({
  identifier: z.string().trim().min(3).max(120), // username or email
  password: z.string().min(1).max(200),
});

export const customerTicketSchema = z.object({
  installation_id: z.string().uuid(),
  type: z.enum(['outage', 'coverage', 'complaint', 'equipment', 'general_support']),
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  location_text: z.string().trim().max(200).optional().or(z.literal('')),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  subject: z.string().trim().max(150).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(2000),
});
