/**
 * Error Parser - Extracts structured error information from build output
 * 
 * Parses various error formats:
 * - TypeScript compiler errors
 * - ESLint errors
 * - Vite build errors
 * - Syntax errors
 * - Module resolution errors
 */

export interface ParsedError {
  file?: string;
  line?: number;
  column?: number;
  errorType: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning';
  context?: string;
}

export interface ErrorParseResult {
  errors: ParsedError[];
  summary: string;
  detailedMessage: string;
}

/**
 * Parse build output and extract structured error information
 */
export function parseBuildErrors(buildOutput: string): ErrorParseResult {
  const errors: ParsedError[] = [];
  const lines = buildOutput.split('\n');
  
  // Pattern matchers for different error formats
  const patterns = {
    // TypeScript: src/App.tsx(45,10): error TS2304: Cannot find name 'foo'.
    typescript: /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+TS(\d+):\s*(.+)$/,
    
    // ESLint: /path/to/file.ts:45:10: error message (rule-name)
    eslint: /^(.+?):(\d+):(\d+):\s*(error|warning)\s+(.+?)\s*\((.+?)\)$/,
    
    // Vite: [vite] error: message
    vite: /^\[vite\]\s*(error|warning):\s*(.+)$/,
    
    // Generic error with file:line:column
    generic: /^(.+?):(\d+):(\d+):\s*(error|warning):\s*(.+)$/,
    
    // Module not found: Error: Cannot find module 'foo'
    moduleNotFound: /Error:\s*Cannot find module\s*['"](.+?)['"]/,
    
    // Syntax error: SyntaxError: Unexpected token
    syntaxError: /SyntaxError:\s*(.+)/,
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try TypeScript format
    let match = line.match(patterns.typescript);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4] as 'error' | 'warning',
        code: `TS${match[5]}`,
        errorType: 'TypeScript',
        message: match[6],
        context: extractContext(lines, i),
      });
      continue;
    }
    
    // Try ESLint format
    match = line.match(patterns.eslint);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4] as 'error' | 'warning',
        errorType: 'ESLint',
        message: match[5],
        code: match[6],
        context: extractContext(lines, i),
      });
      continue;
    }
    
    // Try Vite format
    match = line.match(patterns.vite);
    if (match) {
      errors.push({
        severity: match[1] as 'error' | 'warning',
        errorType: 'Vite',
        message: match[2],
        context: extractContext(lines, i),
      });
      continue;
    }
    
    // Try generic format
    match = line.match(patterns.generic);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4] as 'error' | 'warning',
        errorType: 'Build',
        message: match[5],
        context: extractContext(lines, i),
      });
      continue;
    }
    
    // Try module not found
    match = line.match(patterns.moduleNotFound);
    if (match) {
      errors.push({
        severity: 'error',
        errorType: 'Module Resolution',
        message: `Cannot find module '${match[1]}'`,
        context: extractContext(lines, i),
      });
      continue;
    }
    
    // Try syntax error
    match = line.match(patterns.syntaxError);
    if (match) {
      errors.push({
        severity: 'error',
        errorType: 'Syntax',
        message: match[1],
        context: extractContext(lines, i),
      });
      continue;
    }
  }
  
  // If no structured errors found, look for generic error indicators
  if (errors.length === 0) {
    const errorKeywords = ['error', 'failed', 'cannot', 'unable', 'missing', 'not found'];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (errorKeywords.some(keyword => line.includes(keyword))) {
        errors.push({
          severity: 'error',
          errorType: 'Build',
          message: lines[i].trim(),
          context: extractContext(lines, i),
        });
      }
    }
  }
  
  // Generate summary and detailed message
  const summary = generateSummary(errors);
  const detailedMessage = generateDetailedMessage(errors, buildOutput);
  
  return {
    errors,
    summary,
    detailedMessage,
  };
}

/**
 * Extract context lines around an error
 */
function extractContext(lines: string[], errorIndex: number, contextLines: number = 3): string {
  const start = Math.max(0, errorIndex - contextLines);
  const end = Math.min(lines.length, errorIndex + contextLines + 1);
  return lines.slice(start, end).join('\n');
}

/**
 * Generate a human-readable summary of errors
 */
function generateSummary(errors: ParsedError[]): string {
  if (errors.length === 0) {
    return "Build failed with unknown error";
  }
  
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }
  
  return `Build failed with ${parts.join(' and ')}`;
}

/**
 * Generate detailed message for AI to understand and fix
 */
function generateDetailedMessage(errors: ParsedError[], rawOutput: string): string {
  if (errors.length === 0) {
    return `Build failed. Here's the full output:\n\n${rawOutput.slice(0, 2000)}`;
  }
  
  const sections: string[] = [];
  
  sections.push("# Build Errors\n");
  sections.push(`Found ${errors.length} issue${errors.length > 1 ? 's' : ''} that need to be fixed:\n`);
  
  errors.forEach((error, index) => {
    sections.push(`## Error ${index + 1}: ${error.errorType}`);
    
    if (error.file) {
      sections.push(`**File:** ${error.file}`);
      if (error.line) {
        sections.push(`**Location:** Line ${error.line}${error.column ? `, Column ${error.column}` : ''}`);
      }
    }
    
    if (error.code) {
      sections.push(`**Code:** ${error.code}`);
    }
    
    sections.push(`**Message:** ${error.message}`);
    
    if (error.context) {
      sections.push(`**Context:**\n\`\`\`\n${error.context}\n\`\`\``);
    }
    
    sections.push(''); // Empty line between errors
  });
  
  sections.push("\n## Instructions");
  sections.push("Please fix these errors one by one. Focus on:");
  sections.push("1. The specific file and line number mentioned");
  sections.push("2. The error message and what it's asking for");
  sections.push("3. Making minimal changes to fix the issue");
  sections.push("4. Ensuring the fix doesn't break other parts of the code");
  
  return sections.join('\n');
}

/**
 * Format error for display in console/logs
 */
export function formatErrorForDisplay(error: ParsedError): string {
  const parts: string[] = [];
  
  if (error.file) {
    parts.push(`${error.file}:${error.line || '?'}:${error.column || '?'}`);
  }
  
  parts.push(`[${error.errorType}]`);
  
  if (error.code) {
    parts.push(`(${error.code})`);
  }
  
  parts.push(error.message);
  
  return parts.join(' ');
}
