import { Injectable, Logger } from "@nestjs/common"

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  async sendPaymentFailureNotification(
    userEmail: string,
    userId: string,
    amount: string,
    currency: string,
    errorMessage: string,
    idempotencyKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending payment failure notification to ${userEmail}`)

      // In a real implementation, you would integrate with your email service
      // (e.g., SendGrid, AWS SES, Nodemailer, etc.)

      const emailContent = {
        to: userEmail,
        subject: "Payment Processing Failed",
        html: this.generateFailureEmailTemplate(userId, amount, currency, errorMessage, idempotencyKey),
      }

      // Simulate email sending
      await this.simulateEmailSending(emailContent)

      this.logger.log(`Payment failure notification sent successfully to ${userEmail}`)
    } catch (error) {
      this.logger.error(`Failed to send notification to ${userEmail}: ${error.message}`, error.stack)
      throw error
    }
  }

  private generateFailureEmailTemplate(
    userId: string,
    amount: string,
    currency: string,
    errorMessage: string,
    idempotencyKey: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Processing Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .content { background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; }
          .error-box { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Payment Processing Failed</h2>
          </div>
          
          <div class="content">
            <p>Dear User,</p>
            
            <p>We're writing to inform you that your payment could not be processed after multiple retry attempts.</p>
            
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Amount:</strong> ${amount} ${currency}</li>
              <li><strong>User ID:</strong> ${userId}</li>
              <li><strong>Reference:</strong> ${idempotencyKey}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            
            <div class="error-box">
              <h4>Error Details:</h4>
              <p>${errorMessage}</p>
            </div>
            
            <h3>What happens next?</h3>
            <p>Our system has automatically attempted to process your payment multiple times, but unfortunately, all attempts have failed. This could be due to:</p>
            <ul>
              <li>Temporary blockchain network issues</li>
              <li>Insufficient funds in your wallet</li>
              <li>Network congestion</li>
              <li>Technical issues with the payment processor</li>
            </ul>
            
            <p>Please try initiating the payment again, or contact our support team if you continue to experience issues.</p>
            
            <p>We apologize for any inconvenience this may have caused.</p>
            
            <p>Best regards,<br>The Payment Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private async simulateEmailSending(emailContent: any): Promise<void> {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production, replace this with actual email service integration
    this.logger.log(`Email sent to ${emailContent.to}: ${emailContent.subject}`)
  }
}
