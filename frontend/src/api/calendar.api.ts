import apiClient from './client';
import type { ApiResponse } from '../types/api.types';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  courseId: string | null;
  courseName?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  date: string;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  description?: string | null;
  time?: string | null;
  courseId?: string | null;
}

export interface UpdateCalendarEventRequest {
  title: string;
  date: string;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  description?: string | null;
  time?: string | null;
  courseId?: string | null;
}

export const calendarApi = {
  // Student endpoints
  async getMyEvents(): Promise<ApiResponse<CalendarEvent[]>> {
    const response = await apiClient.get<ApiResponse<CalendarEvent[]>>('/calendar-events');
    return response.data;
  },

  // Admin endpoints
  async listAllEvents(): Promise<ApiResponse<CalendarEvent[]>> {
    const response = await apiClient.get<ApiResponse<CalendarEvent[]>>('/admin/calendar-events');
    return response.data;
  },

  async createEvent(data: CreateCalendarEventRequest): Promise<ApiResponse<CalendarEvent>> {
    const response = await apiClient.post<ApiResponse<CalendarEvent>>('/admin/calendar-events', data);
    return response.data;
  },

  async updateEvent(eventId: string, data: UpdateCalendarEventRequest): Promise<ApiResponse<CalendarEvent>> {
    const response = await apiClient.put<ApiResponse<CalendarEvent>>(
      `/admin/calendar-events/${eventId}`,
      data
    );
    return response.data;
  },

  async deleteEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/calendar-events/${eventId}`
    );
    return response.data;
  },
};

export default calendarApi;
