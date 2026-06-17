import { useState, useRef, useEffect } from "react";
import "./index.css";

/* =====================
   태그 컴포넌트
   ===================== */
function Tag({ label, onRemove }) {
  return (
    <span className="tag-item">
      {label}
      <button
        className="tag-remove"
        onClick={onRemove}
        aria-label={`${label} 태그 삭제`}
      >
        ×
      </button>
    </span>
  );
}

/* =====================
   이미지 미리보기 컴포넌트
   ===================== */
function ImagePreview({ src, name, onRemove }) {
  return (
    <div className="image-preview-wrap">
      <div className="image-preview-inner">
        <img className="image-preview-thumb" src={src} alt={name} />
        <button
          className="image-preview-remove"
          onClick={onRemove}
          aria-label="이미지 삭제"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* =====================
   말풍선 컴포넌트
   ===================== */
function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "user" : "ai"}`}>
      {!isUser && <div className="ai-avatar">AI</div>}
      <div className={`bubble ${isUser ? "user" : "ai"}`}>
        {msg.tags && msg.tags.length > 0 && (
          <div className="bubble-tags">
            {msg.tags.map((t, i) => (
              <span key={i} className="bubble-tag-item">{t}</span>
            ))}
          </div>
        )}
        {msg.image && (
          <img className="bubble-image" src={msg.image} alt="업로드 이미지" />
        )}
        {msg.text && <span>{msg.text}</span>}
      </div>
    </div>
  );
}

/* =====================
   메인 컴포넌트
   ===================== */
export default function RecipeChat() {
  const [theme, setTheme] = useState("light");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "안녕하세요! 🍳 냉장고에 있는 재료를 태그로 입력하거나 사진을 올려주시면 레시피를 추천해드릴게요.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [tags, setTags] = useState([]);
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");

  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleKeyDown = (e) => {
  if (e.key === " ") {
    const trimmed = inputText.trim();
    if (trimmed.startsWith("//")) {
      e.preventDefault();
      const tagLabel = trimmed.slice(2).trim();
      if (tagLabel) {
        setTags((prev) => [...prev, tagLabel]);
        setInputText("");
      }
    }
  } else if (e.key === "Backspace" && inputText === "" && tags.length > 0) {
    setTags((prev) => prev.slice(0, -1));
  }
};

  const removeTag = (idx) =>
    setTags((prev) => prev.filter((_, i) => i !== idx));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const canSend = tags.length > 0 || !!image || inputText.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;

    const finalTags = inputText.trim()
      ? [...tags, inputText.trim()]
      : [...tags];

    setMessages((prev) => [
      ...prev,
      { role: "user", tags: finalTags, image: image || null, text: "" },
    ]);
    setTags([]);
    setInputText("");
    setImage(null);
    setImageName("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            finalTags.length > 0
              ? `${finalTags.join(", ")} (으)로 만들 수 있는 레시피를 찾고 있어요... 🔍 (Gemini API 연동 후 실제 추천이 표시됩니다)`
              : "사진을 분석하고 있어요... 📷 (Gemini Vision API 연동 후 재료 인식 결과가 표시됩니다)",
        },
      ]);
    }, 800);
  };

  return (
    <div className="page-wrapper" data-theme={theme}>
      {/* 다크모드 토글 */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
      </button>

      <div className="chat-container">
        {/* 헤더 */}
        <div className="chat-header">
          <div className="chat-header-icon">🍽️</div>
          <div>
            <div className="chat-header-title">레시피 AI</div>
            <div className="chat-header-subtitle">
              재료를 입력하면 레시피를 추천해드려요
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className="input-area">
          {image && (
            <ImagePreview
              src={image}
              name={imageName}
              onRemove={() => {
                setImage(null);
                setImageName("");
              }}
            />
          )}

          <div className="input-row">
            {/* + 버튼 */}
            <button
              className="btn-plus"
              onClick={() => fileRef.current.click()}
              aria-label="이미지 첨부"
            >
              +
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImage}
            />

            {/* 태그 + 텍스트 입력 박스 */}
            <div
              className="input-box"
              onClick={() => inputRef.current.focus()}
            >
              {tags.map((t, i) => (
                <Tag key={i} label={t} onRemove={() => removeTag(i)} />
              ))}
              <input
                ref={inputRef}
                className="input-text-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  tags.length === 0 && !image
                    ? "메시지를 입력하세요. 재료는 //당근 처럼 입력하세요."
                    : ""
                }
              />
            </div>

            {/* 전송 버튼 */}
            <button
              className={`btn-send ${canSend ? "active" : "disabled"}`}
              onClick={handleSend}
              disabled={!canSend}
              aria-label="전송"
            >
              ▶
            </button>
          </div>

          <div className="input-hint">
            //단어 + 스페이스로 재료 태그 추가 · + 버튼으로 사진 첨부
          </div>
        </div>
      </div>
    </div>
  );
}