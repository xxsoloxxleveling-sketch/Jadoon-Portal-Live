import logger from './logger';

// Simulation of an SMS Gateway Integration (e.g., Twilio, local Pakistani JS SMS API)

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  logger.info(`\n================= SMS GATEWAY TRIGGERED =================`);
  logger.info(`📲 TO:    ${phoneNumber}`);
  logger.info(`💬 MSG:   ${message}`);
  logger.info(`=========================================================\n`);

  return true;
}
