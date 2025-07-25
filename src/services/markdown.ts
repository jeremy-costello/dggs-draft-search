export const formatMarkdown = (markdown: string): string => {
  // Replace non-breaking spaces with regular spaces
  let formatted = markdown.replace(/\u00a0/g, ' ');
  
  // Format JSON code blocks
  formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
    const trimmed = code.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      // Remove spaces only outside of quotes
      let cleanedJson = '';
      let insideQuotes = false;
      
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        const prevChar = trimmed[i - 1];
        
        // Track if we're inside quotes (ignore escaped quotes)
        if (char === '"' && prevChar !== '\\') {
          insideQuotes = !insideQuotes;
          cleanedJson += char;
        } else if (insideQuotes) {
          // Inside quotes, keep all characters including spaces
          cleanedJson += char;
        } else if (!/\s/.test(char)) {
          // Outside quotes, only keep non-whitespace characters
          cleanedJson += char;
        }
      }
      
      let indentLevel = 0;
      let result = '';
      insideQuotes = false;
      
      for (let i = 0; i < cleanedJson.length; i++) {
        const char = cleanedJson[i];
        const nextChar = cleanedJson[i + 1];
        const prevChar = cleanedJson[i - 1];
        
        // Track if we're inside quotes (ignore escaped quotes)
        if (char === '"' && prevChar !== '\\') {
          insideQuotes = !insideQuotes;
        }
        
        // Only apply formatting if we're not inside quotes
        if (!insideQuotes) {
          if (char === '{' || char === '[') {
            result += char + '\n';
            indentLevel++;
            result += '    '.repeat(indentLevel);
          } else if (char === '}' || char === ']') {
            indentLevel--;
            result = result.trimEnd() + '\n' + '    '.repeat(indentLevel) + char;
            if (nextChar === ',' || nextChar === '}' || nextChar === ']') {
              // Don't add newline yet, let the next iteration handle it
            } else if (i < cleanedJson.length - 1) {
              result += '\n' + '    '.repeat(indentLevel);
            }
          } else if (char === ',') {
            result += char + '\n' + '    '.repeat(indentLevel);
          } else if (char === ':') {
            result += char + ' ';
          } else {
            result += char;
          }
        } else {
          // Inside quotes, just add the character as-is
          result += char;
        }
      }
      
      return '```json\n' + result + '\n```';
    }
    return '```\n' + trimmed + '\n```';
  });
  
  return formatted;
};