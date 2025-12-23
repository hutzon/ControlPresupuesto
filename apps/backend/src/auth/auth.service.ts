import { Injectable, UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 1. Register
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
    });

    // Generate Tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.excludePassword(user), ...tokens };
  }

  // 2. Login
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.excludePassword(user), ...tokens };
  }

  // 3. Logout
  async logout(userId: string) {
    // Revoke tokens by setting revoked=true or deleting. 
    // Plan says: "Revocación explícita (logout) elimina el registro o marca como revocado."
    // Let's mark as revoked for audit, or delete active ones.
    // For simplicity and rotation: we can delete the record or mark it.
    // Let's implement revocation by verifying the token hash exists and is valid.
    // Here we will sign out all sessions or specific? Usually logout is current session. 
    // But we might not have the refresh token content here if only access token is used.
    // If logout endpoint receives only access token, we can't identify WHICH refresh token to revoke unless we track it.
    // Standard secure logout: clear the cookie. Server side: optional if short lived access.
    // BUT we have rotation. Let's delete all tokens for this user for MVP simplicity on "global logout" or pass the refresh token to revoke specific.
    // Spec says: "POST /auth/logout - revoca sesión/refresh".
    // We will assume the controller extracts userId from AccessToken. We will revoke ALL for safety or none?
    // Better: Require Refresh Token on logout to revoke THAT specific one. 
    // But usually logout just kills the cookie. 
    // Let's clear all refresh tokens for the user for this dev stage (secure default).
    
    // Better strategy for "One-time use": Delete all user's refresh tokens? No, that kills other devices.
    // Since we don't have the refresh token in the args here yet (depends on controller),
    // let's just make a method 'revokeRefreshToken(userId, hashedRT)' and 'revokeAll(userId)'.
    
    // For MVP: Revoke All is safest and easiest.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  // 4. Refresh Token Rotation
  async refreshTokens(userId: string, incomingRefreshToken: string) {
    // Find all tokens for user
    // We need to match the incomingRefreshToken with the hashed one in DB.
    // Since we can't query by hash (bcrypt is salted), we might need to store the token id in the payload or iterate?
    // No, bcrypt is slow for lookup. 
    // OPTIMIZATION: We should store the plain token? NO.
    // Standard way: Store a fast hash (SHA256) for lookup, or store ID in the JWT payload.
    // Let's decode the incoming JWT to get the JTI or some ID if we put it there?
    // Or we simply verify the signature first.
    
    // Step A: Verify signature
    try {
      const payload = this.jwtService.verify(incomingRefreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      if (payload.sub !== userId) throw new ForbiddenException('Access Denied');
    } catch (e) {
      throw new ForbiddenException('Access Denied');
    }
    
    // We need to find the specific token in DB to revoke it (rotation).
    // Problem: If we use bcrypt for storage, we can't find it easily. 
    // Solution: RefreshToken model needs to store the FAMILY or ID. 
    // Usually, Refresh Token is just a random string, not a JWT? 
    // Spec says "Refresh Token (largo)". It can be a random string or JWT. 
    // If it is opaque string, we execute sha256 to find it.
    // Let's assume it's a Signed JWT for stateless validity check + DB check for revocation.
    // To find it in DB, we'd need to compare.
    // Let's use `argon2` or `bcrypt` to compare `incoming` against `stored`.
    // If we have multiple, we have to iterate? That's bad.
    // FIX: The RefreshToken JWT payload should contain the `tokenId` (db id).
    
    // Let's assume we decode it (already verified above).
    // But `jwtService.verify` returns payload. We need `jti` or `tokenId` in payload.
    // We will add `tokenId` to payload in `generateTokens`.
    
    // So:
    // 1. Verify and decode (done).
    // 2. Get `tokenId` from payload.
    // 3. Find in DB.
    // 4. Check if revoked.
    // 5. Rotate.
    return { accessToken: '...', refreshToken: '...' }; // Placeholder, implementation below
  }
  
  // Implementation details for Refresh will be filled after fixing the "Finding" issue.
  // For now, let's setup the helpers.

  async generateTokens(userId: string, email: string) {
    // We create a DB record FIRST to get the ID, then put ID in token? 
    // Or Put random ID in token, then save?
    // Let's use generated UUID for the DB record.
    
    // 1. Create Access Token (short lived)
    const atPayload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(atPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    // 2. Create Refresh Token (long lived)
    // We'll Create the record in DB first? No we need the token hash.
    // Let's generate a temporary ID or just usage random payload?
    // Let's use a standard pattern: Token payload has 'sub' and 'email'.
    // We sign it. The signature makes it unique? No.
    // Let's add 'jti' (Join Token ID) - a uuid.
    
    const refreshTokenId = crypto.randomUUID();
    const rtPayload = { sub: userId, email, jti: refreshTokenId }; // jti is the ID in DB?
    
    const refreshToken = await this.jwtService.signAsync(rtPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    
    return { accessToken, refreshToken, refreshTokenId }; 
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    // Hash it
    const hash = await bcrypt.hash(refreshToken, 10);
    // Decode to get JTI to store as ID? Or just store.
    // In our Schema: id is uuid.
    // We can use the 'jti' from the payload as the Primary Key of the table?
    // Yes.
    
    const payload = this.jwtService.decode(refreshToken) as any;
    const tokenId = payload.jti;

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: userId,
        hashedToken: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
  
  // Helper
  private excludePassword(user: any) {
    const { password, ...result } = user;
    return result;
  }
}
