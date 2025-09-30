import { config } from "../configs/config";

export const verifyEmailTemplate = ({
  name,
  token,
}: {
  name: string;
  token: string;
}) => {
  return `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <table align="center" width="600" style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <tr>
              <td>
                <h2 style="color: #4CAF50;">Welcome, ${name} 🎉</h2>
                <p style="font-size: 16px; color: #333;">
                  Thank you for signing up. Please verify your email by clicking the button below:
                </p>
                <a href="${config.FRONTEND_URL}/verify-email/${token}" 
                   style="display: inline-block; margin: 20px 0; padding: 12px 25px; background: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">
                  Verify Email
                </a>
                <p style="font-size: 14px; color: #888;">
                  If the button doesn't work, copy and paste this link in your browser:
                  <br/>
                  <a href="${config.FRONTEND_URL}/verify-email/${token}">${token}</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
};
