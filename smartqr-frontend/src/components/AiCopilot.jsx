import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineXMark } from 'react-icons/hi2';
import { aiCopilotChat } from '../api/manufacturerApi';
import '../aiCopilot.css';

const QUICK_CHIPS = [
  'Expiring batches',
  'Scan summary',
  'Inventory overview',
  'Product list',
  'Risk alerts'
];

export default function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your SmartQR Copilot. I have access to your organization\'s real-time data — products, batches, scans, and more. Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Only send the conversation messages (exclude the welcome message if it's the first system one)
      const apiMessages = newMessages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const data = await aiCopilotChat(apiMessages);
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again. (' + err.message + ')' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`ai-copilot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        id="ai-copilot-toggle"
        style={{ position: 'fixed' }}
      >
        {isOpen ? (
          <HiOutlineXMark style={{ width: 22, height: 22 }} />
        ) : (
          <>
            <HiOutlineSparkles style={{ width: 22, height: 22 }} />
            <div className="ai-copilot-badge" />
          </>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-copilot-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="ai-copilot-header">
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiOutlineSparkles style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4>SmartQR Copilot</h4>
                <p>Powered by Azure OpenAI • Data-Aware</p>
              </div>
            </div>

            {/* Messages */}
            <div className="ai-copilot-body" ref={bodyRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`ai-copilot-msg ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="ai-copilot-typing">
                  <span /><span /><span />
                </div>
              )}
            </div>

            {/* Quick Chips */}
            {messages.length <= 2 && !loading && (
              <div className="ai-copilot-chips">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip}
                    className="ai-copilot-chip"
                    onClick={() => sendMessage(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="ai-copilot-input">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your data..."
                disabled={loading}
                id="ai-copilot-input"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
