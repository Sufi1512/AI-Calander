import React, { useState } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { CalendarEvent } from '../types/calendar';
import { Calendar, Clock, MapPin, X, MessageSquare, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API (WARNING: Use backend proxy in production)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('Gemini API key is missing from .env');
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const formatDateForInput = (isoString: string) => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

interface EventFormProps {
  onClose: () => void;
  initialEvent?: Partial<CalendarEvent>;
}

function EventForm({ onClose, initialEvent }: EventFormProps) {
  const { addEvent } = useCalendarStore();
  const [formData, setFormData] = useState({
    title: initialEvent?.title || '',
    description: initialEvent?.description || '',
    startTime: initialEvent?.startTime || new Date().toISOString(),
    endTime: initialEvent?.endTime || new Date(Date.now() + 3600000).toISOString(),
    location: initialEvent?.location || '',
    priority: initialEvent?.priority || 'medium',
    type: initialEvent?.type || 'meeting',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);

  const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      setIsSubmitting(false);
      return;
    }

    try {
      const eventData = {
        ...formData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        timeZone: defaultTimeZone,
      };
      await addEvent(eventData);
      toast.success(initialEvent ? 'Event updated!' : 'Event created!');
      onClose();
    } catch (error) {
      toast.error('Failed to save event');
      console.error('Event submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setImage(file);
      setMessage(''); // Clear message if image is uploaded
    }
  };

  const handleExtractDetails = async () => {
    if (!message.trim() && !image) {
      toast.error('Please enter a message or upload an image');
      return;
    }

    setIsProcessingMessage(true);
    try {
      const chatSession = model.startChat({ generationConfig, history: [] });
      const prompt = `Extract event details from this input and return them in JSON format with fields: title, description, startTime (ISO format, e.g., "2025-02-22T16:00:00"), endTime (ISO format), location, priority (low/medium/high), type (meeting/task/reminder/competition/other), timeZone (e.g., "Asia/Kolkata"). If a field is missing, use reasonable defaults (use "${defaultTimeZone}" for timeZone if not specified):\n\n`;

      let result;
      if (image) {
        // Convert image to base64
        const reader = new FileReader();
        const base64Image = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });

        // Send image to Gemini API
        result = await chatSession.sendMessage([
          prompt,
          {
            inlineData: {
              data: base64Image.split(',')[1], // Remove "data:image/jpeg;base64," prefix
              mimeType: image.type,
            },
          },
        ]);
      } else {
        // Send text message to Gemini API
        result = await chatSession.sendMessage(prompt + message);
      }

      const responseText = result.response.text();
      const cleanedResponse = responseText.replace(/```json\n|\n```/g, '').trim();
      const extractedData = JSON.parse(cleanedResponse);

      setFormData((prev) => ({
        title: extractedData.title || prev.title || 'Untitled Event',
        description: extractedData.description || prev.description || '',
        startTime: extractedData.startTime || prev.startTime || new Date().toISOString(),
        endTime: extractedData.endTime || prev.endTime || new Date(Date.now() + 3600000).toISOString(),
        location: extractedData.location || prev.location || '',
        priority: extractedData.priority || prev.priority || 'medium',
        type: extractedData.type || prev.type || 'meeting',
      }));
      toast.success('Event details extracted successfully!');
      setMessage('');
      setImage(null); // Clear image after processing
    } catch (error) {
      toast.error('Failed to extract event details');
      console.error('Gemini API error:', error);
    } finally {
      setIsProcessingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
          aria-label="Close"
          disabled={isSubmitting || isProcessingMessage}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {initialEvent ? 'Edit Event' : 'New Event'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Extract from Message</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setImage(null); // Clear image if message is typed
                }}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="e.g., AI Day Mumbai on February 22, 2025, 4:00 PM - 7:00 PM at Haptik, Goregaon, Mumbai"
                disabled={isSubmitting || isProcessingMessage}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload an Image</label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting || isProcessingMessage}
              />
            </div>
            {image && (
              <p className="mt-1 text-sm text-gray-600">Selected: {image.name}</p>
            )}
          </div>

          {/* Extract Button */}
          <motion.button
            type="button"
            onClick={handleExtractDetails}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 disabled:bg-indigo-400"
            disabled={isSubmitting || isProcessingMessage}
          >
            {isProcessingMessage ? 'Processing...' : 'Extract Details'}
          </motion.button>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value.trim() }))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              placeholder="Event title"
              disabled={isSubmitting || isProcessingMessage}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Event details"
              disabled={isSubmitting || isProcessingMessage}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formatDateForInput(formData.startTime)}
                  onChange={(e) => {
                    const newStartTime = new Date(e.target.value);
                    if (!isNaN(newStartTime.getTime())) {
                      setFormData((prev) => ({ ...prev, startTime: newStartTime.toISOString() }));
                    }
                  }}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={isSubmitting || isProcessingMessage}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formatDateForInput(formData.endTime)}
                  onChange={(e) => {
                    const newEndTime = new Date(e.target.value);
                    if (!isNaN(newEndTime.getTime())) {
                      setFormData((prev) => ({ ...prev, endTime: newEndTime.toISOString() }));
                    }
                  }}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={isSubmitting || isProcessingMessage}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value.trim() }))}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add location"
                disabled={isSubmitting || isProcessingMessage}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting || isProcessingMessage}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting || isProcessingMessage}
              >
                <option value="meeting">Meeting</option>
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
                <option value="competition">Competition</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isSubmitting || isProcessingMessage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md shadow-md text-sm font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-indigo-400"
              disabled={isSubmitting || isProcessingMessage}
            >
              {isSubmitting ? 'Submitting...' : initialEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventForm;