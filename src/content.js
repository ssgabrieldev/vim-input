import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { vim, Vim } from "@replit/codemirror-vim";
import { oneDark } from "@codemirror/theme-one-dark";

let view = null;
let hostElement = null;

function saveAndClose(target) {
  if (!view || !hostElement) return;

  const content = view.state.doc.toString();

  if (["DIV", "TEXTAREA"].includes(target.tagName)) {
    target.value = content;
  } else {
    target.textContent = content;
  }

  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));

  hostElement.remove();
  hostElement = null;

  view.destroy();

  view = null;

  requestAnimationFrame(() => {
    target.focus();
  });
}

function setupVimEditor(target) {
  const rect = target.getBoundingClientRect();

  hostElement = document.createElement('div');
  hostElement._originalTarget = target;

  Object.assign(hostElement.style, {
    position: 'absolute',
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    zIndex: '2147483647',
  });

  const container = document.createElement('div');
  const style = document.createElement('style');

  style.textContent = `
    .cm-editor { 
      background: #1e1e1e; 
      color: #d4d4d4; 
      border: 1px solid #007acc;
      min-width: ${rect.width}px;
    }
    .cm-vim-editor { 
      background: #1e1e1e; 
      color: #d4d4d4; 
      border: 1px solid #007acc;
      min-width: ${rect.width}px;
    }
    .cm-fat-cursor {
      background: #528bff !important;
    }
  `;

  hostElement.appendChild(style);
  hostElement.appendChild(container);
  document.body.appendChild(hostElement);

  view = new EditorView({
    state: EditorState.create({
      doc: ['INPUT', "DIV"].includes(target.tagName) ? target.value : target.textContent,
      extensions: [
        vim(),
        basicSetup,
        oneDark,
        EditorView.domEventHandlers({
          blur(_event) {
            setTimeout(() => {
              if (!hostElement?.contains(document.activeElement)) {
                if (hostElement) {
                  view.destroy();
                  hostElement.remove();
                  hostElement = null;
                  view = null;
                }
              }
            }, 100);
          }
        })
      ]
    }),
    parent: hostElement,
  });

  view.focus();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'i') {
    const el = document.activeElement;
    if ((['INPUT', "DIV", 'TEXTAREA'].includes(el.tagName)) && !hostElement) {
      e.preventDefault();
      setupVimEditor(el);
    }
  }

  if (e.key === 'Escape' && hostElement && view) {
    view.destroy();
    hostElement.remove();
    hostElement = null;
    view = null;
  }
});

Vim.defineEx("write", "w", () => {
  saveAndClose(hostElement._originalTarget);
});

Vim.map("<C-;>", "<Esc>", "insert");
