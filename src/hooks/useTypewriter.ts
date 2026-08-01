import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed: number = 20, isEnabled: boolean = true) {
  const [displayedText, setDisplayedText] = useState(isEnabled ? '' : text);
  const [isTyping, setIsTyping] = useState(isEnabled);

  useEffect(() => {
    if (!isEnabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    let i = 0;
    setIsTyping(true);
    setDisplayedText('');

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isEnabled]);

  return { displayedText, isTyping };
}
