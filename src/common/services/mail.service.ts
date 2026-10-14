import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = (
      this.configService.get<string>('SMTP_HOST') ||
      process.env.SMTP_HOST ||
      'smtp.gmail.com'
    ).trim();
    const port =
      Number(this.configService.get<number>('SMTP_PORT')) ||
      Number(process.env.SMTP_PORT) ||
      587;
    const user = (
      this.configService.get<string>('SMTP_USER') ||
      process.env.SMTP_USER ||
      ''
    ).trim();
    const pass = (
      this.configService.get<string>('SMTP_PASS') ||
      process.env.SMTP_PASS ||
      ''
    ).trim();

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log(`Initialized SMTP transport for user: ${user}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize SMTP transport: ${err?.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn('SMTP credentials not configured. Real emails will not be dispatched.');
    }
  }

  private getFromAddress(): string {
    const rawFrom =
      this.configService.get<string>('SMTP_FROM') || process.env.SMTP_FROM;
    if (rawFrom) {
      return rawFrom.replace(/^["']|["']$/g, '').trim();
    }
    const user = (
      this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER || ''
    ).trim();
    return `"CareerLaunch Platform" <${user || 'no-reply@careerlaunch.com'}>`;
  }

  /**
   * Send Email Verification OTP
   */
  async sendVerificationOtp(
    to: string,
    name: string,
    otp: string,
  ): Promise<boolean> {
    const subject = `${otp} is your CareerLaunch Verification Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #2563eb; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CareerLaunch</h1>
            <p>Student Career Development Platform</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello ${name || 'there'},</p>
            <p>Thank you for registering on CareerLaunch. Please use the following 6-digit confirmation code to verify your account:</p>
            <div class="otp-box">
              <span class="otp-code">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not register for CareerLaunch, please disregard this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CareerLaunch. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(to, subject, html, otp, 'EMAIL_VERIFICATION');
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetOtp(
    to: string,
    name: string,
    otp: string,
  ): Promise<boolean> {
    const subject = `${otp} is your CareerLaunch Password Reset Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .otp-box { background: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CareerLaunch</h1>
            <p>Account Security Center</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${name || 'User'},</p>
            <p>We received a request to reset the password for your CareerLaunch account. Use the 6-digit security code below to complete the reset process:</p>
            <div class="otp-box">
              <span class="otp-code">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request a password reset, your account is still secure and you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CareerLaunch. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(to, subject, html, otp, 'PASSWORD_RESET');
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
    otp: string,
    action: string,
  ): Promise<boolean> {
    // Always log OTP for development traceability
    this.logger.log(`📬 [${action}] OTP generated for ${to}: ${otp}`);

    if (!this.transporter) {
      this.logger.warn(
        `[${action}] SMTP transporter is not initialized. Email was not dispatched across network.`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        html,
      });
      this.logger.log(
        `✅ [${action}] Real email dispatched successfully to ${to}. MessageId: ${info.messageId}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `❌ [${action}] SMTP send failed for ${to}: ${err?.message}`,
      );
      return false;
    }
  }
}
