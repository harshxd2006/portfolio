export default function AlternatingItalic({ text }) {
  let charIndex = 0;

  return (
    <>
      {text.split('').map((char, i) => {
        if (char === ' ') {
          return (
            <span key={`${i}-space`} className="inline-block w-[0.35em]" />
          );
        }

        const useItalic = charIndex % 2 === 1;
        charIndex += 1;

        return useItalic ? (
          <em key={`${i}-em`} className="font-light italic">
            {char}
          </em>
        ) : (
          <span key={`${i}-plain`}>{char}</span>
        );
      })}
    </>
  );
}
