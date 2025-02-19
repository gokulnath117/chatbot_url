import { useState } from 'react';
import { FiMessageCircle, FiPlus, FiX, FiSend, FiLink } from 'react-icons/fi';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'url'
  const [url, setUrl] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [urlStatus, setUrlStatus] = useState('');

  const handleSubmitUrl = async () => {
    if (!url.trim()) return;
    
    try {
      setUrlStatus('Processing URL...');
      const response = await fetch('/api/process-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to process URL');
      
      setUrlStatus('URL processed successfully!');
      setUrl('');
      setTimeout(() => setUrlStatus(''), 3000);
      
    } catch (error) {
      console.error('URL processing error:', error);
      setUrlStatus(error.message);
    }
  };

  // Add this function for handling messages
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: newMessage }]);
    const currentMessage = newMessage;
    setNewMessage('');

    try {
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const { response: aiResponse } = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition"
        >
          <FiMessageCircle size={24} />
        </button>
      ) : (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header with Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 p-4 flex items-center justify-center gap-2 ${
                activeTab === 'url' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiLink size={18} />
              Add URL
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-4 flex items-center justify-center gap-2 ${
                activeTab === 'chat' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiMessageCircle size={18} />
              Chat
            </button>
          </div>

          {/* URL Input Tab */}
          {activeTab === 'url' && (
            <div className="flex-1 p-4 flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSubmitUrl}
                className="mt-auto bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <FiPlus size={18} />
                Process URL
              </button>
              {urlStatus && (
                <div className="mt-4 text-sm p-2 rounded-lg bg-blue-50 text-blue-800">
                  {urlStatus}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-4 overflow-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    <FiSend size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
      )}
    </div>
  );
}