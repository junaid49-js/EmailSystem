export function compileBlocksToHtml(blocks = [], variables = {}) {
  if (!Array.isArray(blocks)) return '';

  const compiledParts = blocks.map(block => {
    const p = { ...block, ...(block.props || {}) };
    const type = block.type || p.type;

    switch (type) {
      case 'heading': {
        const level = p.level || 2;
        const size = p.fontSize || (level === 1 ? '26px' : level === 2 ? '22px' : '18px');
        const align = p.align || 'left';
        const color = p.color || '#0f172a';
        const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '16px';
        const rawText = p.text || p.content || '';
        const text = substituteVariables(rawText, variables);
        return `<h${level} style="margin: 0 0 ${mb} 0; font-size: ${size}; font-weight: 700; color: ${color}; text-align: ${align}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.3;">${text}</h${level}>`;
      }

      case 'text': {
        const align = p.align || 'left';
        const color = p.color || '#334155';
        const size = p.fontSize ? `${p.fontSize}px` : '15px';
        const lineHeight = p.lineHeight || '1.6';
        const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '16px';
        const rawContent = p.content || p.text || '';
        const content = substituteVariables(rawContent, variables);
        return `<p style="margin: 0 0 ${mb} 0; font-size: ${size}; line-height: ${lineHeight}; color: ${color}; text-align: ${align}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${content}</p>`;
      }

      case 'button': {
        const align = p.align || 'center';
        const bg = p.backgroundColor || p.bg || '#4f46e5';
        const textColor = p.textColor || p.color || '#ffffff';
        const py = p.paddingY || 12;
        const px = p.paddingX || 28;
        const radius = p.borderRadius !== undefined ? `${p.borderRadius}px` : '8px';
        const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '24px';
        const rawUrl = p.url || p.href || '#';
        const rawLabel = p.label || p.text || 'Click Here';
        const url = substituteVariables(rawUrl, variables);
        const label = substituteVariables(rawLabel, variables);

        return `<div style="text-align: ${align}; margin: 0 0 ${mb} 0;">
  <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: ${bg}; color: ${textColor}; padding: ${py}px ${px}px; text-decoration: none; border-radius: ${radius}; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${label}</a>
</div>`;
      }

      case 'image': {
        const align = p.align || 'center';
        const src = substituteVariables(p.src || '', variables);
        const alt = p.alt || 'Email Image';
        const width = p.width ? `${p.width}%` : '100%';
        const radius = p.borderRadius !== undefined ? `${p.borderRadius}px` : '8px';
        const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '20px';

        return `<div style="text-align: ${align}; margin: 0 0 ${mb} 0;">
  <img src="${src}" alt="${alt}" style="max-width: ${width}; height: auto; border-radius: ${radius}; display: inline-block;" />
</div>`;
      }

      case 'divider': {
        const color = p.color || '#e2e8f0';
        const thickness = p.thickness || 1;
        const margin = p.margin !== undefined ? `${p.margin}px` : '24px';
        return `<hr style="border: none; border-top: ${thickness}px solid ${color}; margin: ${margin} 0;" />`;
      }

      case 'spacer': {
        const height = p.height || 24;
        return `<div style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</div>`;
      }

      case 'columns': {
        const left = substituteVariables(p.leftContent || '', variables);
        const right = substituteVariables(p.rightContent || '', variables);
        const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '20px';

        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 ${mb} 0;">
  <tr>
    <td width="48%" valign="top" style="font-size: 14px; line-height: 1.5; color: #334155;">${left}</td>
    <td width="4%">&nbsp;</td>
    <td width="48%" valign="top" style="font-size: 14px; line-height: 1.5; color: #334155;">${right}</td>
  </tr>
</table>`;
      }

      default:
        return p.html || '';
    }
  });

  // Wrap in email container
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .email-body { padding: 36px 32px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-body">
      ${compiledParts.join('\n')}
    </div>
  </div>
</body>
</html>`;
}

export function substituteVariables(text, variables = {}) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

export function createBlock(type) {
  const id = `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  switch (type) {
    case 'heading':
      return {
        id,
        type: 'heading',
        props: {
          level: 2,
          text: 'New Heading',
          align: 'left',
          color: '#0f172a',
          fontSize: '22px',
          marginBottom: 16
        }
      };
    case 'text':
      return {
        id,
        type: 'text',
        props: {
          content: 'Write your message here. You can insert dynamic variables like {{name}}.',
          align: 'left',
          color: '#334155',
          fontSize: 15,
          lineHeight: '1.6',
          marginBottom: 16
        }
      };
    case 'button':
      return {
        id,
        type: 'button',
        props: {
          label: 'Get Started Now',
          url: '{{actionUrl}}',
          align: 'center',
          backgroundColor: '#4f46e5',
          textColor: '#ffffff',
          borderRadius: 8,
          paddingY: 12,
          paddingX: 28,
          marginBottom: 24
        }
      };
    case 'image':
      return {
        id,
        type: 'image',
        props: {
          src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
          alt: 'Header Banner',
          width: 100,
          borderRadius: 8,
          align: 'center',
          marginBottom: 20
        }
      };
    case 'divider':
      return {
        id,
        type: 'divider',
        props: {
          color: '#e2e8f0',
          thickness: 1,
          margin: 24
        }
      };
    case 'spacer':
      return {
        id,
        type: 'spacer',
        props: {
          height: 24
        }
      };
    case 'columns':
      return {
        id,
        type: 'columns',
        props: {
          leftContent: '<strong>Left Feature</strong><br/>Explain your first feature or update with compelling details.',
          rightContent: '<strong>Right Feature</strong><br/>Complement with another section, metric, or resource link.',
          marginBottom: 20
        }
      };
    default:
      return {
        id,
        type: 'text',
        props: { content: 'Default block', marginBottom: 16 }
      };
  }
}
