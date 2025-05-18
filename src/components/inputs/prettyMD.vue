<script setup>
import { ref, watch, nextTick } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Define a custom renderer for markdown (to format code blocks, add a copy button, etc.)
const renderer = new marked.Renderer();

renderer.code = (code, language) => {
    console.log("code:", code);  // Log the whole object

    const escapedCode = code.text.replace(/`/g, '&#96;');
    const lang = language || "plaintext";

    // If the code is an object, use the 'lang' and 'text' properties for rendering
    if (typeof code === 'object' && code.lang && code.text && code.text.length > 0) {
        // Check if the raw code contains triple backticks (block code)
        const rawCode = code.text.replace(/^```.*\n/, '').replace(/\n```$/, '');
        const highlightedCode = hljs.highlight(rawCode, { language: code.lang }).value;

        if (code.raw.startsWith('```')) {
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-lang">${code.lang}</span>
                        <button class="copy-button">
                            Copy
                        </button>
                    </div>
                    
                    <pre><code class="code-block-content language-${code.lang}">${highlightedCode}</code></pre>
                </div>
            `;
        }
    }

    // Fallback for other cases (block code without language, or default behavior)
    if (escapedCode && escapedCode.length > 0) {
        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-lang">${lang}</span>
                    <button class="copy-button">
                        Copy
                    </button>
                </div>
                <pre><code class="code-block-content language-${lang}">${escapedCode}</code></pre>
            </div>
        `;
    }

    return "";
};


const copyCode = async (event) => {
  const button = event.target;
  try {
    // Find the code content
    const codeBlock = button.closest('.code-block');
    const codeContent = codeBlock.querySelector('code').textContent;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(codeContent);
    
    // Visual feedback
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    button.textContent = 'Error';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  }
};


// Props for streaming Markdown content
const props = defineProps({
    content: String, // Streaming markdown response
});

const fullContent = ref(""); // Store full streamed content
const renderedMarkdown = ref("");
const markdownRenderer = ref(null);

// Watch for streaming updates
watch(
    () => props.content,
    async (newContent) => {
        if (!newContent) return;

        // Ensure content is properly split and updated
        const updatedContent = newContent.trim();

        // Append only if it's different from the last update
        if (updatedContent !== fullContent.value) {
            fullContent.value = updatedContent;

            // Ensure the markdown is valid and sanitize it
            const safeContent = ensureValidMarkdown(fullContent.value);

            // Render sanitized Markdown using the custom renderer
            renderedMarkdown.value = marked(safeContent, { renderer });

            // Allow Vue to update before further actions
            await nextTick();
        }

        await nextTick();
        if (markdownRenderer.value) {
            markdownRenderer.value.querySelectorAll('.copy-button').forEach(button => {
                button.addEventListener('click', copyCode);
            });
        }
    },
    { immediate: true }
);

// Ensure code blocks are not broken mid-stream
function ensureValidMarkdown(text) {
    const openCodeBlocks = (text.match(/```/g) || []).length;

    // If odd number of ``` found, add a closing ```
    if (openCodeBlocks % 2 !== 0) {
        text += "\n```"; // Auto-close incomplete code block
    }

    return DOMPurify.sanitize(text);
}

</script>

<template>
    <div class="markdown-renderer" v-html="renderedMarkdown" ref="markdownRenderer"></div>
</template>

<style>
/* Markdown Base Styles */
.markdown-renderer {
    color: #e4e4e4;
    width: 100%;
    max-width: 100%; /* Change from 90% */
}

.markdown-renderer p,
.markdown-renderer li,
.markdown-renderer h1,
.markdown-renderer h2,
.markdown-renderer h3,
.markdown-renderer h4,
.markdown-renderer h5,
.markdown-renderer h6 {
    line-height: 30px;
    /* Set line-height for text elements */
}

.markdown-renderer h1,
.markdown-renderer h2,
.markdown-renderer h3 {
    padding: 10px 0;
    /* Set line-height for text elements */
}

.markdown-renderer a {
    color: #408bec;
    text-decoration: none;
    transition: all 0.3s;
    border: 1px solid transparent;
}

.markdown-renderer a:hover {
    color: #53c0ff;
    border-bottom-color: #53c0ff;
}


/* Code Block Styling */
.code-block {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    margin: 10px 0;
    background: #171717;
    width: 99%;
    max-width: 99%;
    border: 1px solid #3a3a3a;
}


/* Code Header */
.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2f2f2f;
    color: #a7a7a7;
    padding: 5px 15px;
    font-size: 12px;
    height: 30px;
    font-weight: bold;
}

/* Sticky Copy Button */
.copy-button {
    background: #2f2f2f;
    color: #a7a7a7;
    font-size: 12px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
}

.copy-button:hover {
    color: #cecece;
}

/* Code Block */
.code-block pre {
    background: #1e1e1e;
    color: #ffffff;
    padding: 12px;
    margin: 0;
    border-radius: 0 0 8px 8px;
    width: 100%;
    overflow-x: auto;
    word-break: break-word;

    max-width: 100%;
    white-space: pre-wrap;
}

/* Code inside pre */
.code-block pre code {
    background: none;
    color: #d4d4d4;
    display: block;
    overflow-x: auto;
    padding-bottom: 10px;
    scrollbar-width: thin;
    white-space: pre-wrap; /* Add this */
    word-break: break-word;
    scrollbar-color: #d4d4d499 transparent;
    max-width: 100%;
}


/* List Styling */
.markdown-renderer ul,
.markdown-renderer ol {
    padding-left: 1.5em;
    margin: 10px 0 10px 10px;
}

.markdown-renderer li {
    padding-left: 0.5em;
}

.markdown-renderer ol {
    list-style-position: outside;
}

.markdown-renderer ul {
    list-style-position: outside;
}


.markdown-renderer code:not(.code-block-content) {
    color: #d32f2f;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

/* Hover effect for inline-code code */
.markdown-renderer code:not(.code-block-content):hover {
    color: #ec3c3c;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    border: 1px solid #d32f2f;
}
</style>
