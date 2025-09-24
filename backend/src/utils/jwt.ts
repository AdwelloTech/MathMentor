import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate an access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRE || '24h';

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'mathmentor-backend',
    audience: 'mathmentor-client'
  } as jwt.SignOptions);
};

/**
 * Generate a refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'mathmentor-backend',
    audience: 'mathmentor-client'
  } as jwt.SignOptions);
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'mathmentor-backend',
      audience: 'mathmentor-client'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'mathmentor-backend',
      audience: 'mathmentor-client'
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate token pair for user
 */
export const generateTokenPair = (userId: string | Types.ObjectId, email: string, role: string) => {
  const tokenId = new Types.ObjectId().toString();

  const accessToken = generateAccessToken({
    userId: userId.toString(),
    email,
    role
  });

  const refreshToken = generateRefreshToken({
    userId: userId.toString(),
    tokenId
  });

  return {
    accessToken,
    refreshToken,
    tokenId
  };
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded.exp) {
      throw new Error('Token does not have expiration time');
    }
    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    throw new Error('Invalid token format');
  }
};
