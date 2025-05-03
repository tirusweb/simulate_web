import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaBars,
  FaPlus,
  FaRobot,
  FaUser,
  FaSpinner,
  FaFileCode,
  FaShieldAlt,
  FaExclamationTriangle,
  FaHistory,
  FaClock,
} from "react-icons/fa";

const MAX_SAVED_CHATS = 3; // Giới hạn số lượng cuộc trò chuyện được lưu

const Home = () => {
  const [chats, setChats] = useState([]); // Danh sách các cuộc trò chuyện
  const [currentChat, setCurrentChat] = useState(null); // Cuộc trò chuyện hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn của cuộc trò chuyện hiện tại
  const [files, setFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false); // State hiệu ứng loading
  const [status, setStatus] = useState("GCN+CNN+DROPOUT+RF");
  const messagesEndRef = useRef(null);

  // Load saved chats from localStorage when component mounts
  useEffect(() => {
    const savedChats = localStorage.getItem("redai-saved-chats");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
      } catch (error) {
        console.error("Error parsing saved chats:", error);
      }
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("redai-saved-chats", JSON.stringify(chats.slice(-MAX_SAVED_CHATS)));
    }
  }, [chats]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (files.length > 0) {
      // Nếu chưa có cuộc trò chuyện nào, tạo mới
      if (currentChat === null) {
        startNewChat();
        // Cần đợi state cập nhật
        setTimeout(() => {
          handleSendMessage();
        }, 100);
        return;
      }

      handleSendMessage();
    } else {
      const aiMessage = { text: "Vui lòng chọn file để kiểm tra!", sender: "ai" };
      updateMessages(aiMessage);
    }
  };

  const handleSendMessage = async () => {
    const newMessage = { files, sender: "user" };
    updateMessages(newMessage);

    setFiles([]);
    setLoading(true); // Bật hiệu ứng loading

    const statusMessage = {
      text: `Mô hình hiện tại: ${status}`,
      sender: "user",
      isStatus: true,
    };
    updateMessages(statusMessage);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("status", status);

    try {
      const response = await axios.post(
        "https://c527-118-70-184-101.ngrok-free.app/predict",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data && response.data.results) {
        const resultMessages = (
          <ul className="list-disc pl-4">
            {response.data.results.map((item, index) => (
              <li key={index} className="text-sm flex items-center gap-2">
                <FaFileCode className="text-blue-300" />
                <strong>{item.filename}</strong> -{" "}
                {item.vulnerable ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <FaExclamationTriangle /> File chứa lỗ hổng
                  </span>
                ) : (
                  <span className="text-green-400 flex items-center gap-1">
                    <FaShieldAlt /> File An toàn
                  </span>
                )}
              </li>
            ))}
          </ul>
        );

        updateMessages({ text: resultMessages, sender: "ai", isList: true });
      } else {
        updateMessages({ text: "Không có dữ liệu phản hồi.", sender: "ai" });
      }
    } catch (error) {
      updateMessages({ text: `Lỗi khi gọi API: ${error.message}`, sender: "ai" });
    } finally {
      setLoading(false); // Tắt hiệu ứng loading
    }
  };

  // Hàm cập nhật tin nhắn và lưu vào cuộc trò chuyện hiện tại
  const updateMessages = (newMessage) => {
    setMessages(prev => [...prev, newMessage]);

    if (currentChat !== null) {
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        updatedChats[currentChat] = {
          ...updatedChats[currentChat],
          messages: [...updatedChats[currentChat].messages, newMessage]
        };
        return updatedChats;
      });
    }
  };

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const startNewChat = () => {
    // Tạo cuộc trò chuyện mới với timestamp
    const timestamp = new Date();
    const formattedDate = formatDate(timestamp);

    const newChat = {
      id: chats.length,
      title: `Cuộc trò chuyện ${chats.length + 1}`,
      timestamp: timestamp.getTime(),
      formattedDate,
      messages: [],
    };

    // Giới hạn số lượng cuộc trò chuyện được lưu
    let updatedChats = [...chats, newChat];
    if (updatedChats.length > MAX_SAVED_CHATS) {
      updatedChats = updatedChats.slice(-MAX_SAVED_CHATS);
    }

    setChats(updatedChats);
    setCurrentChat(updatedChats.length - 1);
    setMessages([]);
  };

  const selectChat = (index) => {
    setCurrentChat(index);
    setMessages(chats[index].messages);
  };

  const clearAllChats = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả cuộc trò chuyện?")) {
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
      localStorage.removeItem("redai-saved-chats");
    }
  };



  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 text-white">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-0"
        } bg-gradient-to-b from-indigo-800 to-purple-900 shadow-xl`}
      >
        {sidebarOpen && (
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">RedAI Scanner</h2>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <button
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium flex items-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                onClick={startNewChat}
              >
                <FaPlus /> Cuộc trò chuyện mới
              </button>

              {chats.length > 0 && (
                <button
                  className="p-2 bg-indigo-800/50 rounded-lg text-indigo-300 text-sm flex items-center gap-2 hover:bg-indigo-700/50 transition-all border border-indigo-700/30"
                  onClick={clearAllChats}
                >
                  <FaTimes /> Xóa tất cả cuộc trò chuyện
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mb-3 text-indigo-300 flex items-center gap-2">
                <FaHistory className="text-indigo-400" />
                <span className="font-medium">Cuộc trò chuyện gần đây ({Math.min(chats.length, MAX_SAVED_CHATS)}/{MAX_SAVED_CHATS})</span>
              </div>

              {chats.length === 0 ? (
                <div className="text-center p-4 text-indigo-400 bg-indigo-800/30 rounded-lg">
                  <p>Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                chats.map((chat, index) => (
                  <div
                    key={index}
                    className={`p-3 mb-3 rounded-lg cursor-pointer transition-all ${
                      currentChat === index
                        ? "bg-indigo-700 shadow-md"
                        : "hover:bg-indigo-700/50"
                    }`}
                    onClick={() => selectChat(index)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium truncate">{chat.title}</p>
                    </div>
                    {chat.formattedDate && (
                      <div className="flex items-center text-xs text-indigo-300">
                        <FaClock className="mr-1 text-indigo-400" />
                        <span>{chat.formattedDate}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-indigo-300">
                      {chat.messages.length} tin nhắn
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-indigo-700/50">
              <div className="text-sm text-indigo-300">
                <div className="flex items-center justify-between mb-2">
                  <span>Cuộc trò chuyện đã lưu:</span>
                  <span className="bg-indigo-700/50 px-2 py-1 rounded-md">{chats.length}/{MAX_SAVED_CHATS}</span>
                </div>
                <p>Phiên bản: 1.0.0</p>
                <p>© 2023 RedAI Scanner</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-800 to-purple-900 p-4 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 hover:bg-indigo-700/50 rounded-lg transition-all"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars className="text-xl" />
            </button>
            <h1 className="text-xl font-bold">
              {currentChat !== null
                ? chats[currentChat].title
                : "Mô phỏng phần mềm"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-indigo-700/50 text-white p-2 rounded-lg border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 transition-all"
              >
                <option value="GCN+CNN+DROPOUT+RF">GCN+CNN+DROPOUT+RF</option>
                <option value="GCN+DROPOUT+RF">GCN+DROPOUT+RF</option>
                <option value="SAGEConv+CNN+DROPOUT+MLP">
                  SAGEConv+CNN+DROPOUT+MLP
                </option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-indigo-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-indigo-900/90">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-indigo-300">
              <FaRobot className="text-6xl mb-4 text-indigo-400" />
              <h2 className="text-2xl font-bold mb-2">Chào mừng đến với RedAI Scanner</h2>
              <p className="max-w-md mb-6">Tải lên file của bạn để kiểm tra lỗ hổng bảo mật với các mô hình AI tiên tiến</p>
              <div className="flex items-center gap-3 bg-indigo-800/50 p-4 rounded-lg border border-indigo-700/50 max-w-md">
                <FaFileCode className="text-indigo-400 text-xl" />
                <p className="text-indigo-200">Nhấn vào nút "Chọn file để kiểm tra" bên dưới để bắt đầu</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-start max-w-md">
                {msg.sender === "ai" && (
                  <div className="bg-indigo-700 rounded-full p-2 mr-2">
                    <FaRobot className="text-white" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl shadow-md ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 rounded-tr-none"
                      : "bg-gradient-to-r from-purple-700 to-indigo-800 rounded-tl-none"
                  }`}
                >
                  {/* Hiển thị tin nhắn và status */}
                  {msg.text && !msg.isStatus && !msg.isList && <p>{msg.text}</p>}

                  {/* Nếu là thông báo về status */}
                  {msg.isStatus && (
                    <p className="text-sm text-yellow-300 italic flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {msg.text}
                    </p>
                  )}

                  {/* Hiển thị danh sách kết quả */}
                  {msg.isList && msg.text}

                  {/* Hiển thị files nếu có */}
                  {msg.files &&
                    msg.files.map((file, i) => (
                      <a
                        key={i}
                        href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-300 underline mt-2 flex items-center gap-2"
                      >
                        <FaFileCode />
                        {file.name}
                      </a>
                    ))}
                </div>

                {msg.sender === "user" && (
                  <div className="bg-blue-600 rounded-full p-2 ml-2">
                    <FaUser className="text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start max-w-md">
                <div className="bg-indigo-700 rounded-full p-2 mr-2">
                  <FaRobot className="text-white" />
                </div>
                <div className="p-4 rounded-2xl shadow-md bg-gradient-to-r from-purple-700 to-indigo-800 rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-indigo-300" />
                    <p>Đang xử lý...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="p-4 bg-indigo-800/80 border-t border-indigo-700">
            <p className="font-semibold text-indigo-300 mb-2">Files đã chọn:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-indigo-700/50 rounded-lg text-white group hover:bg-indigo-700 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FaFileCode className="text-blue-300 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-indigo-300 hover:text-red-400 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="p-4 border-t border-indigo-700 bg-gradient-to-r from-indigo-800 to-purple-900 shadow-lg">
          <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <div className="flex items-center">
              <label className="cursor-pointer flex items-center gap-3 bg-indigo-700/50 py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
                <FaPaperclip className="text-indigo-300 text-xl" />
                <span className="text-indigo-200 font-medium">Chọn file để kiểm tra</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              onClick={sendMessage}
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Kiểm tra</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
