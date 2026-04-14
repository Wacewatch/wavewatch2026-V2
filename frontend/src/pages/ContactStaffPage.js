import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Mail, Send } from 'lucide-react';

export default function ContactStaffPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!authLoading && !user) { navigate('/login'); return null; }
  if (authLoading || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await API.post('/api/staff-messages', { subject, message });
      toast({ title: 'Message envoye', description: 'Le staff vous repondra bientot' });
      setSubject(''); setMessage('');
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="contact-staff-page">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Mail className="w-8 h-8" />Ecrire au Staff</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1.5">Sujet</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="text-sm font-medium block mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring resize-none" /></div>
          <button type="submit" disabled={sending} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" />{sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
