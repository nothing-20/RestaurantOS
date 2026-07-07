import { User, UserCredential } from 'firebase/auth';
import { TUserRole } from '../types';
import * as firebaseAuth from '../firebase/auth';

export const authService = {
  async signInWithEmail(email: string, password: string, rememberMe: boolean): Promise<UserCredential> {
    return firebaseAuth.signIn(email, password, rememberMe);
  },

  async signUpOwner(
    email: string, 
    password: string, 
    displayName: string, 
    restaurantName: string
  ): Promise<UserCredential> {
    return firebaseAuth.signUpOwner(email, password, displayName, restaurantName);
  },

  async signUpCustomer(
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string
  ): Promise<UserCredential> {
    return firebaseAuth.signUpCustomer(email, password, fullName, phoneNumber);
  },

  async resetPassword(email: string): Promise<void> {
    return firebaseAuth.resetPassword(email);
  },

  async signOutUser(): Promise<void> {
    return firebaseAuth.signOut();
  },

  async sendEmailVerificationLink(user: User): Promise<void> {
    return firebaseAuth.sendEmailVerificationLink(user);
  },

  async getUserClaims(user: User): Promise<{ role?: TUserRole; tenantId?: string }> {
    return firebaseAuth.getUserClaims(user);
  }
};
export default authService;
