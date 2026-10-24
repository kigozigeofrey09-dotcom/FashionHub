import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { PageTitle, Loading, EmptyState, Notice } from '../components/ui';

export function MessagesPage() {
  const { session } = useAppContext();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');
  const shopId = searchParams.get('shopId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id;

  async function initChat() {
    if (!userId) {
      setLoading(false);
      return;
    }
    setDbError('');
    try {
      if (listingId && shopId) {
        // Check if conversation exists for this buyer & listing
        let { data: existing, error: findErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('buyer_id', userId)
          .eq('product_id', listingId)
          .maybeSingle();

        if (!existing) {
          const { data: created, error: createErr } = await supabase
            .from('conversations')
            .insert({
              buyer_id: userId,
              seller_id: shopId,
              product_id: listingId
            })
            .select('*')
            .single();

          if (createErr) {
            setDbError('Database tables for chat are missing. Please run supabase_chat_migration.sql in your Supabase SQL Editor.');
          } else if (created) {
            existing = created;
          }
        }
        if (existing) {
          setActiveConversation(existing);
        }
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        setDbError('Database tables for chat are missing. Please run supabase_chat_migration.sql in your Supabase SQL Editor.');
      } else {
        setConversations(data || []);
        if (data && data.length > 0 && !activeConversation) {
          setActiveConversation(data[0]);
        }
      }
    } catch (err: any) {
      console.error('Error initializing chat:', err);
      setDbError(err?.message || 'Could not connect to real-time chat database.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  useEffect(() => {
    if (userId) {
      initChat();
    }
  }, [userId, listingId]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);

      const channel = supabase
        .channel(`chat_${activeConversation.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` },
          (payload) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConversation]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !userId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const { data: sentMsg, error } = await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_id: userId,
        content
      }).select('*').single();

      if (error) throw error;

      setMessages((prev) => [...prev, sentMsg]);
      scrollToBottom();

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation.id);
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err?.message || 'Could not send message. Ensure supabase_chat_migration.sql has been run in Supabase.');
    }
  }

  if (!session) {
    return (
      <div className="content-page text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Sign in to access Messages</h2>
        <p className="text-sm text-slate-500 mb-6">Real-time buyer and seller chats require an authenticated account.</p>
        <a href="/auth/sign-in" className="button button-dark">Sign in securely</a>
      </div>
    );
  }

  return (
    <div className="content-page max-w-6xl mx-auto py-6">
      <PageTitle eyebrow="MESSAGES & ENQUIRIES" title={<>Real-time <em>conversation hub.</em></>}>
        Chat directly with buyers and makers across Kampala and beyond.
      </PageTitle>

      {dbError && <Notice tone="warning" title="Database Setup Required">{dbError}</Notice>}

      <div className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] mt-6">
        {/* Sidebar */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="font-bold text-slate-800 text-sm">Active Conversations</h3>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-4 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-100'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                    <User size={18} />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-bold text-slate-900 text-xs truncate">Conversation #{conv.id.slice(0, 6)}</h4>
                    <p className="text-[11px] text-slate-500 truncate">Click to open chat window</p>
                  </div>
                </div>
              );
            })}
            {!conversations.length && !loading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations yet. Click "Chat" on any product to start chatting!
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 flex flex-col bg-white">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    <User size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Chat #{activeConversation.id.slice(0, 8)}</h3>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">● Live Supabase Real-Time</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                        <p>{msg.content}</p>
                        <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to the seller..."
                  className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8 text-center">
              Select a conversation from the sidebar or click "Chat" on any listing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
