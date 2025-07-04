'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { generateHourOptions, generateMinuteOptions, sessionTypeOptions } from '@/utils/timeOptions';


interface EditSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose }: EditSessionModalProps) {
  const { state, updateSession, updateCalendarEvent } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    sessionType: 'In-Person',
    date: '',
    time: '',
    quote: '',
    notes: ''
  });

  // Helper function to check if session is in the past
  const isSessionInPast = (date: string, time: string) => {
    if (!date || !time) return false;

    const sessionDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();

    return sessionDateTime < now;
  };

  // Generate time options
  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  // Helper functions for time handling
  const getHourFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    const hour = parts[0] || '';
    // Ensure it's a valid hour option (00-23)
    const hourNum = parseInt(hour, 10);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) return '';
    return hour.padStart(2, '0');
  };

  const getMinuteFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    const minute = parts[1] || '';
    // Ensure it's a valid minute option (00, 05, 10, etc.)
    const minuteNum = parseInt(minute, 10);
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) return '';
    // Round to nearest 5-minute increment
    const roundedMinute = Math.round(minuteNum / 5) * 5;
    return roundedMinute.toString().padStart(2, '0');
  };

  const updateTime = (hour: string, minute: string) => {
    if (hour !== '' && minute !== '') {
      const newTime = `${hour}:${minute}`;
      setFormData({ ...formData, time: newTime });
    } else if (hour !== '' || minute !== '') {
      // If only one is selected, still update to show partial selection
      const currentHour = hour !== '' ? hour : '00';
      const currentMinute = minute !== '' ? minute : '00';
      const newTime = `${currentHour}:${currentMinute}`;
      setFormData({ ...formData, time: newTime });
    }
  };

  useEffect(() => {
    if (session) {
      setFormData({
        clientId: session.clientId || '', // Handle optional clientId for Group/RMR Live sessions
        sessionType: session.sessionType,
        date: session.bookingDate, // Already in YYYY-MM-DD format
        time: session.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)
        quote: session.quote.toString(),
        notes: session.notes || ''
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || isSubmitting) return;

    setIsSubmitting(true);

    const updates: Partial<Session> = {
      clientId: formData.clientId || undefined, // Allow undefined for Group/RMR Live sessions
      sessionType: formData.sessionType as Session['sessionType'],
      bookingDate: formData.date, // YYYY-MM-DD format
      bookingTime: formData.time, // HH:mm format
      quote: parseFloat(formData.quote),
      notes: formData.notes || undefined
    };

    try {
      // Check what has changed
      const dateChanged = session.bookingDate !== formData.date;
      const timeChanged = session.bookingTime !== formData.time;
      const sessionTypeChanged = session.sessionType !== formData.sessionType;
      const dateTimeChanged = dateChanged || timeChanged;

      console.log('Updating session...', { dateTimeChanged, dateChanged, timeChanged, sessionTypeChanged });

      // Always update the session first
      const updatedSession = await updateSession(session.id, updates);

      // Update the calendar event for any changes EXCEPT when session type changes
      if (!sessionTypeChanged && updatedSession.eventId) {
        console.log('Session updated (not session type), updating calendar event');
        await updateCalendarEvent(updatedSession);
        console.log('Calendar event updated');
      } else if (sessionTypeChanged) {
        console.log('Session type changed, skipping calendar update');
      } else {
        console.log('No eventId found, skipping calendar update');
      }

      // Trigger session update webhook (only for future sessions)
      const isPastSession = isSessionInPast(updatedSession.bookingDate, updatedSession.bookingTime);
      if (!isPastSession) {
        try {
          console.log('Triggering session update webhook');

        // Find the client for this session
        const client = state.clients.find(c => c.id === updatedSession.clientId);

        // Helper function to get all emails for a client (including aliases)
        const getClientEmails = (client: any) => {
          const emails: string[] = [];
          if (client?.email) {
            emails.push(client.email.toLowerCase());
          }
          // Add email aliases if available
          const aliases = state.clientEmailAliases?.[client?.id];
          if (aliases && Array.isArray(aliases)) {
            aliases.forEach((alias: any) => {
              const aliasEmail = alias?.email?.toLowerCase();
              if (aliasEmail && !emails.includes(aliasEmail)) {
                emails.push(aliasEmail);
              }
            });
          }
          return emails;
        };

        const clientEmails = getClientEmails(client);

        // Check if client has signed booking terms
        const hasSignedBookingTerms = clientEmails.length > 0 ?
          state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || '')) : false;

        // Check if client has filled behaviour questionnaire
        const hasFilledQuestionnaire = client ?
          state.behaviourQuestionnaires.some(q => q.clientId === client.id) : false;

        // Prepare webhook payload
        const webhookPayload = {
          sessionId: updatedSession.id,
          clientId: updatedSession.clientId,
          clientFirstName: client?.firstName || '',
          clientEmail: client?.email || '',
          dogName: client?.dogName || '',
          sessionType: updatedSession.sessionType,
          bookingDate: updatedSession.bookingDate,
          bookingTime: updatedSession.bookingTime,
          notes: updatedSession.notes,
          quote: updatedSession.quote,
          eventId: updatedSession.eventId,
          hasSignedBookingTerms,
          hasFilledQuestionnaire,
          updatedAt: new Date().toISOString()
        };

        // Validate essential fields before sending webhook
        const hasEssentialData = webhookPayload.sessionId &&
                                webhookPayload.clientEmail &&
                                webhookPayload.sessionType &&
                                webhookPayload.bookingDate &&
                                webhookPayload.bookingTime;

        // Additional validation to prevent empty/invalid payloads
        const hasValidData = webhookPayload.sessionId?.trim() &&
                            webhookPayload.clientEmail?.trim() &&
                            webhookPayload.sessionType?.trim() &&
                            webhookPayload.bookingDate?.trim() &&
                            webhookPayload.bookingTime?.trim() &&
                            webhookPayload.clientEmail.includes('@'); // Basic email validation

        if (!hasEssentialData || !hasValidData) {
          console.log('❌ Skipping session update webhook - missing or invalid essential data:', {
            sessionId: webhookPayload.sessionId,
            hasSessionId: !!webhookPayload.sessionId,
            hasClientEmail: !!webhookPayload.clientEmail,
            hasSessionType: !!webhookPayload.sessionType,
            hasBookingDate: !!webhookPayload.bookingDate,
            hasBookingTime: !!webhookPayload.bookingTime,
            validSessionId: !!webhookPayload.sessionId?.trim(),
            validClientEmail: !!webhookPayload.clientEmail?.trim() && webhookPayload.clientEmail.includes('@'),
            validSessionType: !!webhookPayload.sessionType?.trim(),
            validBookingDate: !!webhookPayload.bookingDate?.trim(),
            validBookingTime: !!webhookPayload.bookingTime?.trim(),
            quote: webhookPayload.quote,
            webhookPayload: webhookPayload
          });
          return;
        }

        // Final validation before webhook call to prevent empty data
        if (!webhookPayload.sessionId || !webhookPayload.clientEmail || !webhookPayload.sessionType ||
            !webhookPayload.bookingDate || !webhookPayload.bookingTime) {
          console.log('❌ Final check: Blocking booking terms webhook - invalid data detected');
          return;
        }

        console.log('✅ Sending session update webhook data to Make.com:', {
          timestamp: new Date().toISOString(),
          sessionId: webhookPayload.sessionId,
          clientEmail: webhookPayload.clientEmail,
          sessionType: webhookPayload.sessionType,
          bookingDate: webhookPayload.bookingDate,
          bookingTime: webhookPayload.bookingTime,
          quote: webhookPayload.quote,
          payloadSize: JSON.stringify(webhookPayload).length
        });

        const webhookResponse = await fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        console.log('Session update webhook response:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          ok: webhookResponse.ok
        });

        if (!webhookResponse.ok) {
          const responseText = await webhookResponse.text();
          console.error('Webhook failed with response:', responseText);
        } else {
          console.log('Session update webhook triggered successfully');
        }
        } catch (webhookError) {
          console.error('Failed to trigger session update webhook:', webhookError);
          // Don't block the UI for webhook failures
        }
      } else {
        console.log('Skipping webhook for past session');
      }

      onClose();
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Session"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Client {(formData.sessionType === 'Group' || formData.sessionType === 'RMR Live') && '(Optional)'}
          </label>
          <SearchableDropdown
            value={formData.clientId}
            onChange={(value) => setFormData({ ...formData, clientId: value })}
            options={[
              ...(formData.sessionType === 'Group' || formData.sessionType === 'RMR Live'
                ? [{ value: '', label: 'No client (Group/RMR Live session)' }]
                : []
              ),
              ...state.clients.map((client) => ({
                value: client.id,
                label: `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
              }))
            ]}
            placeholder={
              formData.sessionType === 'Group' || formData.sessionType === 'RMR Live'
                ? "Select a client (optional)"
                : "Select a client"
            }
            searchPlaceholder="Search clients..."
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Session Type
          </label>
          <CustomDropdown
            value={formData.sessionType}
            onChange={(value) => setFormData({ ...formData, sessionType: value })}
            options={sessionTypeOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Date
          </label>
          <CustomDatePicker
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Time
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Hour
              </label>
              <CustomDropdown
                value={getHourFromTime(formData.time)}
                onChange={(hour) => updateTime(hour, getMinuteFromTime(formData.time))}
                options={hourOptions}
                placeholder="00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Minutes
              </label>
              <CustomDropdown
                value={getMinuteFromTime(formData.time)}
                onChange={(minute) => updateTime(getHourFromTime(formData.time), minute)}
                options={minuteOptions}
                placeholder="00"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Quote (£)
          </label>
          <input
            type="number"
            value={formData.quote}
            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            onWheel={(e) => e.currentTarget.blur()} // Prevent trackpad scrolling from affecting the input
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter quote amount"
            min="0"
            step="0.01"
            required
          />
        </div>



        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Add any notes about the session"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-amber-800 text-white hover:bg-amber-700'
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Update Session'}
        </button>
      </form>
    </SlideUpModal>
  );
}
