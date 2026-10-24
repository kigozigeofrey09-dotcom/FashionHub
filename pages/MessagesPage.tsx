import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User, CheckCheck, Paperclip, Smile, Phone, Video, Search } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { PageTitle, Notice } from '../components/ui';

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
        let { data: existing } = await supabase
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

      const recipientId = activeConversation.buyer_id === userId ? activeConversation.seller_id : activeConversation.buyer_id;
      if (recipientId && recipientId !== userId && !recipientId.startsWith('seed-')) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          title: `New message from ${session.user.name}`,
          body: content.slice(0, 80),
          type: 'enquiry',
          link: '/messages'
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err?.message || 'Could not send message. Ensure supabase_chat_migration.sql has been run in Supabase.');
    }
  }

  if (!session) {
    return (
      <div className="content-page text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Sign in to access WhatsApp-style Chat</h2>
        <p className="text-sm text-slate-500 mb-6">Real-time buyer and seller chats require an authenticated account.</p>
        <a href="/auth/sign-in" className="button button-dark">Sign in securely</a>
      </div>
    );
  }

  return (
    <div className="content-page max-w-6xl mx-auto py-6">
      <PageTitle eyebrow="WHATSAPP-STYLE CHAT" title={<>Live fashion <em>messaging.</em></>}>
        Connect instantly with buyers and sellers with live read receipts and real-time synchronization.
      </PageTitle>

      {dbError && <Notice tone="warning" title="Database Setup Required">{dbError}</Notice>}

      {/* WhatsApp Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-[#efeae2] rounded-2xl shadow-xl border border-slate-300 overflow-hidden h-[680px] mt-6">
        {/* Left Sidebar */}
        <div className="border-r border-slate-200 flex flex-col bg-white">
          <div className="p-4 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#315039] text-white font-bold flex items-center justify-center">
                {session.user.name.slice(0, 1)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{session.user.name}</h3>
                <span className="text-[10px] text-emerald-600 font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white border-b border-slate-100">
            <div className="bg-[#f0f2f5] px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-500">
              <Search size={14} />
              <span>Search or start new chat</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#315039] text-[#c7df77] font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    💬
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-slate-900 text-xs truncate">Chat #{conv.id.slice(0, 6)}</h4>
                      <span className="text-[9px] text-slate-400">12:30 PM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Tap to open WhatsApp chat...</p>
                  </div>
                </div>
              );
            })}
            {!conversations.length && !loading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active chats. Click "Chat" on any product listing to start messaging!
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Window (WhatsApp Styled) */}
        <div className="md:col-span-2 flex flex-col bg-[#efeae2] relative" style={{ backgroundImage: 'radial-gradient(#d1dbd6 0.75px, transparent 0.75px)', backgroundSize: '16px 16px' }}>
          {activeConversation ? (
            <>
              {/* WhatsApp Header */}
              <div className="px-4 py-3 bg-[#f0f2f5] border-b border-slate-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#315039] text-[#c7df77] font-bold flex items-center justify-center text-sm shadow-inner">
                    🛍️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Conversation #{activeConversation.id.slice(0, 8)}</h3>
                    <span className="text-[10px] text-emerald-700 font-medium">online · FashionHub Vendor</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <Video size={18} className="cursor-pointer hover:text-emerald-700" />
                  <Phone size={18} className="cursor-pointer hover:text-emerald-700" />
                </div>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-center my-2">
                  <span className="px-3 py-1 bg-[#e1f3fb] text-[#027eb5] text-[10px] font-medium rounded-lg shadow-sm">
                    🔒 Messages are end-to-end encrypted with FashionHub Secure Realtime
                  </span>
                </div>

                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md rounded-xl px-3.5 py-2 text-xs leading-relaxed relative shadow-sm ${
                        isMe ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                      }`}>
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[9px] text-slate-500">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck size={14} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* WhatsApp Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] border-t border-slate-300 flex items-center gap-3">
                <Smile size={22} className="text-slate-500 cursor-pointer hover:text-slate-700" />
                <Paperclip size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="w-10 h-10 bg-[#00a884] hover:bg-[#008f72] text-white rounded-full shadow-md transition-all flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs p-8 text-center bg-[#f8f9fa]">
              Select a conversation from the sidebar or click "Chat" on any listing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
