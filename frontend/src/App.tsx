import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConnectResponse {
  message: string;
  url?: string;
  error?: string;
}

interface SyncResponse {
  message: string;
  error?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleConnect = async () => {
    try {
      const res = await fetch('http://localhost:3100/api/connect', {
        method: 'GET',
        credentials: 'include',
      });
      const data: ConnectResponse = await res.json();

      if (!res.ok) {
        console.log(data.error ?? data.message);
      } else if (data.url) {
        // redirect to the OAuth URL
        window.location.href = data.url;
      }
    } catch (err) {
      console.log((err as Error).message);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch('http://localhost:3100/api/sync', {
        method: 'GET',
        credentials: 'include',
      });
      const data: SyncResponse = await res.json();

      if (!res.ok) {
        console.log(data.error ?? data.message);
      } else {
        console.log(data.message);
      }
    } catch (err) {
      console.log((err as Error).message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // simulate bot response
    setIsLoading(true)
    try{
      const res = await fetch('http://localhost:3100/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }

      const data = await res.json()
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
     
    }catch(err){
      setIsLoading(false)
      console.log((err as Error).message);
    }
  }

  const clearChat = () => { setMessages([]) }

  return (
    <div className='flex flex-col h-screen w-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b px-4 py-3'>
        <div className='max-w-4xl mx-auto flex items-center justify-between'>

          <div className='flex items-center gap-2'>
            <button
              onClick={handleConnect}
              className='px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
            >
              Connect to Google Drive
            </button>

            <button
              onClick={handleSync}
              className='px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
            >
              Sync Google Drive
            </button>
            <button
              onClick={clearChat}
              className='px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
            >
              Clear chats
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-4 py-6'>
        <div className='max-w-4xl mx-auto space-y-6'>
          {messages.length === 0 && (
            <div className='text-center text-gray-500 py-12'>
              <Bot className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p className='text-lg'>Start a conversation with the AI</p>
              <p className='text-sm'>Type your message below to get started</p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                    <Bot className='w-4 h-4 text-white' />
                  </div>
                </div>
              )}

              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
                  }`}
              >
                {message.role === 'user' ? (
                  <p className='whitespace-pre-wrap'>{message.content}</p>
                ) : (
                  <div className='prose prose-sm max-w-none text-black'>
                    <ReactMarkdown
                      components={{
                        code({ node, className, children, ...props }) {
                          // @ts-ignore: 'node.inline' is available in ReactMarkdown v8+
                          if (node && node.inline) {
                            return (
                              <code
                                className='bg-gray-100 px-1 py-0.5 rounded text-sm'
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          }
                          return (
                            <pre className='bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm'>
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          )
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
                <div className='text-xs opacity-70 mt-2'>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center'>
                    <User className='w-4 h-4 text-white' />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className='flex gap-3 justify-start'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-white' />
                </div>
              </div>
              <div className='bg-white border border-gray-200 rounded-lg px-4 py-3'>
                <div className='flex items-center gap-2 text-gray-500'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className='bg-white border-t px-4 py-4 text-black'>
        <div className='max-w-4xl mx-auto'>
          <form onSubmit={sendMessage} className='flex gap-3'>
            <input
              type='text'
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='Type your message...'
              disabled={isLoading}
              className='flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
            />
            <button
              type='submit'
              disabled={!input.trim() || isLoading}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Send className='w-4 h-4' />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App