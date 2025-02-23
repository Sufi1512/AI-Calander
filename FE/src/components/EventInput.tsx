// src/components/EventInput.tsx
import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useCalendarStore } from '../store/calendarStore';
import { CalendarEvent } from '../types/calendar';
import { Mic, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventInput() {
  const { addEvent } = useCalendarStore();
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <p className="text-red-600">Speech recognition is not supported in this browser.</p>
      </div>
    );
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const eventData = parseEventText(textInput);
    if (eventData) {
      try {
        await addEvent(eventData);
        toast.success('Event added successfully!');
        setTextInput('');
      } catch (error) {
        toast.error('Failed to add event.');
        console.error('Event creation error:', error);
      }
    } else {
      toast.error('Invalid event format. Please use: "Create event [title] on [date] at [time] at [location]"');
    }
  };

  const handleVoiceSubmit = async () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      if (transcript) {
        const eventData = parseEventText(transcript);
        if (eventData) {
          try {
            await addEvent(eventData);
            toast.success('Voice event added successfully!');
          } catch (error) {
            toast.error('Failed to add voice event.');
            console.error('Voice event error:', error);
          }
        }
        resetTranscript();
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      setIsListening(true);
    }
  };

  const parseEventText = (text: string): Omit<CalendarEvent, 'id'> | null => {
    const cleanedText = text.trim().toLowerCase();
    const titleMatch = cleanedText.match(/create event (.*?(?= on | at |$))/i);
    if (!titleMatch) return null;

    const title = titleMatch[1].trim();
    const dateMatch = cleanedText.match(/on (\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
    const timeMatch = cleanedText.match(/at (\d{1,2}:\d{2}\s?(?:am|pm)?)/i);
    const locationMatch = cleanedText.match(/at ((?:.(?! at | on ))*$)/i);

    const now = new Date();
    const startDate = dateMatch ? new Date(dateMatch[1]) : now;
    
    if (isNaN(startDate.getTime())) return null;

    let hours = 0, minutes = 0;
    if (timeMatch) {
      const timeParts = timeMatch[1].match(/(\d{1,2}):(\d{2})\s?(am|pm)?/i);
      if (timeParts) {
        hours = parseInt(timeParts[1]);
        minutes = parseInt(timeParts[2]);
        if (timeParts[3]?.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (timeParts[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
      }
    }

    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      title,
      description: '',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      location: locationMatch ? locationMatch[1].trim() : 'N/A',
      priority: 'medium',
      type: 'meeting',
    };
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Event</h3>
      <form onSubmit={handleTextSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Input</label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g., Create event Meeting on 2/23/2025 at 2:00 PM at Office"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Event
          </button>
          <button
            type="button"
            onClick={handleVoiceSubmit}
            className={`px-4 py-2 flex items-center ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-md focus:outline-none focus:ring-2 ${
              isListening ? 'focus:ring-red-500' : 'focus:ring-green-500'
            }`}
          >
            {isListening ? (
              <>
                <StopCircle className="h-5 w-5 mr-2" /> Stop
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" /> Voice
              </>
            )}
          </button>
        </div>
      </form>
      {transcript && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Transcript: {transcript}</p>
        </div>
      )}
    </div>
  );
}