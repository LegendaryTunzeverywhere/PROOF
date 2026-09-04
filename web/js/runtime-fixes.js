/* Runtime compatibility fixes for views that compose icon markup dynamically. */
import { ico } from './ui.js';

function repairNextButton(button) {
  if (!button || !button.textContent.includes('<svg')) return;
  const label = button.textContent.replace(/\s*<svg[\s\S]*$/, '').trim() || 'Next';
  button.innerHTML = `${label} ${ico.arrow}`;
}

function repairLegacyButtons(root = document) {
  root.querySelectorAll?.('#next').forEach(repairNextButton);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'characterData' || mutation.type === 'childList') {
      const target = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
      if (target?.matches?.('#next')) repairNextButton(target);
      else if (target?.querySelector) repairLegacyButtons(target);
    }
  }
});

observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
repairLegacyButtons();
