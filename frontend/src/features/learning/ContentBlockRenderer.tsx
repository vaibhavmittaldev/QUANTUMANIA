import React, { useState } from 'react';
import { ContentBlock } from '../../types/learning';
import { Info, Lightbulb, AlertTriangle, Binary, Copy, Check } from 'lucide-react';

interface ContentBlockRendererProps {
  block: ContentBlock;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ block }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  switch (block.type) {
    case 'heading':
      return (
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            marginTop: '2rem',
            marginBottom: '0.85rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.4rem'
          }}
        >
          {block.content}
        </h2>
      );

    case 'subheading':
      return (
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            marginTop: '1.5rem',
            marginBottom: '0.65rem',
            color: 'var(--accent-cyan)'
          }}
        >
          {block.content}
        </h3>
      );

    case 'text':
      return (
        <p
          style={{
            fontSize: '1.025rem',
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem'
          }}
        >
          {block.content}
        </p>
      );

    case 'equation':
      return (
        <div
          style={{
            margin: '1.5rem 0',
            padding: '1.25rem 1.5rem',
            backgroundColor: 'rgba(14, 21, 38, 0.75)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-glow-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              letterSpacing: '0.05em'
            }}
          >
            {block.content}
          </code>
        </div>
      );

    case 'callout': {
      const variant = block.variant || 'info';
      const styles = {
        info: {
          bg: 'rgba(0, 242, 254, 0.08)',
          border: 'rgba(0, 242, 254, 0.3)',
          color: '#7dd3fc',
          icon: Info
        },
        tip: {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.3)',
          color: '#86efac',
          icon: Lightbulb
        },
        warning: {
          bg: 'rgba(245, 158, 11, 0.08)',
          border: 'rgba(245, 158, 11, 0.3)',
          color: '#fcd34d',
          icon: AlertTriangle
        },
        formula: {
          bg: 'rgba(139, 92, 246, 0.08)',
          border: 'rgba(139, 92, 246, 0.3)',
          color: '#c4b5fd',
          icon: Binary
        }
      }[variant];

      const IconComponent = styles.icon;

      return (
        <div
          style={{
            margin: '1.5rem 0',
            padding: '1rem 1.25rem',
            backgroundColor: styles.bg,
            borderLeft: `4px solid ${styles.border}`,
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start'
          }}
        >
          <IconComponent size={20} style={{ color: styles.color, flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {block.content}
          </div>
        </div>
      );
    }

    case 'code':
      return (
        <div
          style={{
            margin: '1.5rem 0',
            backgroundColor: '#070b14',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <span>{block.language || 'python'}</span>
            <button
              onClick={() => handleCopy(block.content)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              className="btn-ghost"
              aria-label="Copy code to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre
            style={{
              padding: '1.25rem',
              overflowX: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: '#e2e8f0'
            }}
          >
            <code>{block.content}</code>
          </pre>
        </div>
      );

    case 'bullet_list':
      return (
        <ul
          style={{
            listStyleType: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            margin: '1rem 0 1.5rem 0'
          }}
        >
          {block.items?.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.975rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-cyan)',
                  marginTop: '0.55rem',
                  flexShrink: 0
                }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'numbered_list':
      return (
        <ol
          style={{
            listStyleType: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            margin: '1rem 0 1.5rem 0'
          }}
        >
          {block.items?.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                fontSize: '0.975rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                {idx + 1}
              </div>
              <span style={{ flex: 1 }}>{item}</span>
            </li>
          ))}
        </ol>
      );

    case 'example':
      return (
        <div
          className="card"
          style={{
            margin: '1.5rem 0',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}
        >
          {block.title && (
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-purple)',
                marginBottom: '0.5rem'
              }}
            >
              Example: {block.title}
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {block.content}
          </p>
        </div>
      );

    default:
      return null;
  }
};
