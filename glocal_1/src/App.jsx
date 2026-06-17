import { useState, useRef, useEffect } from "react";
import "./index.css";

/* =====================
   태그 컴포넌트
   ===================== */
function Tag({ label, onRemove }) {
  return (
    <span className="tag-item">
      {label}
      <button className="tag-remove" onClick={onRemove} aria-label={`${label} 태그 삭제`}>
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
        <button className="image-preview-remove" onClick={onRemove} aria-label="이미지 삭제">
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
        {msg.tokens && msg.tokens.length > 0 && (
          <span className="bubble-tokens">
            {msg.tokens.map((token, i) =>
              token.type === "tag"
                ? <span key={i} className="bubble-tag-item">{token.value}</span>
                : <span key={i}>{token.value}</span>
            )}
          </span>
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
  const [tokens, setTokens] = useState([]);
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
      const lastWord = inputText.split(" ").pop();
      if (lastWord.startsWith("//") && lastWord.length > 2) {
        e.preventDefault();
        const tagLabel = lastWord.slice(2);
        const beforeTag = inputText.slice(0, inputText.length - lastWord.length);
        const newTokens = [...tokens];
        if (beforeTag.trim()) newTokens.push({ type: "text", value: beforeTag.trimStart() });
        newTokens.push({ type: "tag", value: tagLabel });
        setTokens(newTokens);
        setInputText("");
      }
    } else if (e.key === "Backspace" && inputText === "" && tokens.length > 0) {
      const last = tokens[tokens.length - 1];
      if (last.type === "tag") {
        setTokens((prev) => prev.slice(0, -1));
      } else {
        const newTokens = [...tokens];
        newTokens[newTokens.length - 1] = {
          ...last,
          value: last.value.slice(0, -1),
        };
        if (newTokens[newTokens.length - 1].value === "") newTokens.pop();
        setTokens(newTokens);
      }
    }
  };

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

  const canSend = tokens.length > 0 || !!image || inputText.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;

    const finalTokens = [...tokens];
    if (inputText.trim()) finalTokens.push({ type: "text", value: inputText.trim() });

    const tagValues = finalTokens.filter((t) => t.type === "tag").map((t) => t.value);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        tokens: finalTokens,
        image: image || null,
      },
    ]);
    setTokens([]);
    setInputText("");
    setImage(null);
    setImageName("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            tagValues.length > 0
              ? `${tagValues.join(", ")} (으)로 만들 수 있는 레시피를 찾고 있어요... 🔍 (Gemini API 연동 후 실제 추천이 표시됩니다)`
              : image
              ? "사진을 분석하고 있어요... 📷 (Gemini Vision API 연동 후 재료 인식 결과가 표시됩니다)"
              : `답변을 생성하고 있어요... (Gemini API 연동 후 실제 응답이 표시됩니다)`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="page-wrapper" data-theme={theme}>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
      </button>

      <div className="chat-container">
        {/* 헤더 */}
        <div className="chat-header">
          <div className="chat-header-icon">🍽️</div>
          <div>
            <div className="chat-header-title">레시피 AI</div>
            <div className="chat-header-subtitle">재료를 입력하면 레시피를 추천해드려요</div>
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
              onRemove={() => { setImage(null); setImageName(""); }}
            />
          )}

          <div className="input-row">
            <button className="btn-plus" onClick={() => fileRef.current.click()} aria-label="이미지 첨부">
              +
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

            <div className="input-box" onClick={() => inputRef.current.focus()}>
              {tokens.map((token, i) =>
                token.type === "tag"
                  ? <Tag key={i} label={token.value} onRemove={() => setTokens((prev) => prev.filter((_, j) => j !== i))} />
                  : <span key={i} className="input-text-token">{token.value}</span>
              )}
              <input
                ref={inputRef}
                className="input-text-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tokens.length === 0 && !image ? "메시지를 입력하세요. 재료는 //당근 처럼 입력하세요." : ""}
              />
            </div>

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