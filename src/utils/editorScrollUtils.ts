/**
 * Utility functions for enhanced editor scrolling experience
 */

export interface ScrollPosition {
  top: number;
  left: number;
}

export interface LinePosition {
  line: number;
  column?: number;
}

/**
 * Smoothly scroll to a specific line in the editor
 */
export const scrollToLine = (
  editor: HTMLTextAreaElement,
  lineNumber: number,
  column: number = 0
): void => {
  if (!editor) return;

  const lines = editor.value.split('\n');
  if (lineNumber < 1 || lineNumber > lines.length) return;

  // Calculate character position for the line
  let charPosition = 0;
  for (let i = 0; i < lineNumber - 1; i++) {
    charPosition += lines[i].length + 1; // +1 for newline character
  }
  charPosition += Math.min(column, lines[lineNumber - 1]?.length || 0);

  // Set cursor position
  editor.setSelectionRange(charPosition, charPosition);

  // Calculate scroll position
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24;
  const scrollTop = (lineNumber - 1) * lineHeight;

  // Smooth scroll to the line
  editor.scrollTo({
    top: scrollTop,
    behavior: 'smooth'
  });

  // Focus the editor
  editor.focus();
};

/**
 * Get the current line and column position of the cursor
 */
export const getCurrentPosition = (editor: HTMLTextAreaElement): LinePosition => {
  if (!editor) return { line: 1, column: 0 };

  const cursorPosition = editor.selectionStart;
  const textBeforeCursor = editor.value.substring(0, cursorPosition);
  const lines = textBeforeCursor.split('\n');
  
  return {
    line: lines.length,
    column: lines[lines.length - 1].length
  };
};

/**
 * Save the current scroll position
 */
export const saveScrollPosition = (editor: HTMLTextAreaElement): ScrollPosition => {
  return {
    top: editor.scrollTop,
    left: editor.scrollLeft
  };
};

/**
 * Restore a previously saved scroll position
 */
export const restoreScrollPosition = (
  editor: HTMLTextAreaElement,
  position: ScrollPosition,
  smooth: boolean = false
): void => {
  if (!editor) return;

  if (smooth) {
    editor.scrollTo({
      top: position.top,
      left: position.left,
      behavior: 'smooth'
    });
  } else {
    editor.scrollTop = position.top;
    editor.scrollLeft = position.left;
  }
};

/**
 * Scroll to show a specific range of text
 */
export const scrollToRange = (
  editor: HTMLTextAreaElement,
  start: number,
  end: number
): void => {
  if (!editor) return;

  // Set selection to the range
  editor.setSelectionRange(start, end);

  // Calculate the line of the start position
  const textBeforeStart = editor.value.substring(0, start);
  const lineNumber = textBeforeStart.split('\n').length;

  // Scroll to show the selection
  scrollToLine(editor, lineNumber);
};

/**
 * Auto-scroll to keep cursor visible during typing
 */
export const ensureCursorVisible = (editor: HTMLTextAreaElement): void => {
  if (!editor) return;

  const { line } = getCurrentPosition(editor);
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24;
  const editorHeight = editor.clientHeight;
  const currentScrollTop = editor.scrollTop;
  
  const cursorTop = (line - 1) * lineHeight;
  const cursorBottom = cursorTop + lineHeight;
  
  // Check if cursor is above visible area
  if (cursorTop < currentScrollTop) {
    editor.scrollTop = cursorTop - lineHeight; // Add some padding
  }
  // Check if cursor is below visible area
  else if (cursorBottom > currentScrollTop + editorHeight) {
    editor.scrollTop = cursorBottom - editorHeight + lineHeight; // Add some padding
  }
};

/**
 * Smooth scroll to top of editor
 */
export const scrollToTop = (editor: HTMLTextAreaElement): void => {
  if (!editor) return;
  
  editor.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Smooth scroll to bottom of editor
 */
export const scrollToBottom = (editor: HTMLTextAreaElement): void => {
  if (!editor) return;
  
  editor.scrollTo({
    top: editor.scrollHeight,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Check if element is scrollable horizontally
 */
export const isHorizontallyScrollable = (element: HTMLElement): boolean => {
  return element.scrollWidth > element.clientWidth;
};

/**
 * Check if element is scrollable vertically
 */
export const isVerticallyScrollable = (element: HTMLElement): boolean => {
  return element.scrollHeight > element.clientHeight;
};

/**
 * Get scroll percentage (0-100) for both axes
 */
export const getScrollPercentage = (element: HTMLElement): { x: number; y: number } => {
  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  
  return {
    x: maxScrollLeft > 0 ? (element.scrollLeft / maxScrollLeft) * 100 : 0,
    y: maxScrollTop > 0 ? (element.scrollTop / maxScrollTop) * 100 : 0
  };
};

/**
 * Debounced scroll handler to improve performance
 */
export const createDebouncedScrollHandler = (
  callback: (event: Event) => void,
  delay: number = 100
): (event: Event) => void => {
  let timeoutId: number | null = null;
  
  return (event: Event) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      callback(event);
      timeoutId = null;
    }, delay);
  };
};