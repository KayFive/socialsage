// src/components/feedback/FeedbackWidget.tsx
import { useState } from 'react';
import supabase from '../../lib/supabaseClient'; // Adjust the path as needed

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');

  const handleSubmit = async () => {
    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    // Save to Supabase
    await supabase.from('feedback').insert({
      user_id: user ? user.id : null,
      type,
      message: feedback,
      page_url: window.location.href
    });
  };

  return (
    <div className="fixed bottom-4 right-4">
      {/* Floating feedback button */}
      <button onClick={() => setIsOpen(!isOpen)}>
        💬 Feedback
      </button>
      {/* Feedback form modal */}
    </div>
  );
}