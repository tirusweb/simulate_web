import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineChip,
  HiOutlineCode,
  HiOutlineExclamation,
} from "react-icons/hi";

const MAX_SAVED_CHATS = 3; // Giới hạn số lượng cuộc trò chuyện được lưu

const Home = () => {
  const [chats, setChats] = useState([]); // Danh sách các cuộc trò chuyện
  const [currentChat, setCurrentChat] = useState(null); // Cuộc trò chuyện hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn của cuộc trò chuyện hiện tại
  const [files, setFiles] = useState([]);
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
                  <HiOutlineDocumentText
                    className={
                      item.vulnerable ? "text-red-500" : "text-green-500"
                    }
                  />
                  <strong className="text-gray-800">{item.filename}</strong>
                </div>
                {item.vulnerable ? (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <HiOutlineExclamation />
                    <span>Phát hiện lỗ hổng bảo mật tiềm ẩn</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <HiOutlineShieldCheck />
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
              <HiOutlineExclamation /> Lỗi khi gọi API
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

  // Các hàm này được giữ lại nhưng không sử dụng trong giao diện hiện tại
  // Sẽ được sử dụng khi cần hiển thị lịch sử cuộc trò chuyện
  // eslint-disable-next-line no-unused-vars
  const selectChat = (index) => {
    setCurrentChat(index);
    setMessages(chats[index].messages);
  };

  // eslint-disable-next-line no-unused-vars
  const clearAllChats = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả cuộc trò chuyện?")) {
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
      localStorage.removeItem("redai-saved-chats");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-diagonal from-violet-50 via-blue-50 to-background-light text-text-primary">
      {/* Main Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-surface-light border-b border-violet-100 p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 p-2 rounded-lg shadow-soft mr-3">
                <HiOutlineShieldCheck className="text-white text-xl" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700">
                Phân tích mã nguồn
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white text-text-secondary p-2 rounded-lg border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none pr-8 transition-all shadow-soft"
              >
                <option value="GCN+CNN+DROPOUT+RF">GCN+CNN+DROPOUT+RF</option>
                <option value="GCN+DROPOUT+RF">GCN+DROPOUT+RF</option>
                <option value="SAGEConv+CNN+DROPOUT+MLP">
                  SAGEConv+CNN+DROPOUT+MLP
                </option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-violet-500">
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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-radial from-violet-200 to-transparent opacity-30 rounded-full blur-xl"></div>
                <div className="relative bg-gradient-to-r from-violet-600 to-blue-600 rounded-full p-6 shadow-elevated">
                  <HiOutlineShieldCheck className="text-6xl text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700">
                Phân tích mã nguồn an toàn
              </h2>
              <p className="max-w-md mb-10 text-text-secondary text-lg">
                Tải lên file của bạn để kiểm tra lỗ hổng bảo mật với các mô hình AI tiên tiến
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-card border border-violet-100 flex flex-col items-center text-center">
                  <div className="bg-violet-100 p-3 rounded-full mb-4">
                    <HiOutlineCode className="text-2xl text-violet-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-violet-900">Phân tích mã nguồn</h3>
                  <p className="text-text-secondary text-sm">Phát hiện lỗ hổng bảo mật trong mã nguồn của bạn</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-card border border-violet-100 flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <HiOutlineChip className="text-2xl text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-blue-900">Mô hình AI tiên tiến</h3>
                  <p className="text-text-secondary text-sm">Sử dụng các mô hình học máy hiện đại nhất</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-card border border-violet-100 flex flex-col items-center text-center">
                  <div className="bg-violet-100 p-3 rounded-full mb-4">
                    <HiOutlineLightningBolt className="text-2xl text-violet-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-violet-900">Kết quả nhanh chóng</h3>
                  <p className="text-text-secondary text-sm">Nhận kết quả phân tích trong thời gian ngắn</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-elevated border border-violet-100 max-w-lg w-full">
                <div className="flex flex-col items-center text-center">
                  <HiOutlineDocumentText className="text-4xl text-violet-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Bắt đầu phân tích</h3>
                  <p className="text-text-secondary mb-6">
                    Tải lên file mã nguồn của bạn để bắt đầu quá trình phân tích bảo mật
                  </p>
                  <button
                    onClick={() => document.getElementById('file-upload').click()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl shadow-soft hover:shadow-elevated transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <HiOutlinePaperClip className="text-xl" />
                    <span>Tải lên mã nguồn</span>
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex items-start max-w-2xl">
                    {msg.sender === "ai" && (
                      <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-full p-2 mr-3 shadow-soft">
                        <HiOutlineShieldCheck className="text-white" />
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl shadow-card ${
                        msg.sender === "user"
                          ? "bg-white border border-violet-100 rounded-tr-none"
                          : "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-tl-none"
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
                              ? "text-violet-600"
                              : "text-blue-100"
                          }`}
                        >
                          <HiOutlineLightningBolt className="h-4 w-4" />
                          {msg.text}
                        </p>
                      )}

                      {/* Hiển thị danh sách kết quả */}
                      {msg.isList && (
                        <div
                          className={
                            msg.sender === "user" ? "text-text-primary" : "text-white"
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
                                ? "text-violet-600"
                                : "text-blue-100"
                            }`}
                          >
                            <HiOutlineDocumentText />
                            {file.name}
                          </a>
                        ))}
                    </div>

                    {msg.sender === "user" && (
                      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-full p-2 ml-3 shadow-soft">
                        <HiOutlineUser className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start max-w-2xl">
                    <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-full p-2 mr-3 shadow-soft">
                      <HiOutlineShieldCheck className="text-white" />
                    </div>
                    <div className="p-4 rounded-2xl shadow-card bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-tl-none">
                      <div className="flex items-center gap-2">
                        <HiOutlineRefresh className="animate-spin text-blue-100" />
                        <p>Đang phân tích mã nguồn...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="p-4 bg-white border-t border-violet-100 shadow-soft">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-violet-900">Files đã chọn ({files.length})</p>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm px-3 py-1 text-danger-DEFAULT hover:bg-danger-light rounded-lg transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-violet-50 rounded-xl text-text-secondary hover:bg-violet-100 transition-all border border-violet-100 shadow-soft"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <HiOutlineDocumentText className="text-violet-600 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-2 text-text-tertiary hover:text-danger-DEFAULT transition-colors"
                    >
                      <HiOutlineX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="p-4 border-t border-violet-100 bg-white shadow-soft">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            <div className="w-full sm:w-auto">
              <label className="cursor-pointer flex items-center justify-center gap-3 bg-violet-50 py-3 px-5 rounded-xl hover:bg-violet-100 transition-all shadow-soft border border-violet-100 w-full">
                <HiOutlinePaperClip className="text-violet-600 text-xl" />
                <span className="text-violet-900 font-medium">
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
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl shadow-soft hover:shadow-elevated transition-all flex items-center justify-center gap-2 font-medium"
              onClick={sendMessage}
              disabled={loading}
            >
              {loading ? (
                <HiOutlineRefresh className="animate-spin" />
              ) : (
                <>
                  <HiOutlinePaperAirplane className="transform rotate-90" />
                  <span>Phân tích bảo mật</span>
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
