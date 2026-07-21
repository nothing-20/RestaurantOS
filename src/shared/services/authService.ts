import { User, UserCredential } from 'firebase/auth';
import { TUserRole } from '../types';
import * as firebaseAuth from '../firebase/auth';

/**
 * Service for handling Firebase Authentication operations.
 * Wraps direct Firebase calls with domain-specific operations for RestaurantOS.
 */
export const authService = {
  /**
   * Signs in a user using their email and password.
   * 
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @param rememberMe - Whether to persist the session.
   * @returns A promise resolving to the user credential.
   */
  async signInWithEmail(email: string, password: string, rememberMe: boolean): Promise<UserCredential> {
    return firebaseAuth.signIn(email, password, rememberMe);
  },

  /**
   * Registers a new restaurant owner and seeds the default restaurant data.
   * 
   * @param email - The owner's email address.
   * @param password - The owner's password.
   * @param displayName - The owner's full name.
   * @param restaurantName - The name of the restaurant.
   * @returns A promise resolving to the user credential.
   */
  async signUpOwner(
    email: string, 
    password: string, 
    displayName: string, 
    restaurantName: string
  ): Promise<UserCredential> {
    return firebaseAuth.signUpOwner(email, password, displayName, restaurantName);
  },

  /**
   * Registers a new customer user.
   * 
   * @param email - The customer's email address.
   * @param password - The customer's password.
   * @param fullName - The customer's full name.
   * @param phoneNumber - Optional contact phone number.
   * @returns A promise resolving to the user credential.
   */
  async signUpCustomer(
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string
  ): Promise<UserCredential> {
    return firebaseAuth.signUpCustomer(email, password, fullName, phoneNumber);
  },

  /**
   * Triggers a password reset email for the given email address.
   * 
   * @param email - The email address to reset the password for.
   * @returns A promise that resolves when the reset email is sent.
   */
  async resetPassword(email: string): Promise<void> {
    return firebaseAuth.resetPassword(email);
  },

  /**
   * Signs out the currently authenticated user.
   * 
   * @returns A promise that resolves when the user is signed out.
   */
  async signOutUser(): Promise<void> {
    return firebaseAuth.signOut();
  },

  /**
   * Sends an email verification link to the logged-in user.
   * 
   * @param user - The Firebase User object to send the verification to.
   * @returns A promise that resolves when the email is sent.
   */
  async sendEmailVerificationLink(user: User): Promise<void> {
    return firebaseAuth.sendEmailVerificationLink(user);
  },

  /**
   * Fetches custom claims from the user's ID token, extracting the role and tenantId.
   * 
   * @param user - The Firebase User object.
   * @returns A promise resolving to the user's role and tenantId claims.
   */
  async getUserClaims(user: User): Promise<{ role?: TUserRole; tenantId?: string }> {
    return firebaseAuth.getUserClaims(user);
  }
};
export default authService;

