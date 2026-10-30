export const DEFAULT_CERTIFICATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{certificate_type}} - {{recipient_name}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Alex+Brush&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Montserrat', sans-serif;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .certificate-container {
      width: 1050px;
      height: 742px;
      background: #ffffff;
      padding: 36px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    /* Double Ornamental Borders */
    .border-outer {
      width: 100%;
      height: 100%;
      border: 4px solid #002855;
      padding: 8px;
      position: relative;
    }

    .border-inner {
      width: 100%;
      height: 100%;
      border: 1.5px solid #FFA300;
      padding: 28px 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: radial-gradient(circle at center, #ffffff 60%, #f9fbfd 100%);
    }

    /* Corner IEEE Motifs */
    .corner {
      position: absolute;
      width: 32px;
      height: 32px;
      border-color: #00629B;
    }
    .corner-tl { top: 0; left: 0; border-top: 4px solid #00629B; border-left: 4px solid #00629B; }
    .corner-tr { top: 0; right: 0; border-top: 4px solid #00629B; border-right: 4px solid #00629B; }
    .corner-bl { bottom: 0; left: 0; border-bottom: 4px solid #00629B; border-left: 4px solid #00629B; }
    .corner-br { bottom: 0; right: 0; border-bottom: 4px solid #00629B; border-right: 4px solid #00629B; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 14px;
    }

    .chapter-brand {
      text-align: left;
    }

    .chapter-brand h2 {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 800;
      color: #002855;
      letter-spacing: 1.5px;
    }

    .chapter-brand p {
      font-size: 11px;
      font-weight: 600;
      color: #00629B;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 2px;
    }

    .badge-pill {
      background: #002855;
      color: #FFA300;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Main Certificate Title */
    .title-area {
      text-align: center;
      margin-top: 10px;
    }

    .title-area h1 {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      color: #002855;
      letter-spacing: 3px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .subtitle {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* Recipient Section */
    .recipient-area {
      text-align: center;
      margin: 12px 0;
    }

    .present-to {
      font-size: 12px;
      font-style: italic;
      color: #475569;
      font-family: 'Playfair Display', serif;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #002855;
      margin: 8px 0 4px 0;
      border-bottom: 2px solid #FFA300;
      display: inline-block;
      padding: 0 32px 4px 32px;
    }

    .citation {
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      max-width: 780px;
      margin: 8px auto 0 auto;
    }

    .citation strong {
      color: #002855;
      font-weight: 700;
    }

    /* Signatures & QR Section */
    .footer-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .sig-block {
      text-align: center;
      width: 220px;
    }

    .signature-line {
      width: 100%;
      height: 1.5px;
      background: #94a3b8;
      margin: 36px auto 6px auto;
    }

    .sig-name {
      font-size: 13px;
      font-weight: 700;
      color: #002855;
    }

    .sig-role {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* QR Code and Registry details */
    .qr-block {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .qr-image {
      width: 64px;
      height: 64px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px;
    }

    .qr-details {
      text-align: left;
    }

    .code-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }

    .code-value {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #00629B;
      letter-spacing: 1px;
    }

    .verify-url {
      font-size: 9px;
      color: #475569;
      margin-top: 2px;
    }

    .statement {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      margin-top: 8px;
    }
  </style>
</head>
<body>

  <div class="certificate-container">
    <div class="border-outer">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>

      <div class="border-inner">
        <!-- Header -->
        <div class="header">
          <div class="chapter-brand" style="display: flex; align-items: center; gap: 14px;">
            <img src="{{logo_url}}" alt="IEEE Computer Society" style="height: 44px; width: auto; object-fit: contain;" />
            <div style="border-left: 1.5px solid #002855; padding-left: 12px;">
              <h2 style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: 800; color: #002855; letter-spacing: 1px; margin: 0; text-transform: uppercase;">UCET – IUB</h2>
              <p style="font-size: 10px; font-weight: 600; color: #00629B; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0 0 0;">Student Branch Chapter · Lahore Section</p>
            </div>
          </div>
          <div class="badge-pill">
            {{recognition_level}}
          </div>
        </div>

        <!-- Title -->
        <div class="title-area">
          <h1>{{certificate_type}}</h1>
          <div class="subtitle">Official Chapter Credential Registry</div>
        </div>

        <!-- Recipient -->
        <div class="recipient-area">
          <p class="present-to">This certificate is proudly awarded to</p>
          <div class="recipient-name">{{recipient_name}}</div>
          <p class="citation">
            in recognition of active attendance, technical participation, and successful completion of the chapter event 
            <strong>"{{event_title}}"</strong> held on <strong>{{activity_date}}</strong> at UCET - The Islamia University of Bahawalpur.
          </p>
        </div>

        <!-- Signatures & Verification -->
        <div>
          <div class="footer-area">
            <!-- Signature 1: Chapter Admin / Chair -->
            <div class="sig-block">
              <div style="height: 40px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px;">{{chair_signature}}</div>
              <div class="signature-line"></div>
              <div class="sig-name">{{approver_name}}</div>
              <div class="sig-role">{{approver_role}}</div>
            </div>

            <!-- Central QR Verification Block -->
            <div class="qr-block">
              <img src="{{qr_code}}" alt="QR Code" class="qr-image" />
              <div class="qr-details">
                <div class="code-label">Verification Code</div>
                <div class="code-value">{{code}}</div>
                <div class="verify-url">Scan or verify at /verify/{{code}}</div>
                <div class="verify-url" style="color: #64748b;">Issued: {{issue_date}}</div>
              </div>
            </div>

            <!-- Signature 2: Advisor / Academic Oversight -->
            <div class="sig-block">
              <div style="height: 40px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px;">{{advisor_signature}}</div>
              <div class="signature-line"></div>
              <div class="sig-name">{{advisor_name}}</div>
              <div class="sig-role">Faculty Advisory Committee</div>
            </div>
          </div>

          <div class="statement">
            {{issuer_statement}} · Authenticity verifiable worldwide on the official IEEE CS UCET-IUB registry.
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

