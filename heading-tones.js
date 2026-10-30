export function isSlateWord(index, length) {
  if (length < 2) return false;
  const start = Math.floor(length / 2);
  return index >= start && index < start + Math.max(1, Math.ceil(length * .25));
}

// Wrap text only: preserve links, line breaks, icons, and heading semantics.
export function toneHeading(heading) {
  if (heading.querySelector('.heading-tone-muted')) return;
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement.closest('[aria-hidden="true"],svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const content = nodes.map(node => node.textContent).join('');
  const words = [...content.matchAll(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu)];
  const mutedRanges = words.filter((word, index) => isSlateWord(index, words.length)).map(word => [word.index, word.index + word[0].length]);
  let offset = 0;
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    let buffer = '';
    let muted = false;
    const flush = () => {
      if (!buffer) return;
      if (muted) {
        const span = document.createElement('span');
        span.className = 'heading-tone-muted';
        span.textContent = buffer;
        fragment.append(span);
      } else fragment.append(document.createTextNode(buffer));
      buffer = '';
    };
    for (const character of node.textContent) {
      const nextMuted = mutedRanges.some(([start, end]) => offset >= start && offset < end);
      if (nextMuted !== muted) { flush(); muted = nextMuted; }
      buffer += character;
      offset += character.length;
    }
    flush();
    // Keep the original text node as one layout item in flex headings/links.
    // Otherwise each color run receives the parent's gap and justification.
    if (fragment.querySelector('.heading-tone-muted')) {
      const text = document.createElement('span');
      text.className = 'heading-tone-text';
      text.append(fragment);
      node.replaceWith(text);
    }
  }
}

export function setupHeadingTones() {
  document.querySelectorAll('h1,h2,h3,h4,h5,h6,.brand,.skills-tab-label').forEach(toneHeading);
}
