import Head from 'next/head';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Chat Widget Floating Button */}
      <ChatWidget />
    </div>
  );
}