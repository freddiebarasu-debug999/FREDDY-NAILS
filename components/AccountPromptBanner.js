export default function AccountPromptBanner() {
  return (
    <div className="bg-gold text-ink px-5 py-2.5 text-center text-[0.8rem] font-medium">
      <span>💅 Book faster with a free account — save your details and track your appointments.</span>{" "}
      <a
        href="/account/signup"
        className="font-bold underline underline-offset-2 hover:text-ink-soft transition-colors"
      >
        Create your account →
      </a>
    </div>
  );
}
