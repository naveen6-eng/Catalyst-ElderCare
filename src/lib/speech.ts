// Web Speech API text-to-speech helper for senior accessibility
export function speakInstruction(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slightly slower, clear cadence for elderly listeners
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
