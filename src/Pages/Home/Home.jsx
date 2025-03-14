import React, { useState } from "react";
import axios from "axios";
import { FaPaperPlane, FaPaperclip, FaTimes, FaBars, FaPlus } from "react-icons/fa";

const Home = () => {
  const [chats, setChats] = useState([]); // Danh sách các cuộc trò chuyện
  const [currentChat, setCurrentChat] = useState(null); // Cuộc trò chuyện hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn của cuộc trò chuyện hiện tại
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sendMessage = async () => {
    if (input.trim() !== "" || files.length > 0) {
      const newMessage = { text: input, files, sender: "user" };
      setMessages([...messages, newMessage]);

      if (currentChat !== null) {
        // Cập nhật tin nhắn vào cuộc trò chuyện hiện tại
        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[currentChat].messages.push(newMessage);
          return updatedChats;
        });
      }

      setInput("");
      setFiles([]);

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
          const response = await axios.post(
            "https://05d9-118-70-184-101.ngrok-free.app/predict",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          if (response.data && response.data.results) {
            const resultMessages = response.data.results.map((item) => 
              `File: ${item.filename}, Vulnerable: ${item.vulnerable}`
            ).join(" ; ");

            setMessages((prev) => [...prev, { text: resultMessages, sender: "ai" }]);
          } else {
            setMessages((prev) => [...prev, { text: "Không có dữ liệu phản hồi.", sender: "ai" }]);
          }
        } catch (error) {
          setMessages((prev) => [...prev, { text: `Lỗi khi gọi API: ${error.message}`, sender: "ai" }]);
        }
      } else {
        setTimeout(() => {
          setMessages((prev) => [...prev, { text: "Vui lòng gửi file để kiểm tra thuật toán !", sender: "ai" }]);
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
    const newChat = { id: chats.length, title: `Cuộc trò chuyện ${chats.length + 1}`, messages: [] };
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
        <div className=" w-30 bg-gray-800 p-4 shadow-lg flex flex-col">
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
          {currentChat !== null ? chats[currentChat].title : "API mô phỏng"}
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-lg">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 rounded-2xl max-w-xs ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.files &&
                  msg.files.map((file, i) => (
                    <a key={i} href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 underline block">
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
                <li key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg my-1 text-white">
                  <span className="text-sm truncate w-full">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="ml-2 text-red-400">
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Box */}
        <div className="p-4 border-t border-gray-600 flex items-center bg-gray-800 shadow-lg rounded-b-lg">
          <label className="cursor-pointer mr-2">
            <FaPaperclip className="text-gray-400 text-xl" />
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </label>
          <input
            type="text"
            className="flex-1 p-3 border rounded-full bg-gray-700 text-white outline-none shadow-sm placeholder-gray-400"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="ml-2 bg-blue-500 text-white p-3 rounded-full shadow-md" onClick={sendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
