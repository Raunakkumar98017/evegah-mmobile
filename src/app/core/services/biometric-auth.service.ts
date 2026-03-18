import { Injectable } from '@angular/core';
import { NativeBiometric } from 'capacitor-native-biometric';

@Injectable({
  providedIn: 'root',
})
export class BiometricAuthService {
  private readonly credentialServerKey = 'io.ionic.evegah';

  async isAvailable(): Promise<boolean> {
    try {
      const status = await NativeBiometric.isAvailable();
      return !!status?.isAvailable;
    } catch {
      return false;
    }
  }

  async saveCredential(mobileNumber: string): Promise<boolean> {
    try {
      await NativeBiometric.setCredentials({
        username: mobileNumber,
        password: mobileNumber,
        server: this.credentialServerKey,
      });
      return true;
    } catch {
      return false;
    }
  }

  async hasCredential(): Promise<boolean> {
    try {
      const credential = await NativeBiometric.getCredentials({ server: this.credentialServerKey });
      return !!credential?.username;
    } catch {
      return false;
    }
  }

  async verifyIdentity(reason = 'Authenticate to continue'): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Biometric Login',
        subtitle: 'Use your biometrics to login quickly',
        description: 'Confirm your identity to continue',
        maxAttempts: 2,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getMobileNumberFromCredential(): Promise<string | null> {
    try {
      const credential = await NativeBiometric.getCredentials({ server: this.credentialServerKey });
      return credential?.username || null;
    } catch {
      return null;
    }
  }

  async clearCredential(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({ server: this.credentialServerKey });
    } catch {
      // Ignore cleanup failures.
    }
  }
}
