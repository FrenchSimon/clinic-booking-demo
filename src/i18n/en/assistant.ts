// The assistant on the clinic's public booking page (checklist #18). `chat`
// goes to a client component: plain strings only.

export const assistant = {
  chat: {
    open: "Questions? Ask us",
    back: "Back to booking",
    title: "Ask {clinic}",
    subtitle: "Prices, opening hours and free slots",
    note: "I answer from the clinic's own information only. I can't give medical advice, and I can't see anyone's bookings. Please don't share health details here: your messages are sent to an AI service.",
    form: "Ask a question",
    question: "Your question",
    placeholder: "Are you open on Saturday?",
    send: "Send",
    thinking: "Looking it up…",
    bookOnPage: "Book and pay on the booking page",
    fallback: "The assistant is resting, you can still book below.",
    limit:
      "That's all the questions for today. The assistant is resting, you can still book below.",
  },
  /** Shown instead of a reply that may have made a slot up. */
  checked: {
    slot: "The next free slot I found is {when}, with {physio}.",
    none: "I can't tell you that. Every free time is on the booking page below.",
  },
  /** "Monday, 23 November 2026 at 11:00": the model repeats it as given. */
  when: "{date} at {time}",
  /** The language rule of the system prompt (the prompt itself stays in English). */
  language:
    "- Reply in the patient's language, in at most three short sentences of plain text, without markdown.",
};
