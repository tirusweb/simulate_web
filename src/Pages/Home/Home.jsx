import React, { useState } from "react";
import axios from "axios";
import {
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaBars,
  FaPlus,
} from "react-icons/fa";

const Home = () => {
  const [chats, setChats] = useState([]); // Danh sách các cuộc trò chuyện
  const [currentChat, setCurrentChat] = useState(null); // Cuộc trò chuyện hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn của cuộc trò chuyện hiện tại
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false); // State hiệu ứng loading
  const [status, setStatus] = useState("GCN+CNN+DROPOUT+RF");

  const sendMessage = async () => {
    if (input.trim() !== "" || files.length > 0) {
      const newMessage = { text: input, files, sender: "user" };
      setMessages([...messages, newMessage]);

      if (currentChat !== null) {
        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[currentChat].messages.push(newMessage);
          return updatedChats;
        });
      }

      setInput("");
      setFiles([]);
      setLoading(true); // Bật hiệu ứng loading

      const statusMessage = {
        text: `Mô hình hiện tại: ${status}`,
        sender: "user",
        isStatus: true,
      };
      setMessages((prev) => [...prev, statusMessage]);

      if (files.length > 0) {
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
                  <li key={index} className="text-sm">
                    📂 <strong>{item.filename}</strong> -{" "}
                    {item.vulnerable ? "File chứa lỗ hổng" : "File An toàn"}
                  </li>
                ))}
              </ul>
            );

            setMessages((prev) => [
              ...prev,
              { text: resultMessages, sender: "ai", isList: true },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { text: "Không có dữ liệu phản hồi.", sender: "ai" },
            ]);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { text: `Lỗi khi gọi API: ${error.message}`, sender: "ai" },
          ]);
        } finally {
          setLoading(false); // Tắt hiệu ứng loading
        }
      } else {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { text: "Vui lòng gửi file để kiểm tra thuật toán!", sender: "ai" },
          ]);
          setLoading(false); // Tắt loading nếu không có file
        }, 1000);
      }
    }
  };

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const startNewChat = () => {
    const newChat = {
      id: chats.length,
      title: `Cuộc trò chuyện ${chats.length + 1}`,
      messages: [],
    };
    setChats([...chats, newChat]);
    setCurrentChat(chats.length);
    setMessages([]);
  };

  const selectChat = (index) => {
    setCurrentChat(index);
    setMessages(chats[index].messages);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-30 pt-6 bg-gray-800 p-4 shadow-lg flex flex-col">
          <div className="flex justify-between items-center">
            <button
              className="p-2 bg-blue-500 rounded-full text-white"
              onClick={startNewChat}
            >
              <FaPlus />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-gray-800 p-4 text-white text-center text-xl font-bold shadow-lg flex items-center">
          <button className="mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars className="text-xl" />
          </button>
          <div className="flex items-center px-4 py-1">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              <option value="GCN+CNN+DROPOUT+RF">GCN+CNN+DROPOUT+RF</option>
              <option value="GCN+DROPOUT+RF">GCN+DROPOUT+RF</option>
              <option value="SAGEConv+CNN+DROPOUT+MLP">
                SAGEConv+CNN+DROPOUT+MLP
              </option>
            </select>
          </div>
          <p className=" text-right pl-[10%]">
          {currentChat !== null
            ? chats[currentChat].title
            : "Mô phỏng phần mềm"}
          </p>
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-lg">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xs ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {/* Hiển thị tin nhắn và status */}
                {msg.text && !msg.isStatus && <p>{msg.text}</p>}

                {/* Nếu là thông báo về status */}
                {msg.isStatus && (
                  <p className="text-sm text-yellow-300 italic">{msg.text}</p>
                )}

                {/* Hiển thị files nếu có */}
                {msg.files &&
                  msg.files.map((file, i) => (
                    <a
                      key={i}
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-300 underline block"
                    >
                      {file.name}
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="p-2 bg-gray-800 border-t border-gray-600">
            <p className="font-semibold text-gray-300">Files đã chọn:</p>
            <ul>
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg my-1 text-white"
                >
                  <span className="text-sm truncate w-full">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-400"
                  >
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Box */}
        <div className="p-4 border-t border-gray-600 flex items-center justify-center bg-gray-800 shadow-lg rounded-b-lg">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer flex items-center space-x-2 bg-gray-700 p-2 rounded-lg hover:bg-gray-600">
              <FaPaperclip className="text-gray-400 text-xl" />
              <span className="text-gray-300">Chọn file</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <button
            className="ml-2 bg-blue-500 text-white p-3 rounded-full shadow-md hover:bg-blue-600"
            onClick={sendMessage}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
