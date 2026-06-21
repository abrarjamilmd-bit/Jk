/**
 * Simple, robust Markdown parser that outputs sanitized styled HTML strings.
 * Built with safety in mind to prevent XSS while allowing rich formats such as:
 * - Bold: **text**
 * - Italic: *text*
 * - Monospace/Code: `text`
 * - Headings: ### Heading or ## Heading
 * - Bullet lists: - Point 1 (line-by-line)
 * - Blockquotes: > quote
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  // 1. Simple HTML escape to prevent XSS injections
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Restore blockquote markers specifically for processing
  escaped = escaped.replace(/^&gt;\s*(.*)$/gm, "> $1");

  const lines = escaped.split("\n");
  const processedLines: string[] = [];
  let inList = false;

  for (let line of lines) {
    let trimmedLine = line.trim();

    // Handle bullet lists
    if (trimmedLine.startsWith("- ")) {
      if (!inList) {
        processedLines.push("<ul class='list-disc pl-4 space-y-1 my-1.5 text-slate-650 dark:text-slate-300'>");
        inList = true;
      }
      let content = trimmedLine.substring(2);
      content = parseInlineMarkdown(content);
      processedLines.push(`<li class='text-xs leading-relaxed'>${content}</li>`);
      continue;
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
    }

    // Handle blockquotes
    if (line.startsWith("> ")) {
      let content = line.substring(2);
      content = parseInlineMarkdown(content);
      processedLines.push(`<blockquote class='border-l-4 border-teal-500/80 bg-slate-50 dark:bg-slate-850/50 pl-3 py-1.5 my-2 italic text-xs text-slate-600 dark:text-slate-400 rounded-r-lg'>${content}</blockquote>`);
      continue;
    }

    // Handle headings
    if (trimmedLine.startsWith("### ")) {
      let content = trimmedLine.substring(4);
      content = parseInlineMarkdown(content);
      processedLines.push(`<h4 class='text-xs font-black text-slate-800 dark:text-white mt-3 mb-1.5 tracking-wide uppercase flex items-center gap-1.5'>📍 ${content}</h4>`);
      continue;
    }
    if (trimmedLine.startsWith("## ")) {
      let content = trimmedLine.substring(3);
      content = parseInlineMarkdown(content);
      processedLines.push(`<h3 class='text-sm font-extrabold text-slate-850 dark:text-emerald-400 mt-4 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-1'>⚓ ${content}</h3>`);
      continue;
    }

    // Handle blank lines
    if (trimmedLine === "") {
      processedLines.push("<div class='h-2'></div>");
    } else {
      // Normal paragraph
      let content = parseInlineMarkdown(line);
      processedLines.push(`<p class='text-xs leading-relaxed my-1'>${content}</p>`);
    }
  }

  if (inList) {
    processedLines.push("</ul>");
  }

  return processedLines.join("\n");
}

function parseInlineMarkdown(text: string): string {
  let parsed = text;

  // Code inline: `code`
  parsed = parsed.replace(/`([^`]+)`/g, "<code class='bg-slate-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-150 dark:border-slate-750/60'>$1</code>");

  // Bold-italic: ***text***
  parsed = parsed.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong class='font-black text-slate-900 dark:text-white'><em>$1</em></strong>");

  // Bold: **text**
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, "<strong class='font-bold text-slate-900 dark:text-white'>$1</strong>");

  // Italic: *text*
  parsed = parsed.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Line-through: ~~text~~
  parsed = parsed.replace(/~~([^~]+)~~/g, "<span class='line-through text-slate-400 dark:text-slate-500'>$1</span>");

  return parsed;
}
