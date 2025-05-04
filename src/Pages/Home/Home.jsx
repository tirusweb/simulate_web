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
      localStorage.setItem(
        "redai-saved-chats",
        JSON.stringify(chats.slice(-MAX_SAVED_CHATS))
      );
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
      const aiMessage = {
        text: "Vui lòng chọn file để kiểm tra!",
        sender: "ai",
      };
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
        "http://127.0.0.1:8000/predict",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data && response.data.results) {
        const resultMessages = (
          <div className="space-y-3">
            <div className="font-medium mb-2">Kết quả phân tích:</div>
            {response.data.results.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  item.vulnerable
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaFileCode
                    className={
                      item.vulnerable ? "text-red-500" : "text-green-500"
                    }
                  />
                  <strong className="text-gray-800">{item.filename}</strong>
                </div>
                {item.vulnerable ? (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <FaExclamationTriangle />
                    <span>Phát hiện lỗ hổng bảo mật tiềm ẩn</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <FaShieldAlt />
                    <span>Không phát hiện lỗ hổng bảo mật</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

        updateMessages({ text: resultMessages, sender: "ai", isList: true });
      } else {
        updateMessages({ text: "Không có dữ liệu phản hồi.", sender: "ai" });
      }
    } catch (error) {
      updateMessages({
        text: (
          <div className="text-red-100 bg-red-500/20 p-3 rounded-lg border border-red-200/30">
            <div className="flex items-center gap-2 font-medium">
              <FaExclamationTriangle /> Lỗi khi gọi API
            </div>
            <div className="mt-1 text-sm opacity-90">{error.message}</div>
          </div>
        ),
        sender: "ai",
        isList: true,
      });
    } finally {
      setLoading(false); // Tắt hiệu ứng loading
    }
  };

  // Hàm cập nhật tin nhắn và lưu vào cuộc trò chuyện hiện tại
  const updateMessages = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);

    if (currentChat !== null) {
      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        updatedChats[currentChat] = {
          ...updatedChats[currentChat],
          messages: [...updatedChats[currentChat].messages, newMessage],
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
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="flex h-screen bg-gradient-to-br from-teal-50 to-cyan-100 text-gray-800">
      {/* Sidebar */}

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white border-b border-teal-100 p-4 text-gray-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars className="text-xl" />
            </button>
            <h1 className="text-xl font-bold text-teal-800">
              Phân tích mã nguồn
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white text-gray-700 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none pr-8 transition-all"
              >
                <option value="GCN+CNN+DROPOUT+RF">GCN+CNN+DROPOUT+RF</option>
                <option value="GCN+DROPOUT+RF">GCN+DROPOUT+RF</option>
                <option value="SAGEConv+CNN+DROPOUT+MLP">
                  SAGEConv+CNN+DROPOUT+MLP
                </option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-teal-50 to-cyan-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
              <div className="bg-teal-500 rounded-full p-6 mb-6">
                <FaShieldAlt className="text-6xl text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-teal-800">
                Chào mừng đến với nhóm 06
              </h2>
              <p className="max-w-md mb-8 text-gray-600">
                Tải lên file của bạn để kiểm tra lỗ hổng bảo mật với các mô hình
                AI tiên tiến
              </p>
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-teal-100 max-w-md shadow-sm">
                <FaFileCode className="text-teal-500 text-xl" />
                <p className="text-gray-700">
                  Nhấn vào nút "Chọn file để kiểm tra" bên dưới để bắt đầu
                </p>
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
                  <div className="bg-teal-500 rounded-full p-2 mr-2 shadow-sm">
                    <FaRobot className="text-white" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl shadow-sm ${
                    msg.sender === "user"
                      ? "bg-white border border-teal-100 rounded-tr-none"
                      : "bg-teal-500 text-white rounded-tl-none"
                  }`}
                >
                  {/* Hiển thị tin nhắn và status */}
                  {msg.text && !msg.isStatus && !msg.isList && (
                    <p>{msg.text}</p>
                  )}

                  {/* Nếu là thông báo về status */}
                  {msg.isStatus && (
                    <p
                      className={`text-sm italic flex items-center gap-2 ${
                        msg.sender === "user"
                          ? "text-teal-600"
                          : "text-teal-100"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {msg.text}
                    </p>
                  )}

                  {/* Hiển thị danh sách kết quả */}
                  {msg.isList && (
                    <div
                      className={
                        msg.sender === "user" ? "text-gray-800" : "text-white"
                      }
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Hiển thị files nếu có */}
                  {msg.files &&
                    msg.files.map((file, i) => (
                      <a
                        key={i}
                        href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm underline mt-2 flex items-center gap-2 ${
                          msg.sender === "user"
                            ? "text-teal-600"
                            : "text-teal-100"
                        }`}
                      >
                        <FaFileCode />
                        {file.name}
                      </a>
                    ))}
                </div>

                {msg.sender === "user" && (
                  <div className="bg-teal-600 rounded-full p-2 ml-2 shadow-sm">
                    <FaUser className="text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start max-w-md">
                <div className="bg-teal-500 rounded-full p-2 mr-2 shadow-sm">
                  <FaRobot className="text-white" />
                </div>
                <div className="p-4 rounded-2xl shadow-sm bg-teal-500 text-white rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-teal-100" />
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
          <div className="p-4 bg-white border-t border-teal-100">
            <p className="font-semibold text-teal-800 mb-2">Files đã chọn:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-teal-50 rounded-lg text-gray-700 group hover:bg-teal-100 transition-all border border-teal-100"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FaFileCode className="text-teal-600 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="p-4 border-t border-teal-100 bg-white shadow-sm">
          <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <div className="flex items-center">
              <label className="cursor-pointer flex items-center gap-3 bg-teal-50 py-3 px-5 rounded-lg hover:bg-teal-100 transition-all shadow-sm border border-teal-100">
                <FaPaperclip className="text-teal-600 text-xl" />
                <span className="text-teal-800 font-medium">
                  Chọn file để kiểm tra
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              className="px-5 py-3 bg-teal-500 text-white rounded-lg shadow-sm hover:bg-teal-600 transition-all flex items-center justify-center gap-2 font-medium"
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
