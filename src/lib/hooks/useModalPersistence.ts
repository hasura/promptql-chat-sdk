import { useState, useCallback } from "react";

/**
 * Modal state for persistence
 */
export type ModalState = "closed" | "open" | "fullscreen";

/**
 * Return type for the useModalPersistence hook
 */
export interface UseModalPersistenceReturn {
  /** Current modal state */
  modalState: ModalState;
  /** Whether the modal is open (open or fullscreen) */
  isModalOpen: boolean;
  /** Whether the modal is in fullscreen mode */
  isFullscreen: boolean;
  /** Set the modal state */
  setModalState: (state: ModalState) => void;
  /** Toggle between closed and open states */
  toggleModal: () => void;
  /** Close the modal */
  closeModal: () => void;
  /** Toggle fullscreen mode (only when modal is open) */
  toggleFullscreen: () => void;
}

/**
 * Hook for modal state persistence across sessions using localStorage
 * Manages the three modal states: closed, open, and fullscreen
 */
export function useModalPersistence(projectId: string): UseModalPersistenceReturn {
  const storageKey = `promptql-modal-${projectId}`;

  // Check if localStorage is available
  const isStorageAvailable = useCallback(() => {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Validate modal state
  const isValidModalState = useCallback((state: string): state is ModalState => {
    return state === "closed" || state === "open" || state === "fullscreen";
  }, []);

  // Initialize state synchronously from localStorage to prevent flash
  const getInitialState = useCallback((): ModalState => {
    if (!isStorageAvailable()) return "closed";

    try {
      const storedState = localStorage.getItem(storageKey);
      if (storedState && isValidModalState(storedState)) {
        return storedState;
      }
    } catch (error) {
      console.warn("Failed to load modal state from localStorage:", error);
    }
    return "closed";
  }, [storageKey, isStorageAvailable, isValidModalState]);

  const [modalState, setModalStateInternal] = useState<ModalState>(getInitialState);

  // Set modal state and persist to localStorage
  const setModalState = useCallback(
    (state: ModalState) => {
      setModalStateInternal(state);

      if (!isStorageAvailable()) return;

      try {
        localStorage.setItem(storageKey, state);
      } catch (error) {
        console.warn("Failed to persist modal state to localStorage:", error);
      }
    },
    [storageKey, isStorageAvailable]
  );

  // Derived state
  const isModalOpen = modalState === "open" || modalState === "fullscreen";
  const isFullscreen = modalState === "fullscreen";

  // Modal actions
  const toggleModal = useCallback(() => {
    setModalState(modalState === "closed" ? "open" : "closed");
  }, [modalState, setModalState]);

  const closeModal = useCallback(() => {
    setModalState("closed");
  }, [setModalState]);

  const toggleFullscreen = useCallback(() => {
    if (modalState === "closed") {
      // If modal is closed, open it in fullscreen mode
      setModalState("fullscreen");
    } else if (modalState === "open") {
      // If modal is open, switch to fullscreen
      setModalState("fullscreen");
    } else {
      // If modal is fullscreen, switch back to open
      setModalState("open");
    }
  }, [modalState, setModalState]);

  return {
    modalState,
    isModalOpen,
    isFullscreen,
    setModalState,
    toggleModal,
    closeModal,
    toggleFullscreen,
  };
}
