// Local storage key
const STORAGE_KEY = "dada-board-messages"

/**
 * Saves messages to local storage
 */
export function saveMessages(messages) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }
}

/**
 * Loads messages from local storage
 */
export function loadMessages() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to load messages from storage:", error)
    return []
  }
}

/**
 * Adds a new message and saves to storage
 */
export function addMessageToStorage(message, existingMessages) {
  const updatedMessages = [message, ...existingMessages]
  saveMessages(updatedMessages)
  return updatedMessages
} 