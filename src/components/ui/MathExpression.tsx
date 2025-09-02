import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MathExpressionProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
}

const MathExpression: React.FC<MathExpressionProps> = ({
  expression,
  displayMode = false,
  className = "",
}) => {
  const convertToLatex = (text: string): string => {
    if (!text) return text;

    // Convert common plain text math expressions to LaTeX
    let latex = text
      // Square roots
      .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
      .replace(/sqrt\s+([a-zA-Z0-9]+)/g, "\\sqrt{$1}")

      // Fractions
      .replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")
      .replace(/([a-zA-Z])\/([a-zA-Z0-9])/g, "\\frac{$1}{$2}")

      // Powers/exponents
      .replace(/([a-zA-Z0-9])\^(\d+)/g, "$1^{$2}")
      .replace(/([a-zA-Z0-9])\^([a-zA-Z])/g, "$1^{$2}")

      // Subscripts
      .replace(/([a-zA-Z0-9])_(\d+)/g, "$1_{$2}")
      .replace(/([a-zA-Z0-9])_([a-zA-Z])/g, "$1_{$2}")

      // Greek letters
      .replace(/alpha/g, "\\alpha")
      .replace(/beta/g, "\\beta")
      .replace(/gamma/g, "\\gamma")
      .replace(/delta/g, "\\delta")
      .replace(/epsilon/g, "\\epsilon")
      .replace(/theta/g, "\\theta")
      .replace(/lambda/g, "\\lambda")
      .replace(/mu/g, "\\mu")
      .replace(/pi/g, "\\pi")
      .replace(/sigma/g, "\\sigma")
      .replace(/phi/g, "\\phi")
      .replace(/omega/g, "\\omega")

      // Trigonometric functions
      .replace(/sin\(([^)]+)\)/g, "\\sin($1)")
      .replace(/cos\(([^)]+)\)/g, "\\cos($1)")
      .replace(/tan\(([^)]+)\)/g, "\\tan($1)")
      .replace(/csc\(([^)]+)\)/g, "\\csc($1)")
      .replace(/sec\(([^)]+)\)/g, "\\sec($1)")
      .replace(/cot\(([^)]+)\)/g, "\\cot($1)")

      // Logarithmic functions
      .replace(/log\(([^)]+)\)/g, "\\log($1)")
      .replace(/ln\(([^)]+)\)/g, "\\ln($1)")

      // Other mathematical functions
      .replace(/abs\(([^)]+)\)/g, "|$1|")
      .replace(/floor\(([^)]+)\)/g, "\\lfloor $1 \\rfloor")
      .replace(/ceil\(([^)]+)\)/g, "\\lceil $1 \\rceil")

      // Multiplication symbols
      .replace(/(\d+)\s*\*\s*([a-zA-Z])/g, "$1 \\cdot $2")
      .replace(/([a-zA-Z])\s*\*\s*(\d+)/g, "$1 \\cdot $2")
      .replace(/([a-zA-Z])\s*\*\s*([a-zA-Z])/g, "$1 \\cdot $2")

      // Division symbols
      .replace(/([a-zA-Z0-9])\s*\/\s*([a-zA-Z0-9])/g, "\\frac{$1}{$2}")

      // Plus/minus
      .replace(/\+\/-/g, "\\pm")
      .replace(/-\/\+/g, "\\mp")

      // Infinity
      .replace(/infinity/g, "\\infty")

      // Set notation
      .replace(/\{\s*([^}]+)\s*\}/g, "\\{$1\\}")
      .replace(/\[\s*([^\]]+)\s*\]/g, "[$1]")
      .replace(/\(\s*([^)]+)\s*\)/g, "($1)")

      // Arrow notation
      .replace(/->/g, "\\rightarrow")
      .replace(/<-/g, "\\leftarrow")
      .replace(/<=>/g, "\\leftrightarrow")
      .replace(/=>/g, "\\Rightarrow")
      .replace(/<=/g, "\\Leftarrow")
      .replace(/<=>/g, "\\Leftrightarrow")

      // Set operations
      .replace(/union/g, "\\cup")
      .replace(/intersection/g, "\\cap")
      .replace(/subset/g, "\\subset")
      .replace(/superset/g, "\\supset")
      .replace(/subseteq/g, "\\subseteq")
      .replace(/supseteq/g, "\\supseteq")
      .replace(/in/g, "\\in")
      .replace(/notin/g, "\\notin")

      // Logic operators
      .replace(/and/g, "\\land")
      .replace(/or/g, "\\lor")
      .replace(/not/g, "\\neg")
      .replace(/implies/g, "\\implies")
      .replace(/iff/g, "\\iff")

      // Clean up extra spaces
      .replace(/\s+/g, " ")
      .trim();

    return latex;
  };

  const renderMath = () => {
    try {
      const latex = convertToLatex(expression);

      // Check if the expression contains any LaTeX commands
      if (latex.includes("\\")) {
        return katex.renderToString(latex, {
          displayMode,
          throwOnError: false,
          errorColor: "#cc0000",
          strict: false,
        });
      }

      // If no LaTeX commands, return the original text
      return expression;
    } catch (error) {
      console.warn("Math rendering failed:", error);
      return expression;
    }
  };

  const mathHtml = renderMath();

  if (mathHtml === expression) {
    // No math to render, return plain text
    return <span className={className}>{expression}</span>;
  }

  // Render math expression
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: mathHtml }}
    />
  );
};

export default MathExpression;
