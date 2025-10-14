import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { OTP } from '../models/OTP';

export class EmailService {
  private static getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
    // Use LOGIN auth method for Gmail
    authMethod: 'LOGIN',
      // Disable STARTTLS and force TLS
      requireTLS: true,
      // Debug logging disabled for production
      debug: false,
      logger: false
    });
  }


  private static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async sendVerificationEmail(email: string, firstName: string): Promise<string> {
    const otp = this.generateOTP();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await OTP.deleteMany({ email: email.toLowerCase(), type: 'email_verification' });

    await OTP.create({
      email: email.toLowerCase(),
      otp,
      type: 'email_verification',
      expiresAt
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'MathMentor <noreply@mathmentor.com>',
      to: email,
      subject: 'Verify Your Email - MathMentor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MathMentor!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>Thank you for registering with MathMentor. To complete your registration, please verify your email address using the OTP code below:</p>

              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin-top: 10px; color: #6b7280;">This code will expire in 10 minutes</p>
              </div>

              <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. MathMentor will never ask for your OTP via phone or email.
              </div>

              <p>If you didn't request this verification, please ignore this email.</p>

              <p>Best regards,<br>The MathMentor Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MathMentor. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
      return 'OTP sent successfully';
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  static async sendVerificationLinkEmail(email: string, firstName: string): Promise<string> {
    // Generate a JWT token for email verification
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { email: email.toLowerCase(), type: 'email_verification' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Generated verification token for email:', email.toLowerCase());
    console.log('Token preview:', token.substring(0, 20) + '...');

    // Determine the base URL for verification links
    // This should be the full URL of the backend API server
    const baseUrl = process.env.API_BASE_URL || process.env.BASE_URL || 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email-link?token=${token}`;
    console.log('Verification URL:', verificationUrl);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'MathMentor <noreply@mathmentor.com>',
      to: email,
      subject: 'Verify Your Email - MathMentor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MathMentor!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>Thank you for registering with MathMentor. To complete your registration, please verify your email address by clicking the button below:</p>

              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify My Email</a>
              </div>

              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>

              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
              </div>

              <p>Best regards,<br>The MathMentor Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MathMentor. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
      return 'Verification link sent successfully';
    } catch (error: any) {
      console.error('Error sending verification link email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  static async sendPasswordResetEmail(email: string, firstName: string): Promise<string> {
    const otp = this.generateOTP();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await OTP.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });

    await OTP.create({
      email: email.toLowerCase(),
      otp,
      type: 'password_reset',
      expiresAt
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'MathMentor <noreply@mathmentor.com>',
      to: email,
      subject: 'Reset Your Password - MathMentor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>We received a request to reset your MathMentor password. Use the OTP code below to reset your password:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin-top: 10px; color: #6b7280;">This code will expire in 10 minutes</p>
              </div>

              <div class="warning">
                <strong>Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </div>

              <p>For security reasons, this code can only be used once and will expire in 10 minutes.</p>
              
              <p>Best regards,<br>The MathMentor Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MathMentor. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
      return 'Password reset OTP sent successfully';
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  static async verifyOTP(email: string, otp: string, type: 'email_verification' | 'password_reset'): Promise<boolean> {
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      type,
      verified: false,
      expiresAt: { $gt: new Date() }
    }).select('+otp');

    if (!otpDoc) {
      throw new Error('Invalid or expired OTP');
    }

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      throw new Error('Too many failed attempts. Please request a new OTP');
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new Error('Invalid OTP');
    }

    otpDoc.verified = true;
    await otpDoc.save();
    return true;
  }

  static async resendOTP(email: string, type: 'email_verification' | 'password_reset', firstName: string): Promise<string> {
    await OTP.deleteMany({ email: email.toLowerCase(), type });

    if (type === 'email_verification') {
      return this.sendVerificationEmail(email, firstName);
    } else {
      return this.sendPasswordResetEmail(email, firstName);
    }
  }
}

