import { useEffect } from 'react';

export function useDocumentTitle(title: string, prevailOnUnmount: boolean = false) {
  useEffect(() => {
    const fullTitle = title.startsWith('QVerse') ? title : `QVerse — ${title}`;
    document.title = fullTitle;
  }, [title]);

  useEffect(() => {
    return () => {
      if (!prevailOnUnmount) {
        document.title = 'QVerse — Interactive Quantum Algorithm Learning Platform';
      }
    };
  }, [prevailOnUnmount]);
}
