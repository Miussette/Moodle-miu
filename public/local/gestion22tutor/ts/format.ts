/// <amd-module name="local_gestion22tutor/format" />

/** Render a small Markdown subset using DOM nodes only. Raw HTML is always text. */
function safeLink(value: string): string | undefined {
    try {
        const url = new URL(value);
        if (!['https:', 'http:', 'mailto:'].includes(url.protocol) || url.username || url.password) {
            return undefined;
        }
        return url.href;
    } catch {
        return undefined;
    }
}

function inline(parent: Node, text: string, depth = 0): void {
    if (depth > 8) {
        parent.appendChild(document.createTextNode(text));
        return;
    }
    const tokens = /\\([\\*_`\[\]()])|`([^`\n]+)`|\[([^\]\n]+)\]\(\s*([^\s)]+)\s*\)|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+)\*|_([^_\n]+)_|https?:\/\/[^\s<>]+/g;
    let offset = 0;
    for (const match of text.matchAll(tokens)) {
        const start = match.index;
        parent.appendChild(document.createTextNode(text.slice(offset, start)));
        const [token, escaped, code, label, destination, bold, underscoreBold, italic, underscoreItalic] = match;
        if (escaped !== undefined) {
            parent.appendChild(document.createTextNode(escaped));
        } else if (code !== undefined) {
            const node = document.createElement('code');
            node.textContent = code;
            parent.appendChild(node);
        } else if (label !== undefined && destination !== undefined) {
            const href = safeLink(destination);
            if (href) {
                const link = document.createElement('a');
                link.href = href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                inline(link, label, depth + 1);
                parent.appendChild(link);
            } else {
                parent.appendChild(document.createTextNode(label));
            }
        } else if (bold !== undefined || underscoreBold !== undefined || italic !== undefined || underscoreItalic !== undefined) {
            const strong = bold ?? underscoreBold;
            const node = document.createElement(strong !== undefined ? 'strong' : 'em');
            inline(node, strong ?? italic ?? underscoreItalic ?? '', depth + 1);
            parent.appendChild(node);
        } else {
            const urlText = token.replace(/[.,;:!?)]+$/, '');
            const href = safeLink(urlText);
            if (href) {
                const link = document.createElement('a');
                link.href = href;
                link.textContent = urlText;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                parent.appendChild(link);
                parent.appendChild(document.createTextNode(token.slice(urlText.length)));
            } else {
                parent.appendChild(document.createTextNode(token));
            }
        }
        offset = start + token.length;
    }
    parent.appendChild(document.createTextNode(text.slice(offset)));
}

export function formatMessage(text: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    let paragraph: HTMLParagraphElement | undefined;
    let list: HTMLUListElement | HTMLOListElement | undefined;
    for (const line of lines) {
        if (!line.trim()) {
            paragraph = undefined;
            list = undefined;
            continue;
        }
        const item = line.match(/^\s*(?:[-*+] |\d+[.)] )(.*)$/);
        if (item) {
            const ordered = /^\s*\d/.test(line);
            if (!list || (list.tagName === 'OL') !== ordered) {
                list = document.createElement(ordered ? 'ol' : 'ul');
                fragment.append(list);
            }
            const node = document.createElement('li');
            inline(node, item[1] ?? '');
            list.append(node);
            paragraph = undefined;
        } else {
            list = undefined;
            if (!paragraph) {
                paragraph = document.createElement('p');
                fragment.append(paragraph);
            } else {
                paragraph.append(document.createElement('br'));
            }
            const heading = line.match(/^#{1,6}\s+(.+)$/);
            if (heading) {
                const strong = document.createElement('strong');
                inline(strong, heading[1] ?? '');
                paragraph.append(strong);
            } else {
                inline(paragraph, line);
            }
        }
    }
    return fragment;
}
