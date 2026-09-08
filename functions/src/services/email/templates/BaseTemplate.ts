export const getBaseTemplate = (title: string, bodyContent: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #020617;
            color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            max-width: 600px;
            margin: 40px auto;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          }
          .header {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #020617;
            font-size: 24px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 20px;
            font-size: 15px;
            color: #cbd5e1;
          }
          .btn-container {
            margin: 32px 0;
            text-align: center;
          }
          .btn {
            display: inline-block;
            background: #f59e0b;
            color: #020617 !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 12px;
            transition: all 0.3s ease;
          }
          .footer {
            padding: 32px;
            border-top: 1px solid #1e293b;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            background: #090d16;
          }
          .footer p {
            margin: 0 0 8px;
          }
          .footer a {
            color: #f59e0b;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>RestaurantOS</h1>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>Sent via <strong>RestaurantOS Enterprise</strong></p>
            <p>&copy; ${new Date().getFullYear()} RestaurantOS. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
