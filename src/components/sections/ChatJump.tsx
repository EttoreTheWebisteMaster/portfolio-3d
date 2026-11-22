/** A round button that appears once the chat is scrolled up from its newest message, and takes it back down. */
export default function ChatJump({
  show,
  onJump,
}: Readonly<{ show: boolean; onJump: () => void }>) {
  return (
    <button
      type="button"
      className="chat-jump"
      aria-label="Jump to the latest message"
      data-show={show || undefined}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show || undefined}
      onClick={onJump}
    >
      <svg viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M7 2v10M2.5 7.5 7 12l4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );
}
