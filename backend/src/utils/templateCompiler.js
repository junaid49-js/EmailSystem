export function compileBlocksToHtml(designJson) {
    if (!designJson || !Array.isArray(designJson.blocks)) {
        return '';
    }

    const htmlParts = designJson.blocks.map(block => {
        const p = { ...block, ...(block.props || {}) };
        const type = block.type || p.type;

        switch (type) {
            case 'heading': {
                const level = p.level || 2;
                const size = p.fontSize || (level === 1 ? '24px' : level === 2 ? '20px' : '18px');
                const align = p.align || 'left';
                const color = p.color || '#0f172a';
                const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '16px';
                const text = p.text || p.content || '';
                return `<h${level} style="margin: 0 0 ${mb} 0; font-size: ${size}; font-weight: 700; color: ${color}; text-align: ${align}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${text}</h${level}>`;
            }

            case 'text': {
                const align = p.align || 'left';
                const color = p.color || '#334155';
                const size = p.fontSize ? `${p.fontSize}px` : '15px';
                const lineHeight = p.lineHeight || '1.6';
                const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '16px';
                const content = p.content || p.text || '';
                return `<p style="margin: 0 0 ${mb} 0; font-size: ${size}; line-height: ${lineHeight}; color: ${color}; text-align: ${align}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${content}</p>`;
            }

            case 'button': {
                const align = p.align || 'center';
                const bg = p.backgroundColor || p.bg || '#2563eb';
                const textColor = p.textColor || p.color || '#ffffff';
                const py = p.paddingY || 12;
                const px = p.paddingX || 28;
                const radius = p.borderRadius !== undefined ? `${p.borderRadius}px` : '8px';
                const mb = p.marginBottom !== undefined ? `${p.marginBottom}px` : '24px';
                const url = p.url || p.href || '#';
                const text = p.label || p.text || 'Click Here';

                return `<div style="text-align: ${align}; margin: 0 0 ${mb} 0;">
  <a href="${url}" target="_blank" style="display: inline-block; background-color: ${bg}; color: ${textColor}; padding: ${py}px ${px}px; text-decoration: none; border-radius: ${radius}; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${text}</a>
</div>`;
            }

            case 'image': {
                const align = p.align || 'center';
                const src = p.src || '';
                const alt = p.alt || '';
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
                const left = p.leftContent || '';
                const right = p.rightContent || '';
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

    return htmlParts.join('\n');
}

export function compileBlocksToText(designJson) {
    if (!designJson || !Array.isArray(designJson.blocks)) {
        return '';
    }

    const textParts = [];

    for (const block of designJson.blocks) {
        const p = { ...block, ...(block.props || {}) };
        const type = block.type || p.type;
        switch (type) {
            case 'heading': {
                const text = p.text || p.content;
                if (text) textParts.push(`${text}\n`);
                break;
            }
            case 'text': {
                const content = p.content || p.text;
                if (content) textParts.push(`${content}\n`);
                break;
            }
            case 'button': {
                const label = p.label || p.text || 'Click Here';
                textParts.push(`${label}: ${p.url || p.href || ''}\n`);
                break;
            }
            case 'divider':
                textParts.push('---\n');
                break;
            case 'columns':
                if (p.leftContent) textParts.push(p.leftContent);
                if (p.rightContent) textParts.push(p.rightContent);
                break;
        }
    }

    return textParts.join('\n');
}

export default {
    compileBlocksToHtml,
    compileBlocksToText
};
