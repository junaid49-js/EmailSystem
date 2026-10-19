export function renderBaseLayout({ title, previewText = '', content }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f8;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 36px 40px;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }
    .button-container {
      margin: 28px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      padding: 24px 40px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table class="wrapper" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1>Email System</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0;">This email was sent by EmailSystem.</p>
            <p style="margin: 0;">If you did not request this email, please ignore it.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeEmailTemplate({ name, loginUrl = 'http://localhost:3000' }) {
    const content = `
      <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Welcome to the Platform, ${name}!</h2>
      <p>Your administrative account has been successfully created. You can now access the management dashboard.</p>
      <div class="button-container">
        <a href="${loginUrl}" class="button" target="_blank">Access Dashboard</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you have any questions or require assistance, please contact your Super Administrator.</p>
    `;
    return {
        subject: 'Welcome to Email System',
        html: renderBaseLayout({
            title: 'Welcome to Email System',
            previewText: `Welcome ${name}! Your account is now active.`,
            content
        }),
        text: `Welcome to Email System, ${name}!\n\nYour account has been created. You can access the dashboard here: ${loginUrl}\n`
    };
}

export function passwordResetTemplate({ name, resetUrl, expiresInMinutes = 60 }) {
    const content = `
      <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your administrator account. Click the button below to set a new password:</p>
      <div class="button-container">
        <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">This link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    `;
    return {
        subject: 'Password Reset Request',
        html: renderBaseLayout({
            title: 'Password Reset',
            previewText: 'Reset your administrator password',
            content
        }),
        text: `Hello ${name},\n\nWe received a request to reset your password. Use the link below (valid for ${expiresInMinutes} minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n`
    };
}

export function adminInviteTemplate({ name, invitedByName = 'Super Admin', loginUrl = 'http://localhost:3000', tempPassword }) {
    const content = `
      <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">You've Been Invited to Administer Email System</h2>
      <p>Hello ${name},</p>
      <p><strong>${invitedByName}</strong> has invited you to join Email System as an Administrator.</p>
      ${tempPassword ? `<p>Your temporary password is: <code style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0f172a;">${tempPassword}</code></p>` : ''}
      <div class="button-container">
        <a href="${loginUrl}" class="button" target="_blank">Log In to Your Account</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Please change your temporary password immediately upon your first login.</p>
    `;
    return {
        subject: 'Invitation to Join Email System as Administrator',
        html: renderBaseLayout({
            title: 'Administrator Invitation',
            previewText: `You have been invited to Email System by ${invitedByName}`,
            content
        }),
        text: `Hello ${name},\n\n${invitedByName} has invited you to join Email System as an Administrator.\n${tempPassword ? `Temporary Password: ${tempPassword}\n` : ''}Log in here: ${loginUrl}\n`
    };
}
